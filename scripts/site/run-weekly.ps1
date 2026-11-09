# GA4の週次分析（毎週月曜 09:15。タスクスケジューラから呼ばれる）
#   pwsh -File scripts/site/run-weekly.ps1
# 登録: pwsh -File scripts/site/register-weekly.ps1
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
$logDir = Join-Path $root 'scripts\site\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir ("{0}-weekly.log" -f (Get-Date -Format 'yyyy-MM-dd'))

$env:PYTHONIOENCODING = 'utf-8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($tool in @(@{ N = 'python'; D = "$env:LOCALAPPDATA\Programs\Python\Python313" }, @{ N = 'claude'; D = "$env:USERPROFILE\.local\bin" })) {
    if (-not (Get-Command $tool.N -ErrorAction SilentlyContinue) -and (Test-Path $tool.D)) { $env:PATH = "$($tool.D);$env:PATH" }
}

"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') site-weekly ===" | Out-File $log -Encoding utf8 -Append
& python scripts/threads/run_log.py --routine site:weekly --start 2>&1 | Out-File $log -Encoding utf8 -Append
# 書いてよいのは findings への記録と通知・振り返りだけ。サイトのコード・DB本体・実験の登録は触らせない
$tools = @('Read', 'Grep', 'Bash(python scripts/site/analyze.py*)', 'Bash(python scripts/hpb/db_put.py --finding*)',
    'Write(scripts/site/_report/**)', 'Bash(python scripts/hpb/db_put.py --report*)', 'Bash(python -c "from datetime*)', 'Bash(mkdir *)',
    'Bash(python scripts/threads/threads_notify.py*)', 'Bash(python scripts/reflect/*)')
$prompt = ".claude/agents/ga4-analyst.md の人格で、.claude/skills/ga4-analysis/SKILL.md の手順どおりに今週のGA4分析を行ってください。" +
    "報告の最後の1行は必ず RESULT: ok / RESULT: partial / RESULT: error のどれか1つだけにしてください。"
$out = & claude -p $prompt --allowedTools ($tools -join ',') 2>&1
$code = $LASTEXITCODE
$out | Out-File $log -Encoding utf8 -Append
"exit=$code" | Out-File $log -Encoding utf8 -Append
& python scripts/threads/run_log.py --routine site:weekly --exit ([int]$code) --log $log 2>&1 | Out-File $log -Encoding utf8 -Append
exit $code
