# Threads→ブログ基盤の定期実行ジョブ（タスクスケジューラから呼ばれる）
#   pwsh -File run-job.ps1 <job>
# job: research | validate | blog | care | library | improve | post1 | post2 | post3 | watch | refresh-token
# ログ: scripts/threads/logs/<日付>-<job>.log（古いものは30日で削除）
param([Parameter(Mandatory = $true)][string]$Job)

$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $root
$logDir = Join-Path $root 'scripts\threads\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir ("{0}-{1}.log" -f (Get-Date -Format 'yyyy-MM-dd'), $Job)
Get-ChildItem $logDir -Filter '*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force

$env:PYTHONIOENCODING = 'utf-8'
# 子プロセス(claude/python)のUTF-8出力を文字化けさせずに受け取る
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$tools = @(
    'Agent', 'Read', 'Write', 'Grep', 'Glob', 'WebSearch', 'WebFetch',
    'Bash(python scripts/threads/*)', 'Bash(python scripts/reflect/*)', 'Bash(mkdir *)'
)

function Invoke-Claude([string]$Step) {
    $prompt = ".claude/skills/threads-run/SKILL.md の手順に従って、Threads→ブログ基盤の「$Step」工程だけを実行してください。" +
        "実際の Threads への投稿（--live）は、この工程では絶対にしないでください。完了したら結果を短く報告してください。" +
        "報告の最後の1行は必ず RESULT: ok（工程を完了）/ RESULT: partial（一部できなかった）/ RESULT: error（工程を完了できなかった）のどれか1つだけにしてください。"
    & claude -p $prompt --allowedTools ($tools -join ',') 2>&1
}

# 自律改善の「考える人」。書いてよいのは scripts/improve/_work/ だけ。git は触らせない（反映は improve.py tick）
$improveTools = @(
    'Read', 'Grep', 'Glob', 'Write(scripts/improve/_work/**)', 'Edit(scripts/improve/_work/**)',
    'Bash(python scripts/improve/improve.py draft *)', 'Bash(python scripts/improve/improve.py status*)',
    'Bash(python scripts/reflect/*)', 'Bash(python scripts/threads/tdb.py *)', 'Bash(python scripts/threads/health.py*)',
    'Bash(mkdir *)'
)

function Invoke-Improver {
    $prompt = ".claude/agents/auto-improver.md の人格で、.claude/skills/self-improve/SKILL.md の手順どおりに自律改善の起草を行ってください。" +
        "ファイルを書いてよいのは scripts/improve/_work/ の中だけです。リポジトリの本物のファイルを直接書き換えたり、git を操作したりしないでください。" +
        "報告の最後の1行は必ず RESULT: ok / RESULT: partial / RESULT: error のどれか1つだけにしてください。"
    & claude -p $prompt --allowedTools ($improveTools -join ',') 2>&1
}

"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') job=$Job ===" | Out-File $log -Encoding utf8 -Append
# 稼働タイムライン（/admin/activity）に「実行中」を出す。失敗しても本体は続ける
& python scripts/threads/run_log.py --job $Job --start 2>&1 | Out-File $log -Encoding utf8 -Append
$out = switch ($Job) {
    'research'      { Invoke-Claude 'research' }
    'validate'      { Invoke-Claude 'validate' }
    'blog'          { Invoke-Claude 'blog' }
    'care'          { Invoke-Claude 'care' }
    'library'       { Invoke-Claude 'library' }
    # 起草のあと、承認済みの反映と7日たった変更の効果確認（悪化・変化なしは元に戻す）をスクリプトが行う
    'improve'       { Invoke-Improver; $first = $LASTEXITCODE; & python scripts/improve/improve.py tick 2>&1; if ($first -ne 0) { $global:LASTEXITCODE = $first } }
    'post1'         { & python scripts/threads/threads_api.py post-due --slot 1 --live 2>&1 }
    'post2'         { & python scripts/threads/threads_api.py post-due --slot 2 --live 2>&1 }
    'post3'         { & python scripts/threads/threads_api.py post-due --slot 3 --live 2>&1 }
    # 見張りのついでに、日中に承認された自律改善を反映する
    'watch'         { & python scripts/threads/watch.py 2>&1; $first = $LASTEXITCODE; & python scripts/improve/improve.py tick 2>&1; $global:LASTEXITCODE = $first }
    'refresh-token' { & python scripts/threads/threads_api.py refresh-token 2>&1 }
    default         { "unknown job: $Job" }
}
$code = $LASTEXITCODE
$out | Out-File $log -Encoding utf8 -Append
"exit=$code" | Out-File $log -Encoding utf8 -Append
# 業務日報（agent_runs）に1行残す。失敗しても本体の結果は変えない
& python scripts/threads/run_log.py --job $Job --exit ([int]$code) --log $log 2>&1 | Out-File $log -Encoding utf8 -Append
# 検証のあと、今日の3本をDiscordに送る（末尾にダッシュボードURL付き）
if ($Job -eq 'validate' -and $code -eq 0) {
    & python scripts/threads/threads_notify.py plan 2>&1 | Out-File $log -Encoding utf8 -Append
}
exit $code
