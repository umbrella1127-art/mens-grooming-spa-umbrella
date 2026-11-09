# エラー監視・修復のタスクを登録する（何度実行しても同じ結果になる）
#   pwsh -File scripts/monitor/register-tasks.ps1          # 登録・更新
#   pwsh -File scripts/monitor/register-tasks.ps1 -Remove  # 削除
# 起動は pwsh を直接呼ぶ。wscript 経由(run-hidden.vbs)はスケジューラから起動すると失敗した実績があるので使わない。
# 監視が止まっていることに気づけるよう、2時間おき＋ログオン時＋取りこぼしの追い実行(StartWhenAvailable)にしている。
param([switch]$Remove)

$names = 'mensumbrella-monitor-watchdog', 'mensumbrella-monitor-fixer'
if ($Remove) {
    foreach ($n in $names) { Unregister-ScheduledTask -TaskName $n -Confirm:$false -ErrorAction SilentlyContinue; "削除: $n" }
    return
}
$pwsh = (Get-Command pwsh).Source
$script = Join-Path $PSScriptRoot 'run-monitor.ps1'
$ErrorActionPreference = 'Stop'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew

function Register([string]$name, [string]$job, $triggers, [string]$desc) {
    $action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$script`" $job"
    Register-ScheduledTask -TaskName $name -Action $action -Trigger $triggers -Settings $settings -Description $desc -Force | Out-Null
    "登録: $name"
}

$every2h = New-ScheduledTaskTrigger -Once -At '00:10' -RepetitionInterval (New-TimeSpan -Hours 2) -RepetitionDuration (New-TimeSpan -Days 1)
$atLogon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
Register $names[0] 'watchdog' @($every2h, $atLogon) 'エラー監視と決まった範囲の自動修復（2時間おき・ログオン時）'
Register $names[1] 'fixer' (New-ScheduledTaskTrigger -Daily -At '07:45') '自動修復できなかった異常を error-fixer が調べる（対象があるときだけ）'
