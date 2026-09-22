# サイト改善ループの日次ジョブを Windows タスクスケジューラに登録する（何度実行しても同じ結果になる）
#   pwsh -File scripts/site/register-task.ps1            # 登録・更新（毎日 04:30）
#   pwsh -File scripts/site/register-task.ps1 -Remove    # 削除
param([switch]$Remove)

$name = 'mensumbrella-site-daily'
if ($Remove) {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
    "削除: $name"
    return
}

$pwsh = (Get-Command pwsh).Source
$script = Join-Path $PSScriptRoot 'run-daily.ps1'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$action = New-ScheduledTaskAction -Execute $pwsh `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$script`""
Register-ScheduledTask -TaskName $name -Trigger (New-ScheduledTaskTrigger -Daily -At '04:30') `
    -Action $action -Settings $settings -Force `
    -Description 'GA4の日次実績を保存し、期限の来たサイト改善の実験を判定してDiscordへ通知' | Out-Null
"登録: $name  (毎日 04:30)"
