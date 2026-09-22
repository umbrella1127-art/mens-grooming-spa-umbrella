# -*- coding: utf-8 -*-
"""サイト改善ループの日次ジョブ。GA4の実績を貯め、期限が来た「実験」を前後比較で判定する。

    python scripts/site/daily.py                 # 直近4日分を取り込み → 判定 → 通知（毎朝これ）
    python scripts/site/daily.py --days 30       # 初回や取りこぼし時に遡って取り込む
    python scripts/site/daily.py --no-notify     # Discordに送らない（手動確認用）
    python scripts/site/daily.py status          # 実験の一覧
    python scripts/site/daily.py add --page /menu/facial --kpi line_click \
        --changed "..." --hypothesis "..." --expected "..." [--start 2026-09-22] [--measure-days 14]

判定のしかた（管理画面 /admin/ga4 にも同じ説明を出している）:
  - 変えた日の翌日から N日間（既定14日）を「変更後」、変えた日の前日までの N日間を「変更前」とする
  - line_click は「訪問あたりのLINEクリック率」、それ以外は1日あたりの平均で比べる
  - 数が少なすぎるとき（LINEクリックが前後合計10件未満、訪問が前後合計30件未満）は勝ち負けを付けず、
    期間を倍に延ばして待つ（最長28日）。28日でも足りなければ「判定保留」で終える
  - 20%以上良くなれば「効いた」、20%以上悪くなれば「逆効果」、それ以外は「差なし」
  - 採用するか元に戻すかは人が決める（decision）。ここでは自動で戻さない
"""
import argparse
import json
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "hpb"))
from hpb_db import JST, PROJECT_ROOT, connect, env  # noqa: E402

KPI_LABEL = {
    "line_click": "LINEクリック率",
    "page_views": "1日あたりの閲覧数",
    "sessions": "1日あたりの訪問数",
    "engagement_sec": "訪問あたりの滞在秒数",
}
VERDICT_LABEL = {"win": "効いた", "lose": "逆効果", "flat": "差なし", "insufficient": "判定保留（数が少なすぎる）"}
MIN_LINE_CLICKS = 10
MIN_SESSIONS = 30
MAX_DAYS = 28
THRESHOLD = 0.20


def today_jst():
    return datetime.now(JST).date()


# ---------- 取り込み ----------

def fetch_ga4(start, end):
    cmd = ["node", "--env-file=.env.local", "scripts/site/ga4-daily.mjs",
           f"--start={start}", f"--end={end}"]
    res = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip() or "GA4の取得に失敗しました")
    return json.loads(res.stdout or "[]")


def collect(con, days):
    end = today_jst() - timedelta(days=1)          # 当日分は未確定なので前日まで
    start = end - timedelta(days=days - 1)
    rows = fetch_ga4(start.isoformat(), end.isoformat())
    # GA4は後から数字が確定・補正されるので、取り込む期間はいったん消して入れ直す
    con.execute("DELETE FROM site_metrics_daily WHERE day BETWEEN %s AND %s AND source='ga4'",
                (start, end))
    agg = {}
    for r in rows:
        key = (r["day"], r["page"], r["metric"])
        agg[key] = agg.get(key, 0) + float(r["value"])
    for (d, p, m), v in agg.items():
        con.execute(
            "INSERT INTO site_metrics_daily (day, page, metric, value, source, updated_at) "
            "VALUES (%s,%s,%s,%s,'ga4',now()) ON CONFLICT (day, page, metric) "
            "DO UPDATE SET value=EXCLUDED.value, updated_at=now()", (d, p, m, v))
    rollup_months(con, start, end)
    con.commit()
    print(f"GA4: {start}〜{end} を {len(agg)}行 取り込みました")
    return end


def rollup_months(con, start, end):
    """集客KPIハブ用に、サイト全体の月合計を channel_metrics(ga4) へ入れる。"""
    store = con.execute("SELECT code FROM stores WHERE active ORDER BY code LIMIT 1").fetchone()
    if not store:
        return
    months = sorted({start.strftime("%Y-%m"), end.strftime("%Y-%m")})
    for m in months:
        for metric in ("sessions", "page_views", "line_click"):
            v = con.execute(
                "SELECT COALESCE(SUM(value),0) v FROM site_metrics_daily "
                "WHERE page='(all)' AND metric=%s AND to_char(day,'YYYY-MM')=%s",
                (metric, m)).fetchone()["v"]
            con.execute(
                "INSERT INTO channel_metrics (store, channel, month, metric, value, source, updated_at) "
                "VALUES (%s,'ga4',%s,%s,%s,'api',now()) ON CONFLICT (store, channel, month, metric) "
                "DO UPDATE SET value=EXCLUDED.value, source='api', updated_at=now()",
                (store["code"], m, metric, v))


