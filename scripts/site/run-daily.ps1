# サイト改善ループの日次ジョブ（タスクスケジューラから呼ばれる）
#   pwsh -File scripts/site/run-daily.ps1
# ログ: scripts/site/logs/<日付>.log（古いものは30日で削除）
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
$logDir = Join-Path $root 'scripts\site\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir ("{0}.log" -f (Get-Date -Format 'yyyy-MM-dd'))
Get-ChildItem $logDir -Filter '*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force

$env:PYTHONIOENCODING = 'utf-8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') site-daily ===" | Out-File $log -Encoding utf8 -Append
& python scripts/threads/run_log.py --routine site:daily --start 2>&1 | Out-File $log -Encoding utf8 -Append
$out = & python scripts/site/daily.py 2>&1
$code = $LASTEXITCODE
$out | Out-File $log -Encoding utf8 -Append
"exit=$code" | Out-File $log -Encoding utf8 -Append
# 業務日報（agent_runs）に残す（/admin/activity の時間割がこれを読む）
& python scripts/threads/run_log.py --routine site:daily --exit ([int]$code) --log $log 2>&1 | Out-File $log -Encoding utf8 -Append
exit $code
