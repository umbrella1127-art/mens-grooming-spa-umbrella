# -*- coding: utf-8 -*-
"""勝者の種ネタから書いたブログ記事を、下書きとして保存しDiscordへ承認依頼を送る。

    python scripts/threads/save_blog.py --topic-id 12 --title "..." --excerpt "..." \
        --meta-description "..." --body-file path/to/article.md

やること（この順）
  1. check_article.py と同じ禁止表現チェック → 違反があれば保存せず終了
  2. posts に status=draft / source=ai で保存（slug は threads-YYYYMMDD-<topic_id>）
  3. content_drafts(channel_type=blog, post_id=…) を作り、DISCORD_CHANNEL_BLOG に承認/修正/却下ボタン付きで送る
  4. threads_topics を status=drafted / post_id 紐づけ
承認されると既存フロー（Discordボタン or /admin/approvals）が記事を公開する。ここでは絶対に公開しない。
"""
import argparse
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from check_article import check  # noqa: E402
from hpb_db import JST, connect, env  # noqa: E402

DISCORD_API = "https://discord.com/api/v10"


def discord_send(channel_id, content, draft_id):
    token = env("DISCORD_BOT_TOKEN")
    if not token or not channel_id:
        return None
    body = {
        "content": content[:1900],
        "allowed_mentions": {"parse": []},
        "components": [{"type": 1, "components": [
            {"type": 2, "style": 3, "label": "承認", "custom_id": f"approve:{draft_id}"},
            {"type": 2, "style": 1, "label": "修正", "custom_id": f"edit:{draft_id}"},
            {"type": 2, "style": 4, "label": "却下", "custom_id": f"reject:{draft_id}"},
        ]}],
    }
    req = urllib.request.Request(
        f"{DISCORD_API}/channels/{channel_id}/messages", data=json.dumps(body).encode("utf-8"),
        method="POST", headers={"Authorization": f"Bot {token}", "Content-Type": "application/json",
                                "User-Agent": "DiscordBot (mens-umbrella, 1.0)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic-id", type=int, required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--excerpt", required=True)
    ap.add_argument("--meta-description", required=True)
    ap.add_argument("--body-file", required=True)
    a = ap.parse_args()

    body = Path(a.body_file).read_text(encoding="utf-8")
    bad, warn = check("\n".join([a.title, a.excerpt, a.meta_description, body]))
    for w in warn:
        print(w)
    if bad:
        print("\n".join(bad))
        sys.exit("禁止表現が見つかったため保存しません。記事を直してください。")

    con = connect()
    topic = con.execute("select id, priority, post_id from threads_topics where id=%s",
                        (a.topic_id,)).fetchone()
    if not topic:
        sys.exit(f"topic {a.topic_id} が存在しません")
    if not topic["priority"]:
        sys.exit("この種ネタは Threads の勝者ではありません（priority=false）。ブログ化は勝者のみです。")
    if topic["post_id"]:
        sys.exit("この種ネタはすでに記事化されています")

    slug = f"threads-{datetime.now(JST):%Y%m%d}-{a.topic_id}"
    post = con.execute(
        "insert into posts (slug, title, excerpt, body_markdown, meta_title, meta_description, status, source) "
        "values (%s,%s,%s,%s,%s,%s,'draft','ai') returning id",
        (slug, a.title, a.excerpt, body, a.title, a.meta_description)).fetchone()
    summary = (f"📝 ブログ記事の下書き（Threadsで反応が良かったテーマ）\n"
               f"タイトル：{a.title}\n{a.excerpt}\n\n"
               f"全文は管理画面 /admin/approvals か /admin/posts で確認できます。承認すると公開されます。")
    draft = con.execute(
        "insert into content_drafts (channel_type, content_text, status, post_id) "
        "values ('blog', %s, 'pending', %s) returning id", (summary, post["id"])).fetchone()
    con.execute("update threads_topics set status='drafted', post_id=%s where id=%s",
                (post["id"], a.topic_id))
    con.commit()

    channel = env("DISCORD_CHANNEL_BLOG")
    try:
        msg = discord_send(channel, summary, draft["id"])
    except Exception as e:  # noqa: BLE001 - 通知失敗でも下書き保存は成立させる
        msg = None
        print(f"Discord送信に失敗: {e}")
    if msg:
        con.execute("update content_drafts set discord_channel_id=%s, discord_message_id=%s where id=%s",
                    (msg["channel_id"], msg["id"], draft["id"]))
        con.commit()
    print(f"保存しました: post={post['id']} slug={slug} draft={draft['id']} "
          f"discord={'送信済み' if msg else '未送信（/admin/approvals で承認）'}")


if __name__ == "__main__":
    main()
