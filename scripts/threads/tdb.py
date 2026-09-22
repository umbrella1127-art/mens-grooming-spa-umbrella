# -*- coding: utf-8 -*-
"""Threads→ブログ基盤のDB窓口。エージェントはこれ経由でしか書かない。

    python scripts/threads/tdb.py --context                 # 今の状態（在庫・直近の投稿・勝者）
    python scripts/threads/tdb.py --knowledge               # 知識（全担当が最初に読む。採用・保留・退役）
    python scripts/threads/tdb.py "SELECT ..." [--format json]
    python scripts/threads/tdb.py "INSERT ..." --write      # threads_topics / threads_trials のみ

更新系は threads_topics / threads_trials にしか効かない。posts と content_drafts は読み取り専用
（記事の保存は save_blog.py が行う）。
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import connect  # noqa: E402

# knowledge は threads-librarian / strategist が「効いた型・外れた型」を書く。pipeline_issues は caretaker が書く
WRITABLE = {"threads_topics", "threads_trials", "threads_trial_snapshots", "pipeline_issues", "knowledge",
            "knowledge_evidence"}
BAD = ("drop", "alter", "create", "truncate", "grant")


def write_targets(sql):
    return {m.lower() for m in re.findall(
        r"(?:insert\s+into|update|delete\s+from)\s+\"?([a-zA-Z_][a-zA-Z0-9_]*)\"?", sql, re.I)}


def show(rows, fmt):
    if fmt == "json":
        print(json.dumps(rows, ensure_ascii=False, default=str, indent=1))
        return
    if not rows:
        print("(0件)")
        return
    for r in rows:
        print(" | ".join(f"{k}={'' if v is None else str(v)[:120]}" for k, v in r.items()))
    print(f"({len(rows)}件)")


def context(con):
    def q(s):
        return con.execute(s).fetchall()

    print("== 種ネタ在庫（status別）")
    show(q("select status, priority, count(*) n from threads_topics group by 1,2 order by 1,2"), "t")
    print("== 未テストの新鮮ネタ（active・priority=false）")
    show(q("select id, age_band, pain_keyword, title from threads_topics "
           "where status='active' and priority=false and id not in "
           "(select topic_id from threads_trials where topic_id is not null) order by id"), "t")
    print("== 直近7日の投稿")
    show(q("select trial_date, slot, status, reaction_score, is_winner, topic_id, left(post_text,40) txt "
           "from threads_trials where trial_date >= current_date - 7 order by trial_date desc, slot"), "t")
    print("== 直近7日の平均（T+1。今日の予測 predicted_vs_baseline の比べる相手）")
    show(q("select count(*) n, round(avg(s.views)) views, round(avg(s.reaction_score),1) score "
           "from threads_trial_snapshots s join threads_trials t on t.id=s.trial_id where s.days_after=1 "
           "and t.trial_date >= (now() at time zone 'Asia/Tokyo')::date - 7"), "t")
    print("== T+7 の確定判定（直近14日）")
    show(q("select t.trial_date, t.slot, t.hook, s1.views v1, s7.views v7, s7.verdict, s7.prediction_hit, "
           "left(s7.note,40) note from threads_trial_snapshots s7 join threads_trials t on t.id=s7.trial_id "
           "left join threads_trial_snapshots s1 on s1.trial_id=t.id and s1.days_after=1 "
           "where s7.days_after=7 and s7.measured_at >= now() - interval '14 days' order by t.trial_date desc, t.slot"), "t")
    print("== ブログ化待ちの勝者（priority=true・未記事化）")
    show(q("select id, age_band, pain_keyword, title from threads_topics "
           "where priority and post_id is null and status <> 'closed' order by id"), "t")
    print("== 未解決の異常（pipeline_issues）")
    show(q("select id, severity, kind, title, detected_at::date d from pipeline_issues "
           "where channel='threads' and status='open' order by detected_at desc limit 10"), "t")
    print("== 直近の実行記録（agent_runs threads:*）")
    show(q("select ran_at, routine, status, left(summary,60) s from agent_runs "
           "where routine like 'threads:%' order by ran_at desc limit 8"), "t")
    print("== 未処理の改善案（振り返り③仕組み / ④事業。詳細は reflect.py open）")
    show(q("select kind, status, count(*) n from improvement_proposals "
           "where channel='threads' and status in ('open','reported') group by 1,2 order by 1,2"), "t")
    print("== Threadsの知識（件数。中身は --knowledge）")
    show(q("select kind, status, count(*) n from knowledge where source='threads' group by 1,2 order by 1,2"), "t")


KNOWLEDGE_SQL = (
    "select k.id, k.kind, k.status, k.category, k.title, k.body, k.retired_reason, "
    "count(e.id) filter (where e.outcome='support') support, "
    "count(e.id) filter (where e.outcome='contradict') contra "
    "from knowledge k left join knowledge_evidence e on e.knowledge_id=k.id "
    "where k.source='threads' and k.status=%s and k.kind<>'summary' group by k.id order by k.category, k.updated_at desc")


def knowledge(con):
    """全担当が作業の最初に読む。採用だけを「型」として使い、保留は仮説、退役は使わない。"""
    def block(status, heading, full):
        rows = con.execute(KNOWLEDGE_SQL, (status,)).fetchall()
        print(f"== {heading}（{len(rows)}件）")
        if not rows:
            print("(なし)")
        for r in rows:
            ev = f"支持{r['support']}・反証{r['contra']}" if r["kind"] == "pattern" else r["kind"]
            print(f"- [{r['category']}] {r['title']}（{ev}）  id={r['id']}")
            if status == "retired":
                print(f"    もう使わない理由: {r['retired_reason']}")
            elif full:
                for line in (r["body"] or "").strip().splitlines()[:6]:
                    print(f"    {line}")
    block("adopted", "採用（3件以上で再現した型・運用の決めごと。これに従う）", True)
    block("candidate", "保留（まだ3件未満。仮説として扱い、断言しない）", False)
    block("retired", "退役（もう使わない。同じことを繰り返さない）", False)
    last = con.execute("select title, body from knowledge where source='threads' and kind='summary' "
                       "order by updated_at desc limit 1").fetchone()
    print("== 直近の週次まとめ")
    if last:
        print(f"- {last['title']}")
        for line in (last["body"] or "").strip().splitlines()[:8]:
            print(f"    {line}")
    else:
        print("(なし)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sql", nargs="?")
    ap.add_argument("--format", choices=["table", "json"], default="table")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--context", action="store_true")
    ap.add_argument("--knowledge", action="store_true")
    a = ap.parse_args()
    con = connect()
    if a.context:
        context(con)
        return
    if a.knowledge:
        knowledge(con)
        return
    if not a.sql:
        ap.error("SQL か --context を指定してください")
    low = a.sql.lower()
    if any(re.search(rf"\b{w}\b", low) for w in BAD):
        sys.exit("この種類のSQLは実行できません")
    targets = write_targets(a.sql)
    if targets:
        if not a.write:
            sys.exit("更新系SQLには --write が必要です")
        if not targets <= WRITABLE:
            sys.exit(f"書き込めるのは {sorted(WRITABLE)} だけです（指定: {sorted(targets)}）")
        cur = con.execute(a.sql)
        rows = cur.fetchall() if cur.description else []
        con.commit()
        print(f"OK {cur.rowcount}行")
        if rows:
            show(rows, a.format)
        return
    show(con.execute(a.sql).fetchall(), a.format)


if __name__ == "__main__":
    main()
