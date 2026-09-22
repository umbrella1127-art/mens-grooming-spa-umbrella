# -*- coding: utf-8 -*-
"""HPBブログ下書き（サイト/GBPのブログと合わせて書いた案）をDiscordの
#hpb-ブログ下書き チャンネルへ送る。HPBの管理画面にはブログ投稿APIが無いため、
ここで下書きを共有し、店舗側がHPBのブログ編集画面に手作業でコピー&ペーストする運用。

    python scripts/hpb/notify_blog.py --title "..." --body "..." --note "サイトの○○と同じテーマ"

送信先チャンネルは .env.local の DISCORD_CHANNEL_HPB_BLOG。
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import env  # noqa: E402

DISCORD_API = "https://discord.com/api/v10"


def post_message(channel_id, content):
    token = env("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("DISCORD_BOT_TOKEN が未設定です（.env.local）")
    data = json.dumps({"content": content[:2000],
                       "allowed_mentions": {"parse": []}}).encode("utf-8")
    req = urllib.request.Request(
        f"{DISCORD_API}/channels/{channel_id}/messages", data=data, method="POST",
        headers={"Authorization": f"Bot {token}", "Content-Type": "application/json",
                 "User-Agent": "DiscordBot (https://menssspa.umbrella1127.com, 1.0)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True, help="HPBブログのタイトル（全角25文字以内）")
    ap.add_argument("--body", required=True, help="HPBブログの本文（全角1000文字以内）")
    ap.add_argument("--note", help="補足（例: サイト/GBPのどの記事と揃えたか）")
    args = ap.parse_args()

    channel_id = env("DISCORD_CHANNEL_HPB_BLOG")
    if not channel_id:
        sys.exit("DISCORD_CHANNEL_HPB_BLOG が未設定です（.env.local）")

    title_len = len(args.title)
    body_len = len(args.body)
    warn = []
    if title_len > 25:
        warn.append(f"⚠ タイトルが{title_len}文字（25文字超）")
    if body_len > 1000:
        warn.append(f"⚠ 本文が{body_len}文字（1000文字超）")

    lines = ["📝 **HPBブログ下書き**"]
    if args.note:
        lines.append(args.note)
    if warn:
        lines.extend(warn)
    lines.append(f"\n**タイトル**（{title_len}/25）\n{args.title}")
    lines.append(f"\n**本文**（{body_len}/1000）\n{args.body}")
    lines.append("\nサロンボードのブログ編集画面にコピー&ペーストしてください。")
    body = "\n".join(lines)

    try:
        msg = post_message(channel_id, body)
        print(f"✅ 送信しました (message id: {msg.get('id')})")
    except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, OSError) as e:
        detail = str(e)
        if isinstance(e, urllib.error.HTTPError):
            try:
                detail = f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:200]}"
            except Exception:
                detail = f"HTTP {e.code}"
        sys.exit(f"❌ 送信失敗: {detail}")


if __name__ == "__main__":
    main()