# ---------- 判定 ----------

def window_stats(con, page, kpi, start, end):
    def total(metric):
        return float(con.execute(
            "SELECT COALESCE(SUM(value),0) v FROM site_metrics_daily "
            "WHERE page=%s AND metric=%s AND day BETWEEN %s AND %s",
            (page, metric, start, end)).fetchone()["v"])

    covered = con.execute(
        "SELECT COUNT(DISTINCT day) n FROM site_metrics_daily WHERE page='(all)' AND day BETWEEN %s AND %s",
        (start, end)).fetchone()["n"]
    days = (end - start).days + 1
    sessions = total("sessions")
    st = {"start": start.isoformat(), "end": end.isoformat(), "days": days,
          "days_with_data": covered, "sessions": sessions}
    if kpi == "line_click":
        clicks = total("line_click")
        st.update(line_click=clicks, value=(clicks / sessions) if sessions else 0.0)
    elif kpi == "engagement_sec":
        eng = total("engagement_sec")
        st.update(engagement_sec=eng, value=(eng / sessions) if sessions else 0.0)
    else:
        v = total(kpi)
        st.update({kpi: v, "value": v / days})
    return st


def fmt(kpi, v):
    if kpi == "line_click":
        return f"{v * 100:.1f}%"
    if kpi == "engagement_sec":
        return f"{v:.0f}秒"
    return f"{v:.1f}"


def judge(kpi, before, after):
    if kpi == "line_click":
        enough = before["line_click"] + after["line_click"] >= MIN_LINE_CLICKS
    else:
        enough = before["sessions"] + after["sessions"] >= MIN_SESSIONS
    if not enough:
        return "insufficient", None
    b, a = before["value"], after["value"]
    if b == 0:
        return ("win" if a > 0 else "flat"), None
    change = (a - b) / b
    if change >= THRESHOLD:
        return "win", change
    if change <= -THRESHOLD:
        return "lose", change
    return "flat", change


def measure(con, data_end):
    """変更後の期間が終わり、データも揃った実験を判定する。判定した実験のリストを返す。"""
    due = con.execute(
        "SELECT * FROM experiments WHERE decision='pending' AND measured_at IS NULL "
        "AND (started_at AT TIME ZONE 'Asia/Tokyo')::date + measure_days <= %s ORDER BY started_at",
        (data_end,)).fetchall()
    done = []
    for e in due:
        start_day = e["started_at"].astimezone(JST).date()
        n = e["measure_days"]
        before = window_stats(con, e["target_page"], e["kpi"],
                              start_day - timedelta(days=n), start_day - timedelta(days=1))
        after = window_stats(con, e["target_page"], e["kpi"],
                             start_day + timedelta(days=1), start_day + timedelta(days=n))
        verdict, change = judge(e["kpi"], before, after)

        if verdict == "insufficient" and n < MAX_DAYS:
            new_n = min(MAX_DAYS, n * 2)
            con.execute("UPDATE experiments SET measure_days=%s, before_stats=%s, after_stats=%s "
                        "WHERE id=%s", (new_n, json.dumps(before), json.dumps(after), e["id"]))
            print(f"{e['code']}: 数が少ないため測定期間を {n}日 → {new_n}日 に延長")
            continue

        label = KPI_LABEL[e["kpi"]]
        summary = (f"{label}: 変更前 {fmt(e['kpi'], before['value'])} → 変更後 {fmt(e['kpi'], after['value'])}"
                   + (f"（{change * 100:+.0f}%）" if change is not None else "")
                   + f" ／ 訪問 {before['sessions']:.0f} → {after['sessions']:.0f}"
                   + f" ／ 判定: {VERDICT_LABEL[verdict]}")
        con.execute(
            "UPDATE experiments SET before_stats=%s, after_stats=%s, verdict=%s, measured_at=now(), "
            "ended_at=%s, result_summary=%s WHERE id=%s",
            (json.dumps(before), json.dumps(after), verdict,
             datetime.combine(start_day + timedelta(days=n), datetime.min.time(), JST),
             summary, e["id"]))
        done.append({**e, "verdict": verdict, "result_summary": summary})
        print(f"{e['code']}: {summary}")
    con.commit()
    return done


