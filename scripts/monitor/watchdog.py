# -*- coding: utf-8 -*-
"""エラー監視＋決まった範囲の自動修復（Claudeを呼ばない軽いジョブ）。2時間おきに run-watchdog.ps1 から呼ばれる。

    python scripts/monitor/watchdog.py             # 点検→記録→安全な修復→通知
    python scripts/monitor/watchdog.py --dry-run   # 記録・修復・通知をせず、見つけたものだけ表示

なぜ必要か: Threads用の点検（health.py / watch.py）は定期実行の仕組みの上で動く。その仕組み自体が壊れると
（2026-10-22〜11-09は全タスクの起動方式が壊れて18日間気づけなかった）点検も一緒に止まる。
ここは「仕組みの外側から」仕組みを見る。見るもの:
  task_failed  … Windowsタスク(mensumbrella-*)の最終結果が失敗。起動方式が壊れているなら自動で直す
  routine_stale… 毎日(週1)走るはずの routine が、期限を過ぎても agent_runs に ok/partial で残っていない
  data_stale   … GA4(site_metrics_daily)・Threadsアカウント数字(threads_account_daily)が古い。取り込み直す
  routine_error… 直近の実行が error（run_log.py が通知済みの再掲ではなく、未解決として台帳に載せる）
記録先は pipeline_issues（channel='system'）。管理画面 /admin/activity の「出来事」と /admin/errors が読む。
自動修復は下の RUNBOOK にある「元に戻せて副作用が小さいもの」だけ。それ以外は error-fixer（Claude）か人に回す。
最後の行に RESULT を出す。
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

NL = chr(10)
EVENTS = []  # この回の通知をためて、最後に1通へまとめる（初回に何十通も飛ばさない）
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "hpb"))
sys.path.insert(0, str(ROOT / "scripts" / "threads"))
from hpb_db import JST, connect  # noqa: E402
from threads_notify import send as notify  # noqa: E402

TASK_PREFIX = "mensumbrella-"
PWSH = r"C:\Program Files\PowerShell\7\pwsh.exe"
# 0=成功 / 267009=実行中 / 267011=まだ実行されていない / 267014=ユーザーが停止
OK_RESULTS = {0, 267009, 267011, 267014}
# 起動方式を直したあとに、念のため1回だけ走らせ直してよいタスク（何度走らせても同じ結果になるものだけ）
SAFE_RERUN = {"mensumbrella-site-daily", "mensumbrella-threads-account"}

# routine ごとの「この時間以内に ok/partial が1つは残っているはず」。日次=36時間、週次=8日
STALE_AFTER = {
    "site:daily": 36, "threads:improve": 36, "threads:owner-fetch": 36, "threads:research": 36,
    "threads:account": 36, "threads:validate": 36, "threads:blog": 36, "threads:care": 36,
    "threads:library": 8 * 24, "site:weekly": 9 * 24,
}
# データの鮮度。(テーブル, 日付列, 許容する遅れ(日), 取り込み直しコマンド)
FRESHNESS = [
    ("site_metrics_daily", "day", 3, [sys.executable, "scripts/site/daily.py", "run", "--days", "{days}", "--no-notify"]),
    ("threads_account_daily", "day", 3, None),
]


def ps(script):
    r = subprocess.run(["powershell", "-NoProfile", "-Command", "[Console]::OutputEncoding=[Text.Encoding]::UTF8;" + script],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
    return r.stdout.strip()


def list_tasks():
    out = ps(f"Get-ScheduledTask | ? TaskName -like '{TASK_PREFIX}*' | % {{ $i=$_|Get-ScheduledTaskInfo; "
             "[pscustomobject]@{name=$_.TaskName; exe=$_.Actions[0].Execute; args=$_.Actions[0].Arguments; "
             "result=$i.LastTaskResult; last=$i.LastRunTime.ToString('o')} } | ConvertTo-Json -Compress")
    if not out:
        return []
    data = json.loads(out)
    return data if isinstance(data, list) else [data]


# ---------- 自動修復（RUNBOOK） ----------
def fix_launcher(task):
    """wscript経由(窓を隠す仕組み)で起動に失敗しているタスクを、pwsh直接起動に戻す。
    タスクを作り直さず、実行内容(Execute/Arguments)だけ差し替える。元の値は action_taken に残す。"""
    m = re.search(r'run-hidden\.vbs"\s+"([^"]+)"\s+(.*)$', task["args"])
    if not m:
        return False, "起動方式を解釈できなかった"
    exe, rest = m.group(1), m.group(2)
    esc = lambda s: s.replace("'", "''")  # noqa: E731
    ps(f"$t=Get-ScheduledTask '{task['name']}'; $t.Actions[0].Execute='{esc(exe)}'; "
       f"$t.Actions[0].Arguments='{esc(rest)}'; Set-ScheduledTask -InputObject $t | Out-Null")
    now = next((t for t in list_tasks() if t["name"] == task["name"]), None)
    if now and "wscript" not in (now["exe"] or "").lower():
        return True, f"起動方式を wscript経由 → {Path(exe).name} 直接に戻した（元: {task['exe']} {task['args'][:80]}…）"
    return False, "設定を書き換えたが反映を確認できなかった"


def rerun_task(name):
    subprocess.run(["schtasks", "/run", "/tn", name], capture_output=True, timeout=30)


def refill_data(table, cmd, gap_days):
    if not cmd:
        return False, "自動で取り込み直す手段がない"
    days = max(4, min(30, gap_days + 2))
    argv = [a.format(days=days) for a in cmd]
    r = subprocess.run(argv, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300,
                       env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"})
    return r.returncode == 0, (r.stdout.strip().splitlines() or ["(出力なし)"])[-1][:200]


# ---------- 台帳(pipeline_issues, channel='system') ----------
def open_issue(con, key):
    return con.execute("select * from pipeline_issues where channel='system' and status='open' "
                       "and evidence->>'key'=%s order by id desc limit 1", (key,)).fetchone()


def record(con, a, kind, severity, key, title, evidence, action=None, human=False):
    """新規なら記録して通知。既知なら通知しない(ただし24時間以上たった要対応は1日1回だけ再通知)。"""
    ev = {**evidence, "key": key, "needs_human": human}
    cur = open_issue(con, key)
    if cur:
        last = datetime.fromisoformat(cur["evidence"].get("last_notified") or cur["detected_at"].isoformat())
        if human and (datetime.now(last.tzinfo) - last) > timedelta(hours=24) and not a.dry_run:
            EVENTS.append(("⏰", f"まだ未解決: {title}", action or "対応方法を決めてください"))
            con.execute("update pipeline_issues set evidence = evidence || %s::jsonb where id=%s",
                        (json.dumps({"last_notified": datetime.now(JST).isoformat()}), cur["id"]))
            con.commit()
        return cur["id"], False
    if a.dry_run:
        print(f"[dry] {severity} {kind}: {title}  {action or ''}")
        return None, True
    ev["last_notified"] = datetime.now(JST).isoformat()
    row = con.execute("insert into pipeline_issues (channel, kind, severity, title, evidence, action_taken, status) "
                      "values ('system',%s,%s,%s,%s::jsonb,%s,'open') returning id",
                      (kind, severity, title, json.dumps(ev, ensure_ascii=False, default=str), action)).fetchone()
    con.commit()
    EVENTS.append(("🛠️" if action and not human else ("🚨" if human else "⚠️"), title, action))
    return row["id"], True


def resolve(con, a, key, note):
    cur = open_issue(con, key)
    if cur and not a.dry_run:
        con.execute("update pipeline_issues set status='fixed', resolved_at=now(), resolve_note=%s where id=%s",
                    (note, cur["id"]))
        con.commit()
        EVENTS.append(("✅", f"解消: {cur['title']}", note))


# ---------- 点検 ----------
def check_tasks(con, a):
    for t in list_tasks():
        key = f"task:{t['name']}"
        if t["result"] in OK_RESULTS:
            resolve(con, a, key, "最新の実行が成功しました")
            continue
        title = f"定期タスク {t['name']} の最後の実行が失敗（結果コード {t['result']}、{t['last'][:16].replace('T', ' ')}）"
        if "wscript" in (t["exe"] or "").lower():
            if a.dry_run:
                record(con, a, "task_failed", "critical", key, title, {"task": t["name"]}, "起動方式を直接起動に戻す予定")
                continue
            ok, msg = fix_launcher(t)
            if ok and t["name"] in SAFE_RERUN:
                rerun_task(t["name"])
                msg += "／もう一度実行した"
            record(con, a, "task_failed", "critical", key, title, {"task": t["name"], "result": t["result"]},
                   msg, human=not ok)
        else:
            record(con, a, "task_failed", "critical", key, title, {"task": t["name"], "result": t["result"]},
                   "起動方式は正常。ジョブの中身の失敗なのでログを確認（error-fixer が調べる）", human=True)


def check_routines(con, a):
    now = datetime.now(JST)
    for routine, hours in STALE_AFTER.items():
        key = f"stale:{routine}"
        row = con.execute("select max(ran_at) t from agent_runs where routine=%s and status in ('ok','partial')",
                          (routine,)).fetchone()
        t = row["t"]
        if t and now - t.astimezone(JST) <= timedelta(hours=hours):
            resolve(con, a, key, f"{routine} が正常に実行されました")
            continue
        # 登録した直後などで一度も走っていないものは、まだ判断しない
        if not t and not con.execute("select 1 from agent_runs where routine=%s limit 1", (routine,)).fetchone():
            continue
        age = f"{(now - t.astimezone(JST)).total_seconds() / 3600:.0f}時間" if t else "記録なし"
        record(con, a, "routine_stale", "warning", key, f"{routine} が{hours}時間以上、正常に実行されていない（最後の成功から{age}）",
               {"routine": routine, "hours": hours}, "タスクの失敗なら上の task_failed が自動修復する。それでも続くなら要調査", human=True)


def check_freshness(con, a):
    today = datetime.now(JST).date()
    for table, col, tol, cmd in FRESHNESS:
        key = f"data:{table}"
        last = con.execute(f"select max({col}) d from {table}").fetchone()["d"]
        gap = (today - last).days if last else 99
        if gap <= tol:
            resolve(con, a, key, f"{table} が最新({last})になりました")
            continue
        title = f"{table} のデータが古い（最新 {last}、{gap}日分の遅れ）"
        if a.dry_run:
            record(con, a, "data_stale", "warning", key, title, {"table": table}, "取り込み直す予定" if cmd else None)
            continue
        ok, msg = refill_data(table, cmd, gap)
        record(con, a, "data_stale", "warning", key, title, {"table": table, "gap_days": gap},
               f"取り込み直し{'成功' if ok else '失敗'}: {msg}" if cmd else msg, human=not ok)


def flush_events(con):
    if not EVENTS:
        print("新規の出来事なし")
        return
    fixed = sum(1 for e in EVENTS if e[0] == "🛠️")
    human = sum(1 for e in EVENTS if e[0] in ("🚨", "⏰"))
    lines = [f"🔎 監視レポート: 自動修復 {fixed}件／要確認 {human}件／計 {len(EVENTS)}件"]
    for icon, title, note in sorted(EVENTS, key=lambda e: "🚨⏰⚠️🛠️✅".find(e[0])):
        detail = f" -> {note[:110]}" if note else ""
        lines.append(f"{icon} {title[:90]}{detail}")
    text = NL.join(lines)
    if len(text) > 1700:
        text = text[:1700].rsplit(NL, 1)[0] + NL + "…ほか（詳細はダッシュボード /admin/errors）"
    notify(text, "care")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    con = connect()
    for fn in (check_tasks, check_routines, check_freshness):
        try:
            fn(con, a)
        except Exception as e:  # noqa: BLE001 - 1つの点検が落ちても、他の点検は続ける
            print(f"{fn.__name__} が失敗: {e}")
    flush_events(con)
    n = con.execute("select count(*) c from pipeline_issues where channel='system' and status='open'").fetchone()["c"]
    print(f"未解決（system）: {n}件")
    print("RESULT: ok")


if __name__ == "__main__":
    main()
