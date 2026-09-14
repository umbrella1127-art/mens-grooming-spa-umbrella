# -*- coding: utf-8 -*-
"""Discord通知。サイトと同じ Bot（DISCORD_BOT_TOKEN）でレポートの要約と管理画面リンクを送る。

    python scripts/hpb/notify.py send --store <store> --month 2026-06 --run-id 3 \
        --message "<新規数・CPA・最大の課題・筆頭施策を含む3〜5行>"
    python scripts/hpb/notify.py status

送信先チャンネルは .env.local の DISCORD_CHANNEL_KPI（無ければ DISCORD_CHANNEL_NOTICE）。
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import connect, env, insert_returning_id, now_iso  # noqa: E402

DISCORD_API = "https://discord.com/api/v10"


def report_url(month):
    base = (env("NEXT_PUBLIC_SITE_URL") or "").rstrip("/")
    return f"{base}/admin/kpi/hpb/{month}" if base else None


def post_message(channel_id, content):
    token = env("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("DISCORD_BOT_TOKEN が未設定です（.env.local）")
    data = json.dumps({"content": content[:2000],
                       "allowed_mentions": {"parse": []}}).encode("utf-8")
    req = urllib.request.Request(
        f"{DISCORD_API}/channels/{channel_id}/messages", data=data, method="POST",
        headers={"Authorization": f"Bot {token}", "Content-Type": "application/json",
                 "User-Agent": "umbrella-kpi-bot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def cmd_send(args):
    con = connect()
    channel_id = env("DISCORD_CHANNEL_KPI") or env("DISCORD_CHANNEL_NOTICE")
    url = args.url or report_url(args.month)
    body = f"📊 **HPB月次レポート {args.month}**\n{args.message}"
    if url:
        body += f"\n\n🔗 レポートを開く: {url}"
    nid = insert_returning_id(con, "notifications", {
        "run_id": args.run_id, "store": args.store, "channel": "hpb", "month": args.month,
        "message": args.message, "url": url, "status": "pending", "created_at": now_iso()})
    con.commit()
    if not channel_id:
        con.execute("UPDATE notifications SET status='failed', last_error=%s WHERE id=%s",
                    ("DISCORD_CHANNEL_KPI / DISCORD_CHANNEL_NOTICE が未設定", nid))
        con.commit()
        sys.exit("送信先チャンネルが未設定です（.env.local の DISCORD_CHANNEL_KPI）")
    try:
        msg = post_message(channel_id, body)
        con.execute("UPDATE notifications SET status='sent', sent_at=%s, discord_message_id=%s, "
                    "last_error=NULL WHERE id=%s", (now_iso(), str(msg.get("id", "")), nid))
        con.commit()
        print(f"✅ 送信しました (#{nid} {args.month})" + (f"  {url}" if url else ""))
    except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, OSError) as e:
        detail = str(e)
        if isinstance(e, urllib.error.HTTPError):
            try:
                detail = f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:200]}"
            except Exception:
                detail = f"HTTP {e.code}"
        con.execute("UPDATE notifications SET status='failed', last_error=%s WHERE id=%s",
                    (detail, nid))
        con.commit()
        sys.exit(f"❌ 送信失敗 (#{nid}): {detail}")


def cmd_status(args):
    con = connect()
    rows = con.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 20").fetchall()
    if not rows:
        print("通知履歴はありません。")
        return
    print(f"{'ID':>3} {'月号':8} {'状態':8} {'送信日時':26} URL")
    for r in rows:
        print(f"{r['id']:>3} {r['month']:8} {r['status']:8} {str(r['sent_at'] or '-'):26} "
              f"{r['url'] or ''}" + (f"  ⚠{r['last_error'][:40]}" if r["last_error"] else ""))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("send", help="通知を送信")
    s.add_argument("--store", required=True)
    s.add_argument("--month", required=True)
    s.add_argument("--message", required=True)
    s.add_argument("--run-id", type=int)
    s.add_argument("--url", help="既定は NEXT_PUBLIC_SITE_URL/admin/kpi/hpb/<month>")
    s.set_defaults(func=cmd_send)

    st = sub.add_parser("status", help="通知の状況一覧")
    st.set_defaults(func=cmd_status)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
