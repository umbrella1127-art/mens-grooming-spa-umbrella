# GA4週次分析のタスクを登録する（何度実行しても同じ結果）。毎週月曜 09:15
#   pwsh -File scripts/site/register-weekly.ps1
$ErrorActionPreference = 'Stop'
$pwsh = (Get-Command pwsh).Source
$script = Join-Path $PSScriptRoot 'run-weekly.ps1'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew
$action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At '09:15'
Register-ScheduledTask -TaskName 'mensumbrella-site-weekly' -Action $action -Trigger $trigger -Settings $settings `
    -Description 'GA4の週次分析（流入元別・ページ別のLINEクリック率→所見と実験案）' -Force | Out-Null
"登録: mensumbrella-site-weekly"
