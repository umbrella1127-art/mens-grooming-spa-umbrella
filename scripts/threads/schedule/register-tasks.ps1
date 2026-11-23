# Threads→ブログ基盤のタスクを Windows タスクスケジューラに登録する（何度実行しても同じ結果になる）
#   pwsh -File scripts/threads/schedule/register-tasks.ps1            # 登録・更新
#   pwsh -File scripts/threads/schedule/register-tasks.ps1 -Remove    # すべて削除
#   pwsh -File scripts/threads/schedule/register-tasks.ps1 -Only watch           # 指定した1つだけ登録（名前は prefix の後ろ）
#   pwsh -File scripts/threads/schedule/register-tasks.ps1 -Only watch -S4U      # ログオン不要（S4U）で登録
# 既定は「ログオン中のみ実行（Interactive）」。-S4U を付けると、誰もログオンしていなくても（PCが起動していれば）走る。
# S4U はパスワードを保存しない。ただしネットワーク資格情報・DPAPI・資格情報マネージャは使えない。
# 全タスクへ広げる前に s4u-verify.ps1 で1タスクだけ検証すること（手順は GUIDE.md の「ログオン不要で動かす」）。
# タスク名はすべて mensumbrella-threads- で始まる。他プロジェクトのタスクには触れない。
param([switch]$Remove, [string]$Only = '', [switch]$S4U)

$prefix = 'mensumbrella-threads-'
$runJob = Join-Path $PSScriptRoot 'run-job.ps1'
$pwsh = (Get-Command pwsh).Source

$jobs = @(
    @{ Job = 'improve';       At = '05:00'; Note = '自律改善（仕組みの改善案を起草→承認済みを反映→7日後に効果確認）' },
    @{ Job = 'owner-fetch';   At = '05:25'; Note = '井上さんの記録メモ（#今日の店）を取り込み' },
    @{ Job = 'research';      At = '05:30'; Note = '種ネタの在庫補充（不足時のみ）' },
    @{ Job = 'account';       At = '05:50'; Note = 'アカウント全体のインサイト（表示・反応・リンククリック・フォロワー）を取り込み' },
    @{ Job = 'validate';      At = '06:00'; Note = '前日の実測→勝者→今日の3本を作成' },
    @{ Job = 'blog';          At = '06:30'; Note = '勝者の記事を下書き保存→Discord承認依頼' },
    @{ Job = 'care';          At = '07:00'; Note = '点検（異常の記録・安全な修正・Discord報告）' },
    @{ Job = 'post1';         At = '08:00'; Note = 'Threads 1本目を投稿' },
    @{ Job = 'post2';         At = '12:30'; Note = 'Threads 2本目を投稿' },
    @{ Job = 'post3';         At = '19:00'; Note = 'Threads 3本目を投稿' }
)

if ($Remove) {
    Get-ScheduledTask | Where-Object { $_.TaskName -like "$prefix*" -and (-not $Only -or $_.TaskName -eq "$prefix$Only") } | ForEach-Object {
        Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false
        "削除: $($_.TaskName)"
    }
    return
}

$principal = $null
if ($S4U) {
    # 現在のユーザーで、ログオンの有無を問わず実行（パスワード不要）。昇格はしない
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited
}

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# 2026-11-20 から自動投稿は意図して止めている。再登録しても勝手に復活しないよう、登録後に無効化する。
# 再開するときはオーナーの判断で、この一覧から外してから登録し直す。
$paused = @('post1', 'post2', 'post3', 'validate')

function Register-One($name, $trigger, $job, $note) {
    if ($Only -and $name -ne $Only) { return }
    $action = New-ScheduledTaskAction -Execute $pwsh `
        -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$runJob`" $job"
    $args2 = @{ TaskName = "$prefix$name"; Trigger = $trigger; Action = $action; Settings = $settings; Description = $note; Force = $true }
    if ($principal) { $args2.Principal = $principal }
    Register-ScheduledTask @args2 | Out-Null
    if ($paused -contains $name) { Disable-ScheduledTask -TaskName "$prefix$name" | Out-Null }
    $kind = if ($S4U) { 'S4U(ログオン不要)' } else { 'Interactive(ログオン中のみ)' }
    "登録: $prefix$name  [$kind]  ($note)"
}

foreach ($j in $jobs) {
    Register-One $j.Job (New-ScheduledTaskTrigger -Daily -At $j.At) $j.Job $j.Note
}
# 未投稿の見張り（各投稿の1.5時間後）。朝の care では当日の未投稿を検知できないため
# ログオン3分後にも走らせる: 停止やログオン遅れのあとで時刻を過ぎていても、戻った直後に「朝の工程が動いていない」を拾う
$logonWatch = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$logonWatch.Delay = 'PT3M'
Register-One 'watch' @(
    (New-ScheduledTaskTrigger -Daily -At '09:30'),
    (New-ScheduledTaskTrigger -Daily -At '14:00'),
    (New-ScheduledTaskTrigger -Daily -At '20:30'),
    $logonWatch
) 'watch' '未投稿の見張り（検知したら記録＋Discord通知。再投稿はしない）'
# 週1回（日曜）: 投稿結果と学びを「効いた型・外れた型」に整理
Register-One 'library' (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '07:30') 'library' '週次の知識整理（knowledge）'
# 井上さんへの記録リマインド（営業終わりの少し後。火・金は23:10、土日は19:10。月・水・木は定休のため送らない）
Register-One 'owner-remind' @(
    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Tuesday, Friday -At '23:10'),
    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday, Sunday -At '19:10')
) 'owner-remind' '井上さんへの記録リマインド（#今日の店へ送信。祝日の営業日は手動で書いてもらう想定）'
# 長期トークンは60日で失効するため、4週間ごとに更新
Register-One 'refresh-token' (New-ScheduledTaskTrigger -Weekly -WeeksInterval 4 -DaysOfWeek Monday -At '10:00') `
    'refresh-token' 'Threadsトークンの更新（4週間ごと）'