# ---------- 通知 ----------

def notify(con, measured):
    if not measured:
        return
    sys.path.insert(0, str(PROJECT_ROOT / "scripts" / "hpb"))
    from notify import post_message  # noqa: E402

    channel_id = env("DISCORD_CHANNEL_KPI") or env("DISCORD_CHANNEL_NOTICE")
    base = (env("NEXT_PUBLIC_SITE_URL") or "").rstrip("/")
    lines = ["🧪 **サイト改善の実験：結果が出ました**"]
    for e in measured:
        lines.append(f"・{e['name']}（{e['target_page']}）\n　{e['result_summary']}")
    lines.append("採用するか元に戻すかを管理画面で選んでください。")
    if base:
        lines.append(f"🔗 {base}/admin/ga4")
    body = "\n".join(lines)
    if not channel_id:
        print("⚠ DISCORD_CHANNEL_KPI が未設定のため通知できませんでした")
        return
    try:
        post_message(channel_id, body)
        print("Discordへ通知しました")
    except Exception as err:  # 通知の失敗で判定結果は失わない
        print(f"⚠ Discord通知に失敗しました: {err}")


# ---------- 一覧・登録 ----------

def cmd_status(con):
    rows = con.execute(
        "SELECT code, name, target_page, kpi, (started_at AT TIME ZONE 'Asia/Tokyo')::date start_day, "
        "measure_days, verdict, decision FROM experiments ORDER BY started_at DESC").fetchall()
    if not rows:
        print("(実験はまだありません)")
    for r in rows:
        print(f"{r['code']}  {r['start_day']}  {r['target_page']:<16} {r['kpi']:<14} "
              f"{r['measure_days']}日  {r['verdict'] or '測定中':<12} {r['decision']}  {r['name']}")
    last = con.execute("SELECT MAX(day) d FROM site_metrics_daily").fetchone()["d"]
    print(f"\nGA4日次データ: {last or 'まだありません'} まで")


def next_code(con, year):
    n = con.execute("SELECT COUNT(*) n FROM experiments WHERE code LIKE %s",
                    (f"EXP-{year}-%",)).fetchone()["n"]
    return f"EXP-{year}-{n + 1:03d}"


def cmd_add(con, a):
    start = date.fromisoformat(a.start) if a.start else today_jst()
    code = next_code(con, start.year)
    con.execute(
        "INSERT INTO experiments (code, name, hypothesis, what_changed, expected, target_page, kpi, "
        "measure_days, started_at, source) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'ai')",
        (code, a.changed[:60], a.hypothesis, a.changed, a.expected, a.page, a.kpi, a.measure_days,
         datetime.combine(start, datetime.min.time(), JST)))
    con.commit()
    print(f"{code} を登録しました")


def main():
    ap = argparse.ArgumentParser(description="サイト改善ループの日次ジョブ")
    ap.add_argument("command", nargs="?", default="run", choices=["run", "status", "add"])
    ap.add_argument("--days", type=int, default=4, help="run: 取り込む日数")
    ap.add_argument("--no-notify", action="store_true")
    ap.add_argument("--page")
    ap.add_argument("--kpi", default="line_click", choices=list(KPI_LABEL))
    ap.add_argument("--changed")
    ap.add_argument("--hypothesis")
    ap.add_argument("--expected")
    ap.add_argument("--start")
    ap.add_argument("--measure-days", type=int, default=14, help="add: 測定日数（7〜56）")
    a = ap.parse_args()

    con = connect()
    if a.command == "status":
        return cmd_status(con)
    if a.command == "add":
        if not (a.page and a.changed and a.hypothesis and a.expected):
            sys.exit("--page --changed --hypothesis --expected は必須です")
        return cmd_add(con, a)

    data_end = collect(con, a.days)
    measured = measure(con, data_end)
    if not a.no_notify:
        notify(con, measured)


if __name__ == "__main__":
    main()
