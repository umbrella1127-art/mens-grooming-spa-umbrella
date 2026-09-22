# -*- coding: utf-8 -*-
"""Threads API 窓口。アカウント未設定でも dry-run で全体を動かせる。

    python scripts/threads/threads_api.py post-due [--date YYYY-MM-DD] [--slot N] [--live]
        その日の draft を投稿する。--live が無ければ投稿せず内容の表示だけ（既定）。
    python scripts/threads/threads_api.py measure [--date YYYY-MM-DD] [--t7-date YYYY-MM-DD]
        昨日の投稿を T+1、7日前の投稿を T+7 として実測し threads_trial_snapshots に残す。
        それぞれ「前の7日間の同じ日数後の平均」と比べて判定し（judge.py）、投稿前の予測と答え合わせする。
        T+1 はその日の最高スコア（>0）を is_winner にし、topic に priority=true を付ける。
        T+7 で反応が平均を上回った投稿は、T+1 で漏れていても勝者に追加する。
    python scripts/threads/threads_api.py refresh-token
        長期トークンを更新して .env.local に書き戻す（60日で失効するので月1回以上）。

環境変数（.env.local）: THREADS_USER_ID / THREADS_ACCESS_TOKEN
"""
import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import ENV_PATH, JST, connect, env  # noqa: E402
from threads_notify import send as notify  # noqa: E402
import judge  # noqa: E402
from psycopg.types.json import Json  # noqa: E402

BASE = "https://graph.threads.net/v1.0"
METRICS = ("views", "likes", "replies", "reposts", "quotes", "shares")
WEIGHT = {"likes": 1, "replies": 2, "reposts": 3, "quotes": 3, "shares": 3}


def creds():
    tok, uid = env("THREADS_ACCESS_TOKEN"), env("THREADS_USER_ID")
    if not tok or not uid:
        sys.exit("THREADS_ACCESS_TOKEN / THREADS_USER_ID が未設定です（.env.local）。"
                 "手順は scripts/threads/GUIDE.md の「Threadsの接続」を参照。")
    return tok, uid


def call(method, url, params):
    data = urllib.parse.urlencode(params).encode() if method == "POST" else None
    if method == "GET":
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"Threads API エラー {e.code}: {e.read().decode('utf-8', 'replace')[:400]}")


def publish_text(text, topic_tag=None):
    tok, uid = creds()
    params = {"media_type": "TEXT", "text": text, "access_token": tok}
    if topic_tag:
        params["topic_tag"] = topic_tag  # 1投稿に1つ。本文の外に付く（scripts/threads/tags.md）
    c = call("POST", f"{BASE}/{uid}/threads", params)
    p = call("POST", f"{BASE}/{uid}/threads_publish",
             {"creation_id": c["id"], "access_token": tok})
    return p["id"]


def cmd_post_due(a):
    con = connect()
    day = a.date or datetime.now(JST).date().isoformat()
    sql = "select id, slot, post_text, topic_tag from threads_trials where trial_date=%s and status='draft'"
    args = [day]
    if a.slot:
        sql += " and slot=%s"
        args.append(a.slot)
    rows = con.execute(sql + " order by slot", args).fetchall()
    if not rows:
        print(f"{day}: 投稿待ちの draft はありません")
        return
    for r in rows:
        if not a.live:
            print(f"[dry-run] slot{r['slot']}:\n{r['post_text']}\n")
            continue
        try:
            pid = publish_text(r["post_text"], r["topic_tag"])
        except SystemExit as e:
            con.execute("update threads_trials set status='failed', result_note=%s where id=%s",
                        (str(e)[:300], r["id"]))
            con.commit()
            notify(f"⚠️ Threads slot{r['slot']} の投稿に失敗しました" + chr(10) + str(e)[:300], "care")
            raise
        con.execute("update threads_trials set status='posted', threads_post_id=%s, posted_at=now() "
                    "where id=%s", (pid, r["id"]))
        con.commit()
        print(f"posted slot{r['slot']} -> {pid}")
        link = ""
        try:
            tok, _ = creds()
            link = call("GET", f"{BASE}/{pid}", {"fields": "permalink", "access_token": tok}).get("permalink", "")
        except SystemExit:
            pass
        tag = f"（タグ: {r['topic_tag']}）" if r["topic_tag"] else ""
        notify(f"✅ Threads slot{r['slot']} を投稿しました{tag}" + chr(10) + r["post_text"] + (chr(10) + link if link else ""), "post")


def fetch_insights(tok, post_id):
    res = call("GET", f"{BASE}/{post_id}/insights",
               {"metric": ",".join(METRICS), "access_token": tok})
    m = {}
    for d in res.get("data", []):
        if d.get("values"):
            m[d["name"]] = d["values"][0]["value"]
        else:
            m[d["name"]] = d.get("total_value", {}).get("value", 0)
    return m, sum(m.get(k, 0) * w for k, w in WEIGHT.items())


