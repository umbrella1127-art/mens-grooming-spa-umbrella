# -*- coding: utf-8 -*-
"""サブエージェントがDBへ書き込むための入口。SQLを書かずに済ませる。

  所見を記録:
    python scripts/hpb/db_put.py --finding --store <store> --month 2026-06 \
      --agent hpb-analyst-funnel --method-code new_customer_cpa --category funnel \
      --severity critical --confidence high --title "..." --detail "..." \
      --evidence '{"cpa":3850}'

  戦略を提案:
    python scripts/hpb/db_put.py --strategy --store <store> --month 2026-06 --priority 1 \
      --title "..." --rationale "..." --steps "..." --expected "..." \
      --target-metric customers_new --baseline 10 --target 18

  前回提案の効果を書き戻す:
    python scripts/hpb/db_put.py --strategy-outcome --store <store> --id 3 --outcome-month 2026-07 \
      --outcome-value 14 --status done --note "..."

  分析手法を登録（次月以降・遡り適用の対象になる）:
    python scripts/hpb/db_put.py --method --store <store> --code seasonal_pattern --name "季節性の分離" \
      --category funnel --owner hpb-analyst-funnel --backfill 1 \
      --description "..." --procedure "..."

  任意テーブルへ一括投入（JSON配列）:
    python scripts/hpb/db_put.py --table hpb_ribbon_metrics --store <store> --month 2026-06 \
      --json '[{"metric":"review_total","own_value":27,"comp_avg":632}]'

  月次レポートを保存（JSONファイルから）:
    python scripts/hpb/db_put.py --report --store <store> --month 2026-06 --run-id 3 --file report.json

  取り込み結果の検算:
    python scripts/hpb/db_put.py --verify --store <store> --month 2026-06
"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import (connect, now_iso, upsert, add_finding, register_method,  # noqa: E402
                    insert_returning_id)

KEYS = {
    "hpb_monthly_kpi": ["store", "month"],
    "hpb_blog_effects": ["store", "month", "blog_title", "coupon_name"],
    "hpb_feature_stats": ["store", "month", "feature_name"],
    "hpb_feature_coupon_clicks": ["store", "month", "feature_name", "coupon_name"],
    "hpb_coupon_stats": ["store", "month", "coupon_name"],
    "hpb_style_stats": ["store", "month", "style_name", "listing_no"],
    "hpb_stylist_stats": ["store", "month", "stylist"],
    "hpb_competitor_stats": ["store", "month", "salon_name"],
    "hpb_ribbon_metrics": ["store", "month", "metric"],
    "channel_metrics": ["store", "channel", "month", "metric"],
}
# 旧名（SQLite時代）でも受け付ける
TABLE_ALIAS = {t[4:]: t for t in KEYS if t.startswith("hpb_")}

SEVERITY_ALIAS = {
    "critical": "critical", "crit": "critical", "severe": "critical",
    "warning": "warning", "warn": "warning", "high": "warning", "caution": "warning",
    "info": "info", "medium": "info", "low": "info", "note": "info",
    "good": "good", "positive": "good", "strength": "good",
}
CONFIDENCE_ALIAS = {"high": "high", "medium": "medium", "med": "medium",
                    "low": "low", "middle": "medium"}
STANCES = {"conservative", "standard", "aggressive"}
LENSES = {"price", "creative", "ops", "page"}
SURFACES = {"salon_top", "coupon", "style", "blog", "review", "feature", "competitor"}


def do_finding(con, a):
    sev = SEVERITY_ALIAS.get((a.severity or "").lower())
    if not sev:
        sys.exit(f"severity は critical/warning/info/good のいずれかにしてください（指定値: {a.severity}）")
    conf = CONFIDENCE_ALIAS.get((a.confidence or "").lower(), "medium")
    fid = add_finding(con, a.store, a.month, a.agent, a.category, sev, a.title,
                      a.detail, json.loads(a.evidence) if a.evidence else None,
                      a.method_code, conf, a.run_id, a.channel)
    print(f"finding #{fid} を記録しました: [{sev}] {a.title}")


def do_observation(con, a):
    if a.surface not in SURFACES:
        sys.exit(f"--surface は {'/'.join(sorted(SURFACES))} のいずれか（指定値: {a.surface}）")
    if not a.title:
        sys.exit("--title（表示名・見出しの原文）は必須です")
    observed = a.observed_at or date.today().isoformat()
    oid = insert_returning_id(con, "page_observations", {
        "run_id": a.run_id, "store": a.store, "channel": a.channel, "observed_at": observed,
        "surface": a.surface, "url": a.url, "position": a.position, "label": a.label,
        "title": a.title, "body": a.detail, "value_num": a.value_num,
        "value_unit": a.value_unit, "note": a.note, "created_at": now_iso()})
    con.commit()
    pos = f"#{a.position} " if a.position else ""
    val = f" [{a.value_num:g}{a.value_unit or ''}]" if a.value_num is not None else ""
    print(f"obs #{oid} <{a.surface}> {pos}{a.title}{val}")


def do_option(con, a):
    if a.stance not in STANCES:
        sys.exit(f"--stance は {'/'.join(sorted(STANCES))} のいずれか（指定値: {a.stance}）")
    if a.lens not in LENSES:
        sys.exit(f"--lens は {'/'.join(sorted(LENSES))} のいずれか（指定値: {a.lens}）")
    if not a.assumptions:
        print("⚠ --assumptions（試算の前提）が未指定です。統合担当が案を評価できません",
              file=sys.stderr)
    oid = insert_returning_id(con, "strategy_options", {
        "run_id": a.run_id, "store": a.store, "channel": a.channel, "month": a.month,
        "theme": a.theme, "lens": a.lens, "stance": a.stance, "agent": a.agent,
        "title": a.title, "rationale": a.rationale, "steps": a.steps,
        "expected_effect": a.expected, "target_metric": a.target_metric,
        "baseline_value": a.baseline, "target_value": a.target,
        "sim_price_yen": a.sim_price, "sim_new_customers": a.sim_new,
        "sim_unit_price_yen": a.sim_unit_price, "sim_sales_man_yen": a.sim_sales,
        "sim_cpa_yen": a.sim_cpa, "sim_margin_man_yen": a.sim_margin,
        "assumptions": a.assumptions, "risk": a.risk, "created_at": now_iso()})
    con.commit()
    sim = ""
    if a.sim_new or a.sim_cpa or a.sim_margin:
        sim = (f"\n  試算: 新規{a.sim_new}人 / CPA¥{a.sim_cpa:,.0f} / 限界利益{a.sim_margin}万円"
               if a.sim_cpa else f"\n  試算: 新規{a.sim_new}人")
    print(f"option #{oid} [{a.theme}/{a.lens}/{a.stance}] {a.title}{sim}")


def do_option_score(con, a):
    row = con.execute("SELECT title, theme, stance FROM strategy_options WHERE id=%s",
                      (a.id,)).fetchone()
    if not row:
        sys.exit(f"option #{a.id} が見つかりません")
    scores = [a.impact, a.cost, a.risk_score, a.speed]
    valid = [s for s in scores if s is not None]
    total = round(sum(valid) / max(1, len(valid)), 2)
    con.execute(
        "UPDATE strategy_options SET score_impact=%s, score_cost=%s, score_risk=%s, "
        "score_speed=%s, score_total=%s, selected=%s, decision_note=%s WHERE id=%s",
        (a.impact, a.cost, a.risk_score, a.speed, total, bool(a.selected), a.decision_note, a.id))
    con.commit()
    mark = "✅採用" if a.selected else "見送り"
    print(f"option #{a.id} [{row['theme']}/{row['stance']}] {mark} 平均{total}点: {row['title']}")
    if not a.decision_note:
        print("  ⚠ --decision-note が未指定です。判断理由は必ず残してください")


def do_strategy(con, a):
    sid = insert_returning_id(con, "strategies", {
        "run_id": a.run_id, "store": a.store, "channel": a.channel, "month": a.month,
        "priority": a.priority, "title": a.title, "rationale": a.rationale, "steps": a.steps,
        "expected_effect": a.expected, "target_metric": a.target_metric,
        "target_value": a.target, "baseline_value": a.baseline, "status": "proposed",
        "created_at": now_iso(), "updated_at": now_iso()})
    if a.from_option:
        con.execute("UPDATE strategy_options SET strategy_id=%s, selected=true WHERE id=%s",
                    (sid, a.from_option))
    con.commit()
    src = f"（option #{a.from_option} より）" if a.from_option else ""
    print(f"strategy #{sid} を登録しました（優先度{a.priority}）{src}: {a.title}")
    if a.target_metric:
        print(f"  検証指標: {a.target_metric} {a.baseline} → {a.target}")
    else:
        print("  ⚠ target_metric が未設定です。来月の効果検証ができません")


def do_outcome(con, a):
    row = con.execute("SELECT title, target_metric, baseline_value FROM strategies WHERE id=%s",
                      (a.id,)).fetchone()
    if not row:
        sys.exit(f"strategy #{a.id} が見つかりません")
    con.execute(
        "UPDATE strategies SET outcome_month=%s, outcome_value=%s, outcome_note=%s, "
        "status=COALESCE(%s, status), updated_at=%s WHERE id=%s",
        (a.outcome_month, a.outcome_value, a.note, a.status, now_iso(), a.id))
    con.commit()
    base = row["baseline_value"]
    delta = ""
    if base is not None and a.outcome_value is not None:
        delta = f"（{row['target_metric']} {base} → {a.outcome_value} / {a.outcome_value - base:+.1f}）"
    print(f"strategy #{a.id} の効果を記録しました: {a.status} {delta}\n  {row['title']}")


def do_method(con, a):
    register_method(con, a.code, a.name, a.category, a.description, a.procedure,
                    a.owner, backfill_needed=bool(a.backfill), run_id=a.run_id,
                    channel=a.channel)
    print(f"分析手法 '{a.code}' を登録しました（{a.category} / 担当 {a.owner}）")
    if a.backfill:
        print("  → 過去月への遡り適用が必要です。/hpb-backfill で適用してください")


def do_table(con, a):
    recs = json.loads(a.json) if a.json else json.loads(Path(a.file).read_text(encoding="utf-8"))
    if isinstance(recs, dict):
        recs = [recs]
    table = TABLE_ALIAS.get(a.table, a.table)
    keys = KEYS.get(table)
    if not keys:
        sys.exit(f"未対応のテーブルです: {a.table}（対応: {', '.join(KEYS)}）")
    n = 0
    for rec in recs:
        rec.setdefault("store", a.store)
        if a.month:
            rec.setdefault("month", a.month)
        if "channel" in keys:
            rec.setdefault("channel", a.channel)
        k = {c: rec.get(c) for c in keys}
        v = {c: val for c, val in rec.items() if c not in keys}
        upsert(con, table, k, v)
        n += 1
    con.commit()
    print(f"{table} に {n}件を投入しました")


def do_report(con, a):
    """月次レポート（構造化JSON）を analysis_reports へ保存し、実行記録に紐付ける。

    JSONの形:
    {"title": "...", "headline": "...", "summary_md": "...",
     "sections": [{"heading": "...", "body_md": "..."}], "kpi": {"customers_new": 12, ...}}
    """
    if not a.file:
        sys.exit("--file <report.json> を指定してください")
    rep = json.loads(Path(a.file).read_text(encoding="utf-8"))
    for k in ("title", "sections"):
        if k not in rep:
            sys.exit(f"レポートJSONに {k} がありません")
    upsert(con, "analysis_reports", {"store": a.store, "channel": a.channel, "month": a.month}, {
        "run_id": a.run_id, "title": rep["title"], "headline": rep.get("headline"),
        "summary_md": rep.get("summary_md"), "sections": rep["sections"],
        "kpi": rep.get("kpi") or {}})
    rid = con.execute(
        "SELECT id FROM analysis_reports WHERE store=%s AND channel=%s AND month=%s",
        (a.store, a.channel, a.month)).fetchone()["id"]
    if a.run_id:
        con.execute("UPDATE analysis_runs SET report_id=%s WHERE id=%s", (rid, a.run_id))
    con.commit()
    print(f"report #{rid} を保存しました: {rep['title']}（セクション {len(rep['sections'])}件）")
    print(f"  管理画面: /admin/kpi/hpb/{a.month}")


def do_verify(con, a):
    print(f"=== {a.store} {a.month or '(全月)'} の取り込み検算 ===")
    params = [a.store] + ([a.month] if a.month else [])
    cond = "store=%s" + (" AND month=%s" if a.month else "")

    row = con.execute(f"SELECT * FROM hpb_monthly_kpi WHERE {cond} ORDER BY month DESC LIMIT 1",
                      params).fetchone()
    problems = []
    if not row:
        problems.append("hpb_monthly_kpi にデータがありません")
    else:
        r = dict(row)
        print(f"月号 {r['month']} [{r['plan']}]")
        print(f"  新規 {r['customers_new']}人 / リピーター {r['customers_repeat']}人 "
              f"/ 予約計 {r['net_reservations']}件")
        if r.get("plan_cost_yen") and r.get("customers_new"):
            print(f"  掲載料 ¥{r['plan_cost_yen']:,} → CPA ¥{r['plan_cost_yen']//r['customers_new']:,}")
        else:
            problems.append("plan_cost_yen または customers_new が無くCPAを算出できません"
                            "（掲載料は scripts/hpb/config.json の plan_cost_yen → db_migrate.py）")
        n, rep, net = r["customers_new"], r["customers_repeat"], r["net_reservations"]
        tel = r["tel_visits"] or 0
        if None not in (n, rep, net) and n + rep != net + tel:
            problems.append(f"新規{n}+リピーター{rep} が 予約{net}+TEL{tel} と一致しません")
        for f in ("cvr", "acr", "pv_total", "pv_salon", "pv_coupon_menu", "sales_man_yen"):
            if r.get(f) is None:
                problems.append(f"{f} が欠損しています")

    for t in ("hpb_blog_effects", "hpb_feature_stats", "hpb_coupon_stats", "hpb_style_stats",
              "hpb_stylist_stats", "hpb_competitor_stats", "hpb_ribbon_metrics"):
        c = con.execute(f"SELECT COUNT(*) c FROM {t} WHERE {cond}", params).fetchone()["c"]
        mark = "  " if c else "⚠ "
        print(f"{mark}{t}: {c}件")
        if not c:
            problems.append(f"{t} が空です")

    if problems:
        print("\n要対応:")
        for p in problems:
            print(f"  - {p}")
        sys.exit(2)
    print("\n検算OK: 欠損・不整合はありません")


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    for flag in ("finding", "strategy", "strategy-outcome", "method", "verify",
                 "option", "option-score", "observation", "report"):
        g.add_argument(f"--{flag}", action="store_true")
    g.add_argument("--table")

    ap.add_argument("--store", required=True)
    ap.add_argument("--month")
    ap.add_argument("--channel", default="hpb")
    ap.add_argument("--run-id", type=int)
    ap.add_argument("--file", help="JSONファイル（--report / --table で使用）")
    # finding
    ap.add_argument("--agent"), ap.add_argument("--category"), ap.add_argument("--severity")
    ap.add_argument("--confidence", default="medium"), ap.add_argument("--title")
    ap.add_argument("--detail"), ap.add_argument("--evidence")
    ap.add_argument("--method-code", dest="method_code")
    # strategy
    ap.add_argument("--priority", type=int, default=3), ap.add_argument("--rationale")
    ap.add_argument("--steps"), ap.add_argument("--expected")
    ap.add_argument("--target-metric"), ap.add_argument("--target", type=float)
    ap.add_argument("--baseline", type=float)
    ap.add_argument("--from-option", type=int)
    # option
    ap.add_argument("--theme"), ap.add_argument("--lens"), ap.add_argument("--stance")
    ap.add_argument("--assumptions"), ap.add_argument("--risk")
    ap.add_argument("--sim-price", type=int), ap.add_argument("--sim-new", type=float)
    ap.add_argument("--sim-unit-price", type=int), ap.add_argument("--sim-sales", type=float)
    ap.add_argument("--sim-cpa", type=float), ap.add_argument("--sim-margin", type=float)
    # option-score
    ap.add_argument("--impact", type=int), ap.add_argument("--cost", type=int)
    ap.add_argument("--risk-score", type=int), ap.add_argument("--speed", type=int)
    ap.add_argument("--selected", type=int, default=0)
    ap.add_argument("--decision-note")
    # outcome
    ap.add_argument("--id", type=int), ap.add_argument("--outcome-month")
    ap.add_argument("--outcome-value", type=float), ap.add_argument("--status")
    ap.add_argument("--note")
    # observation
    ap.add_argument("--surface")
    ap.add_argument("--url"), ap.add_argument("--observed-at", dest="observed_at")
    ap.add_argument("--position", type=int)
    ap.add_argument("--label")
    ap.add_argument("--value-num", dest="value_num", type=float)
    ap.add_argument("--value-unit", dest="value_unit")
    # method
    ap.add_argument("--code"), ap.add_argument("--name"), ap.add_argument("--owner")
    ap.add_argument("--description"), ap.add_argument("--procedure")
    ap.add_argument("--backfill", type=int, default=1)
    # table
    ap.add_argument("--json")

    a = ap.parse_args()
    con = connect()

    if a.finding:
        do_finding(con, a)
    elif a.observation:
        do_observation(con, a)
    elif a.option:
        do_option(con, a)
    elif a.option_score:
        do_option_score(con, a)
    elif a.strategy:
        do_strategy(con, a)
    elif a.strategy_outcome:
        do_outcome(con, a)
    elif a.method:
        do_method(con, a)
    elif a.report:
        do_report(con, a)
    elif a.verify:
        do_verify(con, a)
    else:
        do_table(con, a)


if __name__ == "__main__":
    main()
