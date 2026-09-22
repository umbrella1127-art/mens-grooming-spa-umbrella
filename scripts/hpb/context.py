# -*- coding: utf-8 -*-
"""すべてのサブエージェントが「作業を始める前に」最初に実行するスクリプト。

DBの現状（どの月まで揃っているか・未検証の戦略・未適用の分析手法・
未送信の通知・inboxの新着ファイル）を1画面で返す。

    python scripts/hpb/context.py                  # 全体状況
    python scripts/hpb/context.py --store <store> --month 2026-06
    python scripts/hpb/context.py --for hpb-analyst-funnel   # 特定エージェント向けに絞る
    python scripts/hpb/context.py --json           # 機械可読
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import DATA_DIR, connect, now_iso  # noqa: E402

CONTENT_TABLES = ("hpb_blog_effects", "hpb_feature_stats", "hpb_feature_coupon_clicks",
                  "hpb_coupon_stats", "hpb_style_stats", "hpb_stylist_stats",
                  "hpb_competitor_stats", "hpb_ribbon_metrics")


def gather(con, store=None, month=None):
    ctx = {"generated_at": now_iso(), "db": "supabase (HPB_DATABASE_URL)"}

    stores = [dict(r) for r in con.execute(
        "SELECT code, name, genre, hpb_cd, plan_cost_yen, variable_cost_rate, notes "
        "FROM stores WHERE active ORDER BY code")]
    ctx["stores"] = stores
    targets = [store] if store else [s["code"] for s in stores]

    stores_by_code = {s["code"]: s for s in stores}
    ctx["by_store"] = {}
    for st in targets:
        months = [r["month"] for r in con.execute(
            "SELECT month FROM hpb_monthly_kpi WHERE store=%s ORDER BY month", (st,))]
        latest = months[-1] if months else None
        cur = month or latest

        s = {"months_available": len(months),
             "range": f"{months[0]}〜{months[-1]}" if months else None,
             "latest_month": latest, "focus_month": cur,
             "notes": stores_by_code.get(st, {}).get("notes") or None}

        if cur:
            row = con.execute(
                "SELECT * FROM hpb_monthly_kpi WHERE store=%s AND month=%s", (st, cur)).fetchone()
            if row:
                r = dict(row)
                s["focus_kpi"] = {
                    "plan": r["plan"], "掲載料": r["plan_cost_yen"], "予約数": r["net_reservations"],
                    "売上万円": r["sales_man_yen"], "客単価": r["unit_price_yen"],
                    "CVR": r["cvr"], "CVRエリア平均": r["cvr_avg"],
                    "ACR": r["acr"], "ACRエリア平均": r["acr_avg"],
                    "新規": r["customers_new"], "リピーター": r["customers_repeat"],
                }
            s["content_data"] = {
                t: con.execute(f"SELECT COUNT(*) c FROM {t} WHERE store=%s AND month=%s",
                               (st, cur)).fetchone()["c"]
                for t in CONTENT_TABLES
            }

        s["findings_by_month"] = {
            r["month"]: r["c"] for r in con.execute(
                "SELECT month, COUNT(*) c FROM findings WHERE store=%s "
                "GROUP BY month ORDER BY month DESC LIMIT 6", (st,))}

        s["open_strategies"] = [dict(r) for r in con.execute(
            "SELECT id, month, priority, title, status, target_metric, baseline_value, "
            "target_value FROM strategies WHERE store=%s AND status IN ('proposed','adopted') "
            "ORDER BY month DESC, priority", (st,))]

        s["recent_runs"] = [
            {**dict(r), "started_at": str(r["started_at"]),
             "finished_at": str(r["finished_at"]) if r["finished_at"] else None}
            for r in con.execute(
                "SELECT id, month, kind, status, started_at, finished_at FROM analysis_runs "
                "WHERE store=%s ORDER BY id DESC LIMIT 5", (st,))]

        s["pending_notifications"] = [
            {**dict(r), "created_at": str(r["created_at"])} for r in con.execute(
                "SELECT id, month, status, last_error, created_at FROM notifications "
                "WHERE store=%s AND status <> 'sent' ORDER BY id DESC", (st,))]

        s["last_page_observation"] = str(con.execute(
            "SELECT MAX(observed_at) d FROM page_observations WHERE store=%s", (st,)
        ).fetchone()["d"] or "") or None

        inbox = DATA_DIR / st / "inbox"
        s["inbox_files"] = sorted(p.name for p in inbox.glob("*")) if inbox.exists() else []
        s["inbox_path"] = str(inbox.relative_to(DATA_DIR.parent.parent)).replace("\\", "/")

        ctx["by_store"][st] = s

    ctx["period_note"] = {
        "calendar": "暦月（1日〜月末）: 予約数・売上・客単価・新規/リピーター・"
                    "指名・性別年齢・新規リピート率、およびリボンPDF由来の全指標",
        "issue": "月号（最終木曜締め）: 総PV・サロン情報PV・クーポンメニューPV・予約完了PV・"
                 "CVR・ACR・ブログ/口コミ/スタイルの件数と閲覧数",
        "warning": "同じ 'month' キーでも集計期間が違う。PV系（月号）と予約系（暦月）を"
                   "直接掛け合わせて因果を語るときは、約1週間のズレがあることを明記すること。",
    }

    ctx["methods"] = [dict(r) for r in con.execute(
        "SELECT code, name, category, owner_agent, backfill_needed, backfilled_through, status "
        "FROM analysis_methods WHERE status='active' ORDER BY category, code")]
    ctx["methods_needing_backfill"] = [m["code"] for m in ctx["methods"] if m["backfill_needed"]]
    return ctx


def render(ctx, for_agent=None):
    out = []
    out.append(f"=== 集客KPI基盤 / HPB分析 現状 ({ctx['generated_at']}) ===")
    if not ctx["stores"]:
        out.append("⚠ 店舗が未登録です。scripts/hpb/config.json を用意して "
                   "python scripts/hpb/db_migrate.py を実行してください。")
    for st, s in ctx["by_store"].items():
        out.append(f"\n■ 店舗: {st}")
        if s.get("notes"):
            out.append(f"  ★店舗の前提: {s['notes']}")
        out.append(f"  KPI蓄積: {s['months_available']}ヶ月 ({s['range']})  最新月号: {s['latest_month']}")
        if s.get("focus_kpi"):
            k = s["focus_kpi"]
            cpa = (f" / CPA ¥{k['掲載料'] // k['新規']:,}"
                   if k.get("掲載料") and k.get("新規") else "")
            price = f"¥{k['客単価']:,}" if k.get("客単価") is not None else "—"
            out.append(f"  対象月 {s['focus_month']} [{k['plan']}]: 新規{k['新規']}人{cpa} / "
                       f"予約{k['予約数']}件 / 売上{k['売上万円']}万円 / 客単価{price} / "
                       f"CVR {k['CVR']}%(平均{k['CVRエリア平均']}%) / ACR {k['ACR']}%(平均{k['ACRエリア平均']}%)")
        if s.get("content_data"):
            missing = [t for t, c in s["content_data"].items() if c == 0]
            have = [f"{t}:{c}" for t, c in s["content_data"].items() if c]
            out.append(f"  コンテンツ明細: {', '.join(have) if have else 'なし'}")
            if missing:
                out.append(f"  ⚠ 未取込のテーブル: {', '.join(missing)}  → 集計担当の作業が必要")
        if s["inbox_files"]:
            out.append(f"  📥 inbox新着 ({s['inbox_path']}): {', '.join(s['inbox_files'])}")
        else:
            out.append(f"  📥 inbox ({s['inbox_path']}): 空（新規取込なし）")
        out.append(f"  実ページの最終観察日: {s['last_page_observation'] or '未観察'}")
        if s["open_strategies"]:
            out.append(f"  未検証の戦略 {len(s['open_strategies'])}件:")
            for x in s["open_strategies"][:6]:
                base = f" 基準{x['baseline_value']}→目標{x['target_value']}" if x["target_metric"] else ""
                out.append(f"    - [{x['month']} P{x['priority']} {x['status']}] {x['title']}"
                           f"{'（' + x['target_metric'] + base + '）' if x['target_metric'] else ''}")
            out.append("    → 戦略担当は今月これらの効果を必ず検証すること")
        else:
            out.append("  未検証の戦略: なし")
        if s["pending_notifications"]:
            out.append(f"  🔔 未送信/失敗の通知 {len(s['pending_notifications'])}件:")
            for n in s["pending_notifications"]:
                out.append(f"    - #{n['id']} {n['month']} {n['status']} {n['last_error'] or ''}")
        if s["recent_runs"]:
            r = s["recent_runs"][0]
            out.append(f"  直近の実行: run#{r['id']} {r['month']} {r['kind']} → {r['status']}")

    ms = ctx["methods"]
    if for_agent:
        ms = [m for m in ms if m["owner_agent"] == for_agent]
        out.append(f"\n■ {for_agent} が担当する分析手法 {len(ms)}件")
    else:
        out.append(f"\n■ 分析手法レジストリ {len(ms)}件")
    for m in ms:
        flag = " ⚠要遡り適用" if m["backfill_needed"] else ""
        out.append(f"  [{m['category']}] {m['code']}: {m['name']}{flag}")
    if ctx["methods_needing_backfill"]:
        out.append(f"\n⚠ 過去月へ遡り適用が必要な手法: {', '.join(ctx['methods_needing_backfill'])}")
        out.append("   → /hpb-backfill を実行すると過去月に適用されます")
    p = ctx["period_note"]
    out.append("\n■ ★集計期間の違い（取り違え注意）")
    out.append(f"  暦月(calendar): {p['calendar']}")
    out.append(f"  月号(issue)   : {p['issue']}")
    out.append(f"  ⚠ {p['warning']}")

    out.append("\n手法の詳細手順: SELECT procedure FROM analysis_methods WHERE code='...';")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--store")
    ap.add_argument("--month")
    ap.add_argument("--for", dest="for_agent")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    con = connect()
    ctx = gather(con, args.store, args.month)
    if args.json:
        print(json.dumps(ctx, ensure_ascii=False, indent=2, default=str))
    else:
        print(render(ctx, args.for_agent))


if __name__ == "__main__":
    main()