def promote(con, r):
    con.execute("update threads_trials set is_winner=true where id=%s", (r["id"],))
    if r["topic_id"]:
        con.execute("update threads_topics set priority=true, status='tested' where id=%s",
                    (r["topic_id"],))


def measure_day(con, tok, day, days_after):
    """day に投稿した分を days_after 日後の値として記録し、ベースラインと比べて判定する。"""
    rows = con.execute(
        "select id, topic_id, threads_post_id, is_winner, predicted_metric, predicted_vs_baseline "
        "from threads_trials where trial_date=%s and status='posted' and threads_post_id is not null "
        "order by slot", (day,)).fetchall()
    tag = f"T+{days_after}"
    if not rows:
        print(f"[{tag}] {day}: 実測対象の投稿がありません")
        return
    measured = []
    for r in rows:
        m, score = fetch_insights(tok, r["threads_post_id"])
        views = m.get("views", 0)
        con.execute(
            "insert into threads_trial_snapshots (trial_id, days_after, metrics, views, reaction_score, measured_at) "
            "values (%s,%s,%s,%s,%s,now()) on conflict (trial_id, days_after) do update set "
            "metrics=excluded.metrics, views=excluded.views, reaction_score=excluded.reaction_score, measured_at=now()",
            (r["id"], days_after, Json(m), views, score))
        # threads_trials には最新の値を持たせる（T+1 で勝者を付け直すので一度外す）
        extra = ", is_winner=false" if days_after == 1 else ""
        con.execute(f"update threads_trials set metrics=%s, reaction_score=%s, measured_at=now(){extra} "
                    "where id=%s", (Json(m), score, r["id"]))
        measured.append((r, views, score))

    base = judge.baseline(con, date.fromisoformat(str(day)), days_after)
    print(f"[{tag}] {day}  比べる相手: {base['from']}〜{base['to']} の{base['n']}本 "
          f"平均 表示{base['views']:.0f}・反応{base['reaction_score']:.1f}")
    for r, views, score in measured:
        v = judge.verdict(views, score, base)
        hit = judge.prediction_hit(r["predicted_metric"], r["predicted_vs_baseline"], views, score, base)
        con.execute("update threads_trial_snapshots set baseline=%s, verdict=%s, prediction_hit=%s "
                    "where trial_id=%s and days_after=%s", (Json(base), v, hit, r["id"], days_after))
        print(f"  trial {r['id']}: 表示{views:.0f} 反応{score:.0f} → {judge.VERDICT_LABEL[v]}"
              + (f" ／ {judge.HIT_LABEL[hit]}" if hit else ""))
        if days_after == 7 and v == "win" and not r["is_winner"]:
            promote(con, r)
            print(f"  → 1週間後に反応が伸びたので勝者に追加: trial {r['id']} topic={r['topic_id']}")

    if days_after == 1:
        best = max((x for x in measured if x[1] > 0), key=lambda x: x[2], default=None)
        if best and best[2] > 0:
            promote(con, best[0])
            print(f"  勝者: trial {best[0]['id']} (score={best[2]}) topic={best[0]['topic_id']}")
        else:
            print("  反応が取れた投稿がないため勝者なし（翌日のブログ化は見送り。1週間後にもう一度見る）")
    con.commit()


def cmd_measure(a):
    tok, _ = creds()
    con = connect()
    today = datetime.now(JST).date()
    if not a.only_t7:
        measure_day(con, tok, a.date or (today - timedelta(days=1)).isoformat(), 1)
    if not a.only_t1:
        measure_day(con, tok, a.t7_date or (today - timedelta(days=7)).isoformat(), 7)


def cmd_refresh(_):
    tok = env("THREADS_ACCESS_TOKEN")
    if not tok:
        sys.exit("THREADS_ACCESS_TOKEN が未設定です")
    res = call("GET", "https://graph.threads.net/refresh_access_token",
               {"grant_type": "th_refresh_token", "access_token": tok})
    new = res["access_token"]
    out, hit = [], False
    for ln in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if ln.startswith("THREADS_ACCESS_TOKEN="):
            out.append(f"THREADS_ACCESS_TOKEN={new}")
            hit = True
        else:
            out.append(ln)
    if not hit:
        out.append(f"THREADS_ACCESS_TOKEN={new}")
    ENV_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"トークンを更新しました（残り約{res.get('expires_in', 0) // 86400}日）")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("post-due")
    p.add_argument("--date")
    p.add_argument("--slot", type=int)
    p.add_argument("--live", action="store_true")
    p.set_defaults(fn=cmd_post_due)
    m = sub.add_parser("measure")
    m.add_argument("--date", help="T+1 で測る投稿日（既定: 昨日）")
    m.add_argument("--t7-date", help="T+7 で測る投稿日（既定: 7日前）")
    m.add_argument("--only-t1", action="store_true")
    m.add_argument("--only-t7", action="store_true")
    m.set_defaults(fn=cmd_measure)
    sub.add_parser("refresh-token").set_defaults(fn=cmd_refresh)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
