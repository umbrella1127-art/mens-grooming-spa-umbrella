# -*- coding: utf-8 -*-
"""月の途中で「今月このままいくと何人・CPAいくらで着地するか」を判定する。

締め前のデータは部分集計なので、確定月とそのまま比べると必ず読み違える。ここでは
  (1) 過去の同じ日数時点のスナップショットと比べる（あれば最優先）
  (2) 無ければ過去の確定月を日割りして同じ日数に揃えて比べる
という順で「ペース」を評価する。

    python scripts/hpb/pace.py record --store <store> --month 2026-08 \
        --as-of 2026-08-10 --new 14 --reservations 19 --sales 18.6 --acr 4.1 --source salon_report
    python scripts/hpb/pace.py check --store <store> --month 2026-08
"""
import argparse
import calendar
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import connect, upsert  # noqa: E402


def month_days(month):
    y, m = int(month[:4]), int(month[5:7])
    return calendar.monthrange(y, m)[1]


def cmd_record(args):
    con = connect()
    d = date.fromisoformat(args.as_of)
    md = month_days(args.month)
    upsert(con, "hpb_kpi_snapshots",
           {"store": args.store, "month": args.month, "as_of": args.as_of},
           {"elapsed_days": d.day, "month_days": md, "source": args.source,
            "customers_new": args.new, "net_reservations": args.reservations,
            "sales_man_yen": args.sales, "cvr": args.cvr, "acr": args.acr,
            "pv_coupon_menu": args.pv_coupon_menu, "pv_reserve_done": args.pv_reserve_done,
            "note": args.note})
    con.commit()
    print(f"記録しました: {args.month} の {d.day}/{md}日時点 新規{args.new}人 / 予約{args.reservations}件")


def plan_cost(con, store, month):
    r = con.execute("SELECT plan, plan_cost_yen FROM hpb_monthly_kpi WHERE store=%s AND month=%s",
                    (store, month)).fetchone()
    if r and r["plan_cost_yen"]:
        return r["plan"], r["plan_cost_yen"]
    r = con.execute("SELECT plan, plan_cost_yen FROM hpb_monthly_kpi WHERE store=%s "
                    "AND plan_cost_yen IS NOT NULL ORDER BY month DESC LIMIT 1",
                    (store,)).fetchone()
    return (r["plan"], r["plan_cost_yen"]) if r else (None, None)


