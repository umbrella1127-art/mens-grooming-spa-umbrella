# -*- coding: utf-8 -*-
"""Threads基盤の点検（ループB「自分自身を直す」の材料）。DBとログを見て、異常の候補を JSON で出す。
判断（重要度の確定・記録・修正）は threads-caretaker が行う。ここは事実を並べるだけ。

    python scripts/threads/health.py            # 読みやすい表示
    python scripts/threads/health.py --json     # 機械向け

見るもの:
  post_failed      … 直近3日で status=failed の投稿
  no_draft_today   … 06:30 を過ぎても今日の draft/posted が3本未満
  not_posted       … 投稿時刻を1時間以上過ぎても draft のまま（08:00/12:30/19:00）。前日以前3日分の draft も対象
                     （即時の検知と通知は watch.py が投稿時刻の後に行う）
  no_winner_streak … 直近3日以上、実測済みなのに勝者なし
  unmeasured       … 前日分（T+1）または7日前の分（T+7）が実測されていない（06:00以降）
  stock_low        … 未テストの新鮮ネタが9件未満
  draft_stale      … ブログ下書き（content_drafts blog/pending）が3日以上放置
  run_error        … 直近48時間の agent_runs（threads:*）で error/partial
  rule_violation   … 投稿済み本文が今の禁止表現チェックに引っかかる（ルールを後から強めた場合）
  open_issues      … pipeline_issues の未解決件数
"""
import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from check_article import check  # noqa: E402
from hpb_db import JST, connect  # noqa: E402

SLOT_TIMES = {1: (8, 0), 2: (12, 30), 3: (19, 0)}


def run_checks(con):
    now = datetime.now(JST)
    today = now.date()
    out = []

    def add(kind, severity, title, evidence=None):
        out.append({"kind": kind, "severity": severity, "title": title, "evidence": evidence or {}})

    q = lambda s, *p: con.execute(s, p).fetchall()  # noqa: E731

    failed = q("select id, trial_date, slot, result_note from threads_trials "
               "where status='failed' and trial_date >= %s", today - timedelta(days=3))
    for r in failed:
        add("post_failed", "critical", f"{r['trial_date']} slot{r['slot']} の投稿が失敗",
            {"trial_id": r["id"], "note": r["result_note"]})

    todays = q("select slot, status from threads_trials where trial_date=%s", today)
    if now.hour * 60 + now.minute >= 6 * 60 + 30 and len(todays) < 3:
        add("no_draft_today", "warning", f"今日の投稿が {len(todays)}本しか用意されていない",
            {"slots": [t["slot"] for t in todays]})
    # 今日の分は投稿時刻+1時間を過ぎたもの、前日以前（3日分）は draft が残っていれば全部
    drafts = q("select id, trial_date, slot from threads_trials where status='draft' "
               "and trial_date between %s and %s order by trial_date, slot", today - timedelta(days=3), today)
    for t in drafts:
        h, m = SLOT_TIMES.get(t["slot"], (0, 0))
        due = datetime(t["trial_date"].year, t["trial_date"].month, t["trial_date"].day, h, m, tzinfo=JST)
        if now > due + timedelta(hours=1):
            add("not_posted", "critical", f"{t['trial_date']} slot{t['slot']} が投稿時刻を過ぎても draft のまま",
                {"trial_id": t["id"], "slot": t["slot"], "due": due.isoformat()})

    yday = today - timedelta(days=1)
    unmeasured = q("select count(*) n from threads_trials where trial_date=%s and status='posted' "
                   "and measured_at is null", yday)[0]["n"]
    if now.hour >= 6 and unmeasured:
        add("unmeasured", "warning", f"前日（{yday}）の投稿 {unmeasured}本が未実測", {"date": str(yday)})
    d7 = today - timedelta(days=7)
    unmeasured7 = q("select count(*) n from threads_trials t where trial_date=%s and status='posted' "
                    "and not exists (select 1 from threads_trial_snapshots s where s.trial_id=t.id and s.days_after=7)",
                    d7)[0]["n"]
    if now.hour >= 6 and unmeasured7:
        add("unmeasured", "warning", f"7日前（{d7}）の投稿 {unmeasured7}本が T+7 未実測",
            {"date": str(d7), "days_after": 7})

    days = q("select trial_date, bool_or(is_winner) won, count(*) filter (where measured_at is not null) measured "
             "from threads_trials where trial_date >= %s and trial_date < %s group by 1 order by 1 desc",
             today - timedelta(days=7), today)
    streak = 0
    for d in days:
        if d["measured"] and not d["won"]:
            streak += 1
        else:
            break
    if streak >= 3:
        add("no_winner_streak", "warning", f"{streak}日連続で勝者なし（反応が取れていない）", {"days": streak})

    stock = q("select count(*) n from threads_topics where status='active' and priority=false and id not in "
              "(select topic_id from threads_trials where topic_id is not null)")[0]["n"]
    if stock < 9:
        add("stock_low", "info" if stock >= 6 else "warning", f"未テストの種ネタが {stock}件", {"stock": stock})

    stale = q("select id, created_at from content_drafts where channel_type='blog' and status='pending' "
              "and created_at < now() - interval '3 days'")
    if stale:
        add("draft_stale", "info", f"ブログ下書き {len(stale)}件が3日以上承認待ち",
            {"draft_ids": [str(s["id"]) for s in stale]})

    runs = q("select routine, status, summary, ran_at from agent_runs where routine like 'threads:%%' "
             "and ran_at > now() - interval '48 hours' and status <> 'ok' order by ran_at desc")
    for r in runs:
        add("run_error", "critical" if r["status"] == "error" else "warning",
            f"{r['routine']} が {r['status']}（{r['ran_at']:%m/%d %H:%M}）", {"summary": r["summary"]})

    posted = q("select id, trial_date, slot, post_text from threads_trials where status='posted' "
               "and trial_date >= %s", today - timedelta(days=14))
    for p in posted:
        bad, _ = check(p["post_text"])
        if bad:
            add("rule_violation", "warning", f"公開済み {p['trial_date']} slot{p['slot']} が今の禁止表現に該当",
                {"trial_id": p["id"], "hits": bad[:3]})

    open_n = q("select count(*) n from pipeline_issues where channel='threads' and status='open'")[0]["n"]
    return {"checked_at": now.isoformat(timespec="seconds"), "open_issues": open_n, "findings": out}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    res = run_checks(connect())
    if a.json:
        print(json.dumps(res, ensure_ascii=False, indent=1, default=str))
        return
    print(f"点検 {res['checked_at']}  未解決の異常: {res['open_issues']}件")
    if not res["findings"]:
        print("異常の候補なし")
    for f in res["findings"]:
        print(f"[{f['severity']}] {f['kind']}: {f['title']}  {json.dumps(f['evidence'], ensure_ascii=False, default=str)[:160]}")


if __name__ == "__main__":
    main()
