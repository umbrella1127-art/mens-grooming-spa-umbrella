# -*- coding: utf-8 -*-
"""Threads基盤からの Discord 通知（点検結果・週次の知識整理など）。

    python scripts/threads/notify.py --text "..." [--channel-env DISCORD_CHANNEL_NOTICE]

送信先は .env.local の DISCORD_CHANNEL_KPI（無ければ DISCORD_CHANNEL_NOTICE）。
ボタンは付けない（承認が必要なものは save_blog.py が送る）。
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import env  # noqa: E402


def send(text, channel_env=None):
    token = env("DISCORD_BOT_TOKEN")
    channel = env(channel_env) if channel_env else (env("DISCORD_CHANNEL_KPI") or env("DISCORD_CHANNEL_NOTICE"))
    if not token or not channel:
        print("Discord未設定（DISCORD_BOT_TOKEN / チャンネル）。送信をスキップ")
        return None
    body = json.dumps({"content": text[:1950], "allowed_mentions": {"parse": []}}).encode("utf-8")
    req = urllib.request.Request(
        f"https://discord.com/api/v10/channels/{channel}/messages", data=body, method="POST",
        headers={"Authorization": f"Bot {token}", "Content-Type": "application/json",
                 "User-Agent": "DiscordBot (mens-umbrella, 1.0)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--channel-env")
    a = ap.parse_args()
    r = send(a.text, a.channel_env)
    print("送信しました" if r else "未送信")


if __name__ == "__main__":
    main()
