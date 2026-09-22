# -*- coding: utf-8 -*-
"""実行ごとの振り返り（4層）を書く・読む窓口。全チャネル（threads / hpb / site ...）共通。
手順と書き方は .claude/skills/run-reflection/SKILL.md。

  書く（作業の最後に1回）:
    python scripts/reflect/reflect.py add --channel threads --agent threads-strategist \
      --run-ref threads:validate:2026-09-22 \
      --output "今日の3本を登録（p40疲労・p47睡眠・p53肩こり）" --url https://... \
      --did "前日3本を実測→勝者なし→今日の3本を draft 登録" \
      --self-check "禁止表現チェック3本ともOK。日付はJSTで書いた。手順Cの勝者判定は該当なしで省略" \
      --rules-ok yes \
      --system "skill|.claude/skills/threads-validate/SKILL.md|反応ゼロが続く日の手順を足す|3日連続0で勝者が決まらず止まる" \
      --business "timing|投稿時刻を朝7時台に1本寄せて試す|8:00枠だけ閲覧がある"
    改善案が無いときは --no-system / --no-business を明示する（書き忘れと区別するため）
    --file reflection.json でも可（キー: output, urls, did, self_check, rules_ok, system[], business[]）

  読む:
    python scripts/reflect/reflect.py open --kind system [--channel threads]   # 未処理の仕組み改善案
    python scripts/reflect/reflect.py open --kind business --channel hpb       # 未処理の事業改善案
    python scripts/reflect/reflect.py recent [--channel threads] [--limit 10]  # 直近の振り返り

  処理する（読み手の担当が付ける。適用・却下は理由必須）:
    python scripts/reflect/reflect.py resolve --id 12 --status reported --by threads-caretaker
    python scripts/reflect/reflect.py resolve --id 12 --status rejected --by threads-librarian --note "..."
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "hpb"))
from hpb_db import connect  # noqa: E402

CHANNELS = ("threads", "hpb", "site", "gbp", "seo")
SYSTEM_TARGETS = ("agent", "skill", "code", "rule", "data")
BUSINESS_TARGETS = ("content", "timing", "offer", "channel", "other")
STATUSES = ("reported", "accepted", "applied", "rejected", "open")


def parse_system(s):
    parts = [p.strip() for p in s.split("|")]
    if len(parts) != 4:
        sys.exit(f"--system は「対象|ファイルや項目|提案|理由」の4つを | で区切って書く: {s}")
    target, ref, proposal, reason = parts
    return {"target": target, "target_ref": ref or None, "proposal": proposal, "reason": reason}


def parse_business(s):
    parts = [p.strip() for p in s.split("|")]
    if len(parts) != 3:
        sys.exit(f"--business は「分類|提案|理由」の3つを | で区切って書く: {s}")
    target, proposal, reason = parts
    return {"target": target, "target_ref": None, "proposal": proposal, "reason": reason}


def validate_items(items, kind):
    allowed = SYSTEM_TARGETS if kind == "system" else BUSINESS_TARGETS
    for it in items:
        if it.get("target") not in allowed:
            sys.exit(f"{kind} の対象は {allowed} のどれか（指定: {it.get('target')}）")
        if not (it.get("proposal") or "").strip() or not (it.get("reason") or "").strip():
            sys.exit(f"{kind} の改善案には提案と理由の両方が要る")


def cmd_add(a):
    if a.file:
        d = json.loads(Path(a.file).read_text(encoding="utf-8"))
        output, urls, did = d.get("output"), d.get("urls") or [], d.get("did")
        self_check, rules_ok = d.get("self_check"), d.get("rules_ok")
        system = d.get("system")
        business = d.get("business")
    else:
        output, urls, did = a.output, a.url or [], a.did
        self_check = a.self_check
        rules_ok = {"yes": True, "no": False}.get((a.rules_ok or "").lower())
        system = [parse_system(s) for s in a.system] if a.system else ([] if a.no_system else None)
        business = [parse_business(s) for s in a.business] if a.business else ([] if a.no_business else None)

    missing = [n for n, v in (("--output", output), ("--did", did), ("--self-check", self_check)) if not (v or "").strip()]
    if missing:
        sys.exit(f"① 成果と ② やったこと・自己診断は必須です（不足: {', '.join(missing)}）")
    if rules_ok is None:
        sys.exit("--rules-ok yes|no を指定してください（ルールを守れたかの自己申告）")
    if system is None:
        sys.exit("③ 仕組みの改善案を --system で書くか、無ければ --no-system を明示してください")
    if business is None:
        sys.exit("④ 事業の改善案を --business で書くか、無ければ --no-business を明示してください")
    validate_items(system, "system")
    validate_items(business, "business")

    con = connect()
    rid = con.execute(
        "INSERT INTO run_reflections (channel, agent, run_ref, output_summary, output_urls, did, self_check, rules_ok) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
        (a.channel, a.agent, a.run_ref, output, urls, did, self_check, rules_ok)).fetchone()["id"]
    for kind, items in (("system", system), ("business", business)):
        for it in items:
            con.execute(
                "INSERT INTO improvement_proposals (reflection_id, channel, kind, target, target_ref, proposal, reason) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (rid, a.channel, kind, it["target"], it.get("target_ref"), it["proposal"], it["reason"]))
    con.commit()
    print(f"振り返り #{rid} を記録しました（仕組みの改善案 {len(system)}件 / 事業の改善案 {len(business)}件）")


def cmd_open(a):
    con = connect()
    sql = ("SELECT p.id, p.channel, p.target, p.target_ref, p.proposal, p.reason, p.status, "
           "r.agent, (p.created_at AT TIME ZONE 'Asia/Tokyo')::date d, "
           "(SELECT COUNT(*) FROM improvement_proposals q WHERE q.kind=p.kind AND q.channel=p.channel "
           " AND q.status IN ('open','reported') AND q.proposal=p.proposal) same "
           "FROM improvement_proposals p JOIN run_reflections r ON r.id=p.reflection_id "
           "WHERE p.kind=%s AND p.status IN ('open','reported')")
    params = [a.kind]
    if a.channel:
        sql += " AND p.channel=%s"
        params.append(a.channel)
    sql += " ORDER BY p.created_at DESC LIMIT %s"
    params.append(a.limit)
    rows = con.execute(sql, params).fetchall()
    if not rows:
        print("(未処理の改善案はありません)")
        return
    for r in rows:
        ref = f" [{r['target_ref']}]" if r["target_ref"] else ""
        print(f"#{r['id']} {r['d']} {r['channel']}/{r['agent']} {r['status']}  <{r['target']}>{ref}\n"
              f"    提案: {r['proposal']}\n    理由: {r['reason']}")
    print(f"({len(rows)}件)")


def cmd_recent(a):
    con = connect()
    sql = ("SELECT r.id, (r.created_at AT TIME ZONE 'Asia/Tokyo') t, r.channel, r.agent, r.run_ref, "
           "r.rules_ok, r.output_summary, r.self_check, "
           "(SELECT COUNT(*) FROM improvement_proposals p WHERE p.reflection_id=r.id AND p.kind='system') ns, "
           "(SELECT COUNT(*) FROM improvement_proposals p WHERE p.reflection_id=r.id AND p.kind='business') nb "
           "FROM run_reflections r")
    params = []
    if a.channel:
        sql += " WHERE r.channel=%s"
        params.append(a.channel)
    sql += " ORDER BY r.created_at DESC LIMIT %s"
    params.append(a.limit)
    for r in con.execute(sql, params).fetchall():
        ok = "OK" if r["rules_ok"] else "要確認"
        print(f"#{r['id']} {r['t']:%m/%d %H:%M} {r['channel']}/{r['agent']} ({r['run_ref']}) ルール:{ok} "
              f"仕組み{r['ns']}・事業{r['nb']}\n    成果: {r['output_summary'][:100]}\n    自己診断: {r['self_check'][:100]}")


def cmd_resolve(a):
    if a.status in ("accepted", "applied", "rejected") and not (a.note or "").strip():
        sys.exit("accepted / applied / rejected にするときは --note で理由を残してください")
    con = connect()
    cur = con.execute(
        "UPDATE improvement_proposals SET status=%s, resolved_by=%s, resolve_note=COALESCE(%s, resolve_note), "
        "resolved_at=CASE WHEN %s IN ('applied','rejected') THEN now() ELSE resolved_at END WHERE id=%s",
        (a.status, a.by, a.note, a.status, a.id))
    con.commit()
    print(f"OK {cur.rowcount}行（#{a.id} → {a.status}）")


def main():
    ap = argparse.ArgumentParser(description="実行ごとの振り返り（4層）")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("add")
    s.add_argument("--channel", required=True, choices=CHANNELS)
    s.add_argument("--agent", required=True)
    s.add_argument("--run-ref", required=True)
    s.add_argument("--file")
    s.add_argument("--output")
    s.add_argument("--url", action="append")
    s.add_argument("--did")
    s.add_argument("--self-check")
    s.add_argument("--rules-ok")
    s.add_argument("--system", action="append")
    s.add_argument("--business", action="append")
    s.add_argument("--no-system", action="store_true")
    s.add_argument("--no-business", action="store_true")
    s.set_defaults(func=cmd_add)

    o = sub.add_parser("open")
    o.add_argument("--kind", required=True, choices=("system", "business"))
    o.add_argument("--channel", choices=CHANNELS)
    o.add_argument("--limit", type=int, default=20)
    o.set_defaults(func=cmd_open)

    r = sub.add_parser("recent")
    r.add_argument("--channel", choices=CHANNELS)
    r.add_argument("--limit", type=int, default=10)
    r.set_defaults(func=cmd_recent)

    v = sub.add_parser("resolve")
    v.add_argument("--id", type=int, required=True)
    v.add_argument("--status", required=True, choices=STATUSES)
    v.add_argument("--by", required=True)
    v.add_argument("--note")
    v.set_defaults(func=cmd_resolve)

    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
