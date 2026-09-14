# -*- coding: utf-8 -*-
"""サブエージェントの「出勤・退勤」記録。全員の共有記憶（DB）に稼働状況を残す。

★ すべてのサブエージェントは、作業の**最初**にstart、**最後**にdone/failを必ず呼ぶ。
これが「行動する前にDBを読み、行動したらDBに書く」の「書く」側の入口で、
管理画面の稼働タイムラインの唯一のソースになる。

    python scripts/hpb/agent_checkin.py start --agent hpb-collector --run-id 3 --note "..."
    python scripts/hpb/agent_checkin.py done  --agent hpb-collector --run-id 3 --note "..."
    python scripts/hpb/agent_checkin.py fail  --agent hpb-collector --run-id 3 --error "..."
    python scripts/hpb/agent_checkin.py status
"""
import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import JST, connect, task_start, task_finish  # noqa: E402


def roster_row(con, agent):
    r = con.execute("SELECT * FROM agent_roster WHERE agent=%s", (agent,)).fetchone()
    if not r:
        print(f"⚠ '{agent}' はチーム名簿に登録されていません。"
              f"db_migrate.py の ROSTER に追加してください。", file=sys.stderr)
    return r


def cmd_start(a):
    con = connect()
    r = roster_row(con, a.agent)
    task_id = task_start(con, a.run_id, a.agent, a.role or (r["team"] if r else ""), a.note)
    who = f"{r['display_name']}（{r['role_title']}）" if r else a.agent
    print(f"TASK_ID={task_id}")
    print(f"🟢 {who} が作業を開始しました" + (f" [run#{a.run_id}]" if a.run_id else ""))


def _find_running(con, agent, run_id):
    q = "SELECT id FROM agent_tasks WHERE agent=%s AND status='running' AND finished_at IS NULL"
    params = [agent]
    if run_id is not None:
        q += " AND run_id=%s"
        params.append(run_id)
    q += " ORDER BY id DESC LIMIT 1"
    row = con.execute(q, params).fetchone()
    return row["id"] if row else None


def cmd_done(a):
    con = connect()
    task_id = a.task_id or _find_running(con, a.agent, a.run_id)
    if not task_id:
        sys.exit(f"⚠ {a.agent} の稼働中タスクが見つかりません。先に `start` を呼びましたか？ "
                 "--task-id で直接指定もできます。")
    task_finish(con, task_id, status="completed", output_note=a.note)
    r = roster_row(con, a.agent)
    print(f"✅ {r['display_name'] if r else a.agent} が作業を完了しました")


def cmd_fail(a):
    con = connect()
    task_id = a.task_id or _find_running(con, a.agent, a.run_id)
    if not task_id:
        sys.exit(f"⚠ {a.agent} の稼働中タスクが見つかりません。--task-id で直接指定できます。")
    task_finish(con, task_id, status="failed", output_note=a.note, error=a.error)
    r = roster_row(con, a.agent)
    print(f"🔴 {r['display_name'] if r else a.agent} の作業が失敗しました: {a.error or '(理由未記載)'}")


def _relative(t):
    if not t:
        return "—"
    if isinstance(t, str):
        t = datetime.fromisoformat(t)
    if t.tzinfo is None:
        t = t.replace(tzinfo=JST)
    m = int((datetime.now(JST) - t).total_seconds() // 60)
    if m < 1:
        return "たった今"
    if m < 60:
        return f"{m}分前"
    h = m // 60
    if h < 24:
        return f"{h}時間前"
    return f"{h // 24}日前"


def cmd_status(a):
    con = connect()
    rows = con.execute("SELECT * FROM agent_roster ORDER BY sort_order").fetchall()
    print(f"{'担当':10}{'名前':10}{'状態':10}{'最終更新':10}最新のひとこと")
    for r in rows:
        last = con.execute(
            "SELECT status, output_note, error, started_at, finished_at FROM agent_tasks "
            "WHERE agent=%s ORDER BY id DESC LIMIT 1", (r["agent"],)).fetchone()
        if not last:
            state, when, note = "待機中", "—", "(まだ稼働記録なし)"
        elif last["status"] == "running":
            state, when, note = "🟢 稼働中", _relative(last["started_at"]), "作業中…"
        elif last["status"] == "failed":
            state = "🔴 失敗"
            when = _relative(last["finished_at"] or last["started_at"])
            note = last["error"] or ""
        else:
            state = "待機中"
            when = _relative(last["finished_at"] or last["started_at"])
            note = last["output_note"] or ""
        print(f"{r['team']:10}{r['display_name']:10}{state:10}{when:10}{(note or '')[:44]}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("start", help="作業開始を記録")
    s.add_argument("--agent", required=True)
    s.add_argument("--run-id", type=int)
    s.add_argument("--role")
    s.add_argument("--note")
    s.set_defaults(func=cmd_start)

    d = sub.add_parser("done", help="作業完了を記録")
    d.add_argument("--agent", required=True)
    d.add_argument("--run-id", type=int)
    d.add_argument("--task-id", type=int)
    d.add_argument("--note")
    d.set_defaults(func=cmd_done)

    f = sub.add_parser("fail", help="作業失敗を記録")
    f.add_argument("--agent", required=True)
    f.add_argument("--run-id", type=int)
    f.add_argument("--task-id", type=int)
    f.add_argument("--note")
    f.add_argument("--error")
    f.set_defaults(func=cmd_fail)

    st = sub.add_parser("status", help="チーム全員の現在状態を表示")
    st.set_defaults(func=cmd_status)

    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
