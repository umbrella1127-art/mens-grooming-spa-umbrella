# -*- coding: utf-8 -*-
"""Threads API 窓口。アカウント未設定でも dry-run で全体を動かせる。

    python scripts/threads/threads_api.py post-due [--date YYYY-MM-DD] [--slot N] [--live]
        その日の draft を投稿する。--live が無ければ投稿せず内容の表示だけ（既定）。
    python scripts/threads/threads_api.py measure [--date YYYY-MM-DD]
        投稿済みの実測（views/likes/replies/reposts/quotes/shares）を取り、reaction_score を計算。
        その日の最高スコアを is_winner にし、その topic に priority=true を付ける。
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
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import ENV_PATH, JST, connect, env  # noqa: E402
from threads_notify import send as notify  # noqa: E402
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


def publish_text(text):
    tok, uid = creds()
    c = call("POST", f"{BASE}/{uid}/threads",
             {"media_type": "TEXT", "text": text, "access_token": tok})
    p = call("POST", f"{BASE}/{uid}/threads_publish",
             {"creation_id": c["id"], "access_token": tok})
    return p["id"]


def cmd_post_due(a):
    con = connect()
    day = a.date or datetime.now(JST).date().isoformat()
    sql = "select id, slot, post_text from threads_trials where trial_date=%s and status='draft'"
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
            pid = publish_text(r["post_text"])
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
        notify(f"✅ Threads slot{r['slot']} を投稿しました" + chr(10) + r["post_text"] + (chr(10) + link if link else ""), "post")


def cmd_measure(a):
    tok, _ = creds()
    con = connect()
    day = a.date or (datetime.now(JST).date() - timedelta(days=1)).isoformat()
    rows = con.execute("select id, topic_id, threads_post_id from threads_trials "
                       "where trial_date=%s and status='posted' and threads_post_id is not null",
                       (day,)).fetchall()
    if not rows:
        print(f"{day}: 実測対象の投稿がありません")
        return
    best = None
    for r in rows:
        res = call("GET", f"{BASE}/{r['threads_post_id']}/insights",
                   {"metric": ",".join(METRICS), "access_token": tok})
        m = {}
        for d in res.get("data", []):
            if d.get("values"):
                m[d["name"]] = d["values"][0]["value"]
            else:
                m[d["name"]] = d.get("total_value", {}).get("value", 0)
        score = sum(m.get(k, 0) * w for k, w in WEIGHT.items())
        con.execute("update threads_trials set metrics=%s, reaction_score=%s, measured_at=now(), "
                    "is_winner=false where id=%s", (Json(m), score, r["id"]))
        print(f"trial {r['id']}: {m} score={score}")
        if m.get("views", 0) > 0 and (best is None or score > best[1]):
            best = (r, score)
    if best and best[1] > 0:
        r, score = best
        con.execute("update threads_trials set is_winner=true where id=%s", (r["id"],))
        if r["topic_id"]:
            con.execute("update threads_topics set priority=true, status='tested' where id=%s",
                        (r["topic_id"],))
        print(f"勝者: trial {r['id']} (score={score}) topic={r['topic_id']}")
    else:
        print("反応が取れた投稿がないため勝者なし（翌日のブログ化は見送り）")
    con.commit()


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
    m.add_argument("--date")
    m.set_defaults(fn=cmd_measure)
    sub.add_parser("refresh-token").set_defaults(fn=cmd_refresh)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
