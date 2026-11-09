# エラー監視・修復の定期実行（タスクスケジューラから呼ばれる）
#   pwsh -File scripts/monitor/run-monitor.ps1 watchdog   # 2時間おき＋ログオン時。Claudeを呼ばない
#   pwsh -File scripts/monitor/run-monitor.ps1 fixer      # 毎日 07:45。対象があるときだけ error-fixer（Claude）を呼ぶ
# ログ: scripts/monitor/logs/<日付>-<job>.log（30日で削除）
param([Parameter(Mandatory = $true)][ValidateSet('watchdog', 'fixer')][string]$Job)

$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
$logDir = Join-Path $root 'scripts\monitor\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir ("{0}-{1}.log" -f (Get-Date -Format 'yyyy-MM-dd'), $Job)
Get-ChildItem $logDir -Filter '*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force

$env:PYTHONIOENCODING = 'utf-8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($tool in @(@{ N = 'python'; D = "$env:LOCALAPPDATA\Programs\Python\Python313" }, @{ N = 'claude'; D = "$env:USERPROFILE\.local\bin" })) {
    if (-not (Get-Command $tool.N -ErrorAction SilentlyContinue) -and (Test-Path $tool.D)) { $env:PATH = "$($tool.D);$env:PATH" }
}

"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') monitor:$Job ===" | Out-File $log -Encoding utf8 -Append

if ($Job -eq 'watchdog') {
    $out = & python scripts/monitor/watchdog.py 2>&1
    $code = $LASTEXITCODE
}
else {
    $queue = & python scripts/monitor/issues.py queue 2>&1
    $queue | Out-File $log -Encoding utf8 -Append
    if ($queue -match '対象 0件') {
        $out = '修復の対象なし'
        $code = 0
    }
    else {
        & python scripts/threads/run_log.py --routine monitor:fixer --start 2>&1 | Out-File $log -Encoding utf8 -Append
        # 書いてよいのは scripts/improve/_work/ だけ。反映・git・投稿・タスク登録は触らせない（反映は承認後に improve.py tick）
        $tools = @('Read', 'Grep', 'Glob', 'Write(scripts/improve/_work/**)', 'Edit(scripts/improve/_work/**)',
            'Bash(python scripts/monitor/issues.py *)', 'Bash(python scripts/improve/improve.py draft *)',
            'Bash(python scripts/improve/improve.py status*)', 'Bash(python scripts/reflect/*)', 'Bash(mkdir *)')
        $prompt = ".claude/agents/error-fixer.md の人格で、.claude/skills/error-fix/SKILL.md の手順どおりに、未解決の異常を調べて対処してください。" +
            "秘密情報(.env*)・タスクスケジューラ・実投稿(--live)・git は絶対に操作しないでください。" +
            "報告の最後の1行は必ず RESULT: ok / RESULT: partial / RESULT: error のどれか1つだけにしてください。"
        $out = & claude -p $prompt --allowedTools ($tools -join ',') 2>&1
        $code = $LASTEXITCODE
    }
}
$out | Out-File $log -Encoding utf8 -Append
"exit=$code" | Out-File $log -Encoding utf8 -Append
if ($Job -eq 'fixer' -and $queue -notmatch '対象 0件') {
    & python scripts/threads/run_log.py --routine monitor:fixer --exit ([int]$code) --log $log 2>&1 | Out-File $log -Encoding utf8 -Append
}
exit $code
