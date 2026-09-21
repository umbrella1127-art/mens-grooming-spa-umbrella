# -*- coding: utf-8 -*-
"""未投稿の見張り（Claudeを呼ばない軽いジョブ）。投稿時刻の後に run-job.ps1 watch から呼ばれる。

    python scripts/threads/watch.py            # 検知したら pipeline_issues に記録して Discord に知らせる
    python scripts/threads/watch.py --dry-run  # 記録も通知もせず表示だけ

朝の care（07:00）では当日の未投稿を検知できないため、その穴を埋める。
health.py の not_posted を使い、同じ投稿（trial_id）は二度記録・通知しない。
再投稿（--live）はしない。最後の行に RESULT を出す（run_log.py が読む）。
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from health import run_checks  # noqa: E402
from hpb_db import connect  # noqa: E402
from threads_notify import send as notify  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    con = connect()
    found = [f for f in run_checks(con)["findings"] if f["kind"] == "not_posted"]
    new = []
    for f in found:
        tid = f["evidence"]["trial_id"]
        dup = con.execute("select 1 from pipeline_issues where kind='not_posted' "
                          "and evidence->>'trial_id' = %s", (str(tid),)).fetchone()
        if not dup:
            new.append(f)

    if not new:
        print(f"未投稿の新規検知なし（既知 {len(found)}件）")
        print("RESULT: ok")
        return
    for f in new:
        print(f"[検知] {f['title']}")
    if a.dry_run:
        print("（dry-run: 記録・通知はしていません）")
        return

    for f in new:
        con.execute(
            "insert into pipeline_issues (kind, severity, title, detail, evidence, action_taken) "
            "values ('not_posted', 'critical', %s, %s, %s, %s)",
            (f["title"], "watch.py が投稿時刻+1時間の時点で draft のままの投稿を検知。"
             "PCのスリープ・停止、トークン切れ、post-due の異常などが考えられる。",
             json.dumps({**f["evidence"], "trial_id": str(f["evidence"]["trial_id"])}, default=str),
             "記録とDiscord通知のみ。再投稿はしていない。"))
    con.commit()
    notify("⚠️ Threadsの投稿が予定時刻を過ぎても出ていません" + chr(10)
           + chr(10).join(f"・{f['title']}" for f in new) + chr(10)
           + "PCが起動しているか、post ログ（scripts/threads/logs）をご確認ください。再投稿は自動ではしません。", "care")
    print("RESULT: partial")


if __name__ == "__main__":
    main()
