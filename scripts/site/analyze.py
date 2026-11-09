# -*- coding: utf-8 -*-
"""GA4分析の材料（事実だけ）を並べる。判断・所見の記録は ga4-analyst が行う。

    python scripts/site/analyze.py            # 直近28日と、その前の28日を比べる
    python scripts/site/analyze.py --days 14

出すもの: サイト全体 / 流入元別 / ページ別 / 年齢別の「訪問・LINEクリック・LINEクリック率」と前期間との差、
実験の状況、データの注意（数が少ない・取り込みの遅れ）。
訪問が少ないサイトなので、必ず件数と一緒に率を出し、10件未満の差には「参考にならない」印を付ける。
"""
import argparse
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import JST, connect  # noqa: E402
from datetime import datetime  # noqa: E402

MIN_N = 10  # 訪問がこれ未満の行は率を信用しない


def pct(a, b):
    return f"{a / b * 100:.1f}%" if b else "-"


def agg(con, start, end, where):
    rows = con.execute(
        f"select page, metric, sum(value) v from site_metrics_daily where day between %s and %s and ({where}) "
        "and metric in ('sessions','line_click','page_views') group by 1,2", (start, end)).fetchall()
    out = {}
    for r in rows:
        out.setdefault(r["page"], {})[r["metric"]] = r["v"]
    return out


def table(title, cur, prev, strip=None, limit=12):
    print(f"\n## {title}")
    print(f"{'項目':<38}{'訪問':>6}{'LINE':>6}{'率':>8}   前期間(訪問/LINE/率)")
    rows = sorted(cur.items(), key=lambda kv: -kv[1].get("sessions", 0))[:limit]
    for page, m in rows:
        s, l = m.get("sessions", 0), m.get("line_click", 0)
        p = prev.get(page, {})
        ps, pl = p.get("sessions", 0), p.get("line_click", 0)
        name = page[len(strip):-1] if strip else page
        mark = "  ※少数" if s < MIN_N else ""
        print(f"{name[:36]:<38}{s:>6.0f}{l:>6.0f}{pct(l, s):>8}   {ps:.0f}/{pl:.0f}/{pct(pl, ps)}{mark}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    a = ap.parse_args()
    con = connect()
    end = datetime.now(JST).date() - timedelta(days=1)
    start = end - timedelta(days=a.days - 1)
    pend = start - timedelta(days=1)
    pstart = pend - timedelta(days=a.days - 1)
    last = con.execute("select max(day) d from site_metrics_daily").fetchone()["d"]
    print(f"# GA4分析の材料  対象 {start}〜{end}（前期間 {pstart}〜{pend}）  最新データ {last}")
    if last is None or (end - last).days > 3:
        print("※ データが古い。取り込みが止まっている可能性（先に /admin/errors を確認）")

    table("サイト全体", agg(con, start, end, "page='(all)'"), agg(con, pstart, pend, "page='(all)'"))
    table("流入元別（どこから来たか）", agg(con, start, end, "page like '(src:%%'"),
          agg(con, pstart, pend, "page like '(src:%%'"), strip="(src:")
    table("ページ別", agg(con, start, end, "page like '/%%'"), agg(con, pstart, pend, "page like '/%%'"), limit=15)
    table("年齢別（GA4のしきい値で空のことがある）", agg(con, start, end, "page like '(age:%%'"),
          agg(con, pstart, pend, "page like '(age:%%'"), strip="(age:")

    print("\n## 実験")
    for e in con.execute("select code, name, verdict, decision, started_at::date s, ended_at::date e "
                         "from experiments order by created_at desc limit 5").fetchall():
        print(f"{e['code']} {e['name'][:40]} 期間{e['s']}〜{e['e']} 判定={e['verdict']} 決定={e['decision']}")

    print("\n## 既存の未確認所見（GA4）")
    for f in con.execute("select severity, title from findings where channel='ga4' and acked_at is null "
                         "order by created_at desc limit 8").fetchall():
        print(f"[{f['severity']}] {f['title'][:80]}")


if __name__ == "__main__":
    main()