def cmd_check(args):
    con = connect()
    snap = con.execute(
        "SELECT * FROM hpb_kpi_snapshots WHERE store=%s AND month=%s ORDER BY as_of DESC LIMIT 1",
        (args.store, args.month)).fetchone()
    if not snap:
        sys.exit(f"{args.month} の途中経過が記録されていません。"
                 f"\n先に `python scripts/hpb/pace.py record ...` で登録してください。")

    el, md = snap["elapsed_days"], snap["month_days"]
    new_now = snap["customers_new"] or 0
    plan, cost = plan_cost(con, args.store, args.month)

    print(f"=== {args.store} {args.month} 途中経過 （{snap['as_of']}時点 = {el}/{md}日）===")
    print(f"  プラン {plan}（掲載料 ¥{cost:,}）" if cost else f"  プラン {plan}")
    print(f"  新規 {new_now}人 / 予約 {snap['net_reservations']}件 / 売上 {snap['sales_man_yen']}万円"
          + (f" / ACR {snap['acr']}%" if snap["acr"] is not None else ""))
    if cost and new_now:
        print(f"  ここまでのCPA相当 ¥{cost/new_now:,.0f}（月末までに新規が増えれば下がる）")

    peers = con.execute(
        "SELECT month, elapsed_days, month_days, customers_new FROM hpb_kpi_snapshots "
        "WHERE store=%s AND month<>%s AND customers_new IS NOT NULL "
        "AND ABS(elapsed_days-%s) <= 4 ORDER BY month DESC LIMIT 6",
        (args.store, args.month, el)).fetchall()
    print("\n■ 同じ日数時点での比較")
    if peers:
        for p in peers:
            diff = new_now - p["customers_new"]
            mark = "▲" if diff > 0 else ("▼" if diff < 0 else "＝")
            print(f"  {p['month']}（{p['elapsed_days']}日時点）新規{p['customers_new']}人 "
                  f"→ 今月 {mark}{abs(diff)}人")
    else:
        print("  過去の同日数スナップショットがまだありません。")
        print("  ※ 毎月同じ頃に record し続けると、来月から実測どうしで比較できます。")

    fulls = con.execute(
        "SELECT month, plan, customers_new, net_reservations FROM hpb_monthly_kpi "
        "WHERE store=%s AND month<%s AND customers_new IS NOT NULL "
        "AND data_status='full' ORDER BY month DESC LIMIT 6",
        (args.store, args.month)).fetchall()
    if fulls:
        print("\n■ 過去の確定月を同じ日数に日割りした参考比較")
        for f in fulls:
            scaled = f["customers_new"] * el / month_days(f["month"])
            diff = new_now - scaled
            mark = "▲" if diff > 0 else "▼"
            print(f"  {f['month']}[{f['plan']}] 月間{f['customers_new']}人 "
                  f"→ {el}日換算 {scaled:.1f}人  今月 {mark}{abs(diff):.1f}人")

    print(f"\n■ 月末の着地見込み（{el}日経過時点からの推定）")
    print(f"  {'シナリオ':22}{'新規':>7}{'CPA':>12}")
    scenarios = [("このまま止まった場合", 1.0),
                 ("残り期間はペース半減", 1 + (md - el) / el * 0.5),
                 ("同じペースが続く（上限）", md / el)]
    for label, mult in scenarios:
        n = new_now * mult
        cpa = f"¥{cost/n:,.0f}" if (cost and n) else "—"
        print(f"  {label:22}{n:>6.1f}人{cpa:>12}")

    if cost:
        base = con.execute(
            "SELECT AVG(customers_new) a FROM hpb_monthly_kpi WHERE store=%s AND month<%s "
            "AND customers_new IS NOT NULL AND data_status='full' "
            "AND month >= to_char(%s::date - interval '6 months', 'YYYY-MM')",
            (args.store, args.month, args.month + "-01")).fetchone()["a"]
        if base:
            base = float(base)
            print("\n■ 判定の目安")
            print(f"  直近6ヶ月の平均新規 {base:.1f}人／月")
            print(f"  今月ここまで {new_now}人。残り{md-el}日で "
                  f"{max(0, base - new_now):.1f}人取れれば平年並み")
            if new_now >= base:
                print("  → すでに平均を超えています。今の施策を続けてよい")
            elif new_now >= base * el / md:
                print("  → ペースは平年並み。様子見でよい")
            else:
                print("  ⚠ ペースが平年を下回っています。月内に手を打つ価値あり")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("record", help="月の途中経過を記録")
    r.add_argument("--store", required=True)
    r.add_argument("--month", required=True)
    r.add_argument("--as-of", required=True, help="取得日 YYYY-MM-DD")
    r.add_argument("--new", type=int, required=True, help="今月ここまでの新規獲得数")
    r.add_argument("--reservations", type=int)
    r.add_argument("--sales", type=float)
    r.add_argument("--cvr", type=float), r.add_argument("--acr", type=float)
    r.add_argument("--pv-coupon-menu", type=int), r.add_argument("--pv-reserve-done", type=int)
    r.add_argument("--source", default="salon_report")
    r.add_argument("--note")
    r.set_defaults(func=cmd_record)

    c = sub.add_parser("check", help="着地見込みとペース判定")
    c.add_argument("--store", required=True)
    c.add_argument("--month", required=True)
    c.set_defaults(func=cmd_check)

    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
