# Threads→ブログ基盤のタスクを Windows タスクスケジューラに登録する（何度実行しても同じ結果になる）
#   pwsh -File scripts/threads/schedule/register-tasks.ps1            # 登録・更新
#   pwsh -File scripts/threads/schedule/register-tasks.ps1 -Remove    # すべて削除
# タスク名はすべて mensumbrella-threads- で始まる。他プロジェクトのタスクには触れない。
param([switch]$Remove)

$prefix = 'mensumbrella-threads-'
$runJob = Join-Path $PSScriptRoot 'run-job.ps1'
$pwsh = (Get-Command pwsh).Source

$jobs = @(
    @{ Job = 'research';      At = '05:30'; Note = '種ネタの在庫補充（不足時のみ）' },
    @{ Job = 'validate';      At = '06:00'; Note = '前日の実測→勝者→今日の3本を作成' },
    @{ Job = 'blog';          At = '06:30'; Note = '勝者の記事を下書き保存→Discord承認依頼' },
    @{ Job = 'care';          At = '07:00'; Note = '点検（異常の記録・安全な修正・Discord報告）' },
    @{ Job = 'post1';         At = '08:00'; Note = 'Threads 1本目を投稿' },
    @{ Job = 'post2';         At = '12:30'; Note = 'Threads 2本目を投稿' },
    @{ Job = 'post3';         At = '19:00'; Note = 'Threads 3本目を投稿' }
)

if ($Remove) {
    Get-ScheduledTask | Where-Object { $_.TaskName -like "$prefix*" } | ForEach-Object {
        Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false
        "削除: $($_.TaskName)"
    }
    return
}

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

function Register-One($name, $trigger, $job, $note) {
    $action = New-ScheduledTaskAction -Execute $pwsh `
        -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$runJob`" $job"
    Register-ScheduledTask -TaskName "$prefix$name" -Trigger $trigger -Action $action -Settings $settings `
        -Description $note -Force | Out-Null
    "登録: $prefix$name  ($note)"
}

foreach ($j in $jobs) {
    Register-One $j.Job (New-ScheduledTaskTrigger -Daily -At $j.At) $j.Job $j.Note
}
# 未投稿の見張り（各投稿の1.5時間後）。朝の care では当日の未投稿を検知できないため
Register-One 'watch' @(
    (New-ScheduledTaskTrigger -Daily -At '09:30'),
    (New-ScheduledTaskTrigger -Daily -At '14:00'),
    (New-ScheduledTaskTrigger -Daily -At '20:30')
) 'watch' '未投稿の見張り（検知したら記録＋Discord通知。再投稿はしない）'
# 週1回（日曜）: 投稿結果と学びを「効いた型・外れた型」に整理
Register-One 'library' (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '07:30') 'library' '週次の知識整理（knowledge）'
# 長期トークンは60日で失効するため、4週間ごとに更新
Register-One 'refresh-token' (New-ScheduledTaskTrigger -Weekly -WeeksInterval 4 -DaysOfWeek Monday -At '10:00') `
    'refresh-token' 'Threadsトークンの更新（4週間ごと）'
