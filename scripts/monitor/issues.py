# -*- coding: utf-8 -*-
"""監視の台帳（pipeline_issues, channel='system'）を読み書きする小さな道具。error-fixer と人が使う。

    python scripts/monitor/issues.py queue                 # 修復担当が見るべき未解決（要確認・24時間以内に未着手でないもの）
    python scripts/monitor/issues.py show <id>             # 1件の詳細＋該当ログの末尾
    python scripts/monitor/issues.py note <id> "調べたこと"  # 台帳に調査メモを追記（修復担当が着手した印にもなる）
    python scripts/monitor/issues.py resolve <id> "直した内容" # 直して確認できたときだけ。台帳を解決にしてDiscordへ
    python scripts/monitor/issues.py escalate <id> "人に頼みたいこと" # 自分では直せない／直すと影響が大きい。Discordで要確認として知らせる
    python scripts/monitor/issues.py rerun <taskname>      # 何度走らせても同じ結果になるタスクだけ再実行（watchdog.SAFE_RERUN）

直せる範囲は決まっている。コードを直したいときはここではなく improve.py draft（承認制）に回す。
"""
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "hpb"))
sys.path.insert(0, str(ROOT / "scripts" / "threads"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import JST, connect  # noqa: E402
from threads_notify import send as notify  # noqa: E402
from watchdog import SAFE_RERUN, rerun_task  # noqa: E402


def logs_for(task):
    """タスク名から該当ログの場所を当てる（threads-xxx → scripts/threads/logs/日付-xxx.log、site-daily → scripts/site/logs）"""
    if task.startswith("mensumbrella-threads-"):
        job = task[len("mensumbrella-threads-"):]
        files = sorted((ROOT / "scripts" / "threads" / "logs").glob(f"*-{job}.log"))
    elif task == "mensumbrella-site-daily":
        files = sorted((ROOT / "scripts" / "site" / "logs").glob("*.log"))
    else:
        files = []
    return files[-1] if files else None


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        return
    con = connect()
    cmd = a[0]
    if cmd == "queue":
        rows = con.execute("select id, kind, severity, title, evidence from pipeline_issues where channel='system' "
                           "and status='open' and (evidence->>'needs_human')='true' "
                           "and coalesce((evidence->>'fixer_at')::timestamptz, 'epoch') < now() - interval '24 hours' "
                           "order by id").fetchall()
        for r in rows:
            print(f"#{r['id']} [{r['severity']}] {r['kind']}: {r['title']}")
        print(f"対象 {len(rows)}件")
    elif cmd == "show":
        r = con.execute("select * from pipeline_issues where id=%s", (int(a[1]),)).fetchone()
        print(json.dumps(r, ensure_ascii=False, default=str, indent=1))
        task = (r["evidence"] or {}).get("task")
        log = logs_for(task) if task else None
        if log:
            print(f"\n--- ログ {log.name} の末尾 ---")
            print("\n".join(log.read_text(encoding="utf-8", errors="replace").splitlines()[-40:]))
    elif cmd == "note":
        con.execute("update pipeline_issues set evidence = evidence || %s::jsonb, "
                    "detail = coalesce(detail,'') || %s where id=%s",
                    (json.dumps({"fixer_at": datetime.now(JST).isoformat()}),
                     f"\n[{datetime.now(JST):%m/%d %H:%M}] {a[2]}", int(a[1])))
        con.commit()
        print("メモを追記しました")
    elif cmd == "resolve":
        r = con.execute("update pipeline_issues set status='fixed', resolved_at=now(), resolve_note=%s "
                        "where id=%s and channel='system' returning title", (a[2], int(a[1]))).fetchone()
        con.commit()
        if r:
            notify(f"🛠️ 修復担当が直しました: {r['title']}\n{a[2]}", "care")
        print("解決にしました" if r else "該当なし")
    elif cmd == "escalate":
        r = con.execute("update pipeline_issues set severity='critical', evidence = evidence || %s::jsonb "
                        "where id=%s and channel='system' returning title",
                        (json.dumps({"fixer_at": datetime.now(JST).isoformat(), "escalated": a[2]}, ensure_ascii=False),
                         int(a[1]))).fetchone()
        con.commit()
        if r:
            notify(f"🚨 人の確認が必要です: {r['title']}\n依頼: {a[2]}", "care")
        print("要確認として通知しました" if r else "該当なし")
    elif cmd == "rerun":
        if a[1] not in SAFE_RERUN:
            print(f"再実行してよいのは {sorted(SAFE_RERUN)} だけです（投稿など副作用のあるタスクは対象外）")
            sys.exit(1)
        rerun_task(a[1])
        print("再実行を依頼しました")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
