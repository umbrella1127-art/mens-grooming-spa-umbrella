# -*- coding: utf-8 -*-
"""井上さんの日々の出来事メモ（Discord「#今日の店」）を取り込み、Threadsの承認依頼を送る窓口。

    python scripts/threads/owner_notes.py remind
        営業終わりのリマインドをDISCORD_CHANNEL_OWNER_NOTESに送る（タスクスケジューラから）
    python scripts/threads/owner_notes.py fetch
        チャンネルの新着メッセージ（Bot以外）を owner_notes に取り込む。写真は失効しないよう
        Supabase Storage(site-images)へ再ホストする。取り込んだメッセージには✅を付ける
    python scripts/threads/owner_notes.py request-approval --trial-id <ID>
        threads_trials の1件（status=pending_approval）を、既存の承認基盤
        （content_drafts + Discordボタン／管理画面 /admin/approvals）に乗せて承認依頼を送る

環境変数（.env.local）: DISCORD_BOT_TOKEN / DISCORD_CHANNEL_OWNER_NOTES / DISCORD_CHANNEL_THREADS。
写真の再ホストには NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（無ければ再ホストをスキップし警告を出す）。
"""
import argparse
import json
import random
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import JST, connect, env  # noqa: E402
from threads_notify import with_footer  # noqa: E402

DISCORD_API = "https://discord.com/api/v10"
CHECK_MARK = "%E2%9C%85"  # ✅ をURLエンコードしたもの（reactions APIはraw unicodeをそのままパスに使う）


def _bot_headers():
    token = env("DISCORD_BOT_TOKEN")
    if not token:
        sys.exit("DISCORD_BOT_TOKEN が未設定です（.env.local）")
    return {"Authorization": f"Bot {token}", "Content-Type": "application/json",
            "User-Agent": "DiscordBot (mens-umbrella, 1.0)"}


def _discord_get(path, params=None):
    url = f"{DISCORD_API}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=_bot_headers())
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def _discord_post(path, body):
    req = urllib.request.Request(
        f"{DISCORD_API}{path}", data=json.dumps(body).encode("utf-8"),
        method="POST", headers=_bot_headers())
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def _discord_react(channel_id, message_id):
    req = urllib.request.Request(
        f"{DISCORD_API}/channels/{channel_id}/messages/{message_id}/reactions/{CHECK_MARK}/@me",
        method="PUT", headers=_bot_headers())
    try:
        urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        print(f"  （リアクション付与に失敗: {e.code}。取り込み自体は成功しています）")


# 「何か書いて」だと白紙で止まりやすいので、答えやすい問いを毎回3つランダムに選んで聞く。
# どれか1つに答えるだけでよい（全部に答える必要はない）
QUESTION_POOL = [
    "今日のお客様との会話で、印象に残ったひとことは？",
    "お客様に言われて「あ、それ多いな」と思ったことは？",
    "自分自身が最近、身体や気持ちで感じている変化は？",
    "前橋・群馬で今日あった、ちょっとした出来事や天気は？",
    "施術中にふと思ったこと・考えていたことは？",
    "お客様がそのメニューを選んだ理由・きっかけで印象的だったものは？",
    "男性が美容に対して感じている抵抗や誤解で、今日あらためて感じたものは？",
    "15年ヘッドスパをやってきて、今日改めて思ったことは？",
    "お客様から聞かれて、答えるのが難しかった質問は？",
    "お客様の変化（Before/After）で印象的だったことは？",
    "今日、店で起きた小さな出来事（笑い話でも真面目な話でも）は？",
    "「年齢を重ねても魅力を上げる」を体現していると感じた瞬間は？",
]


def cmd_remind(_):
    channel = env("DISCORD_CHANNEL_OWNER_NOTES")
    if not channel:
        sys.exit("DISCORD_CHANNEL_OWNER_NOTES が未設定です（.env.local）")
    picks = random.sample(QUESTION_POOL, 3)
    lines = "\n".join(f"・{q}" for q in picks)
    text = (f"📝 今日の店の記録、書いてみませんか？\n{lines}\n\n"
            "どれか1つで大丈夫です（全部に答えなくてOK）。1〜3行で十分です。"
            "写真があれば添付してください。書かなくても催促は続きません。")
    body = {"content": with_footer(text, "owner_remind"), "allowed_mentions": {"parse": []}}
    try:
        _discord_post(f"/channels/{channel}/messages", body)
        print("リマインドを送信しました")
    except Exception as e:  # noqa: BLE001 - 通知の失敗で本体を止めない
        print(f"Discord送信に失敗: {e}")


def _upload_image(url, filename_hint):
    """Discordの添付URLをダウンロードし、Supabase Storage(site-images)へ再ホストして公開URLを返す。
    SUPABASE_SERVICE_ROLE_KEY が無ければ None を返す（呼び出し側で警告して元URLは保存しない）。"""
    supa_url = env("NEXT_PUBLIC_SUPABASE_URL")
    service_key = env("SUPABASE_SERVICE_ROLE_KEY")
    if not supa_url or not service_key:
        return None
    # DiscordのCDNは既定のUser-Agent（Python-urllib/...）を弾くため、ブラウザ相当のUAを付ける
    dl_req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(dl_req, timeout=30) as r:
        data = r.read()
        content_type = r.headers.get("Content-Type", "image/jpeg")
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}.get(content_type, "jpg")
    path = f"owner-notes/{datetime.now(JST):%Y%m%d}-{uuid4().hex[:8]}-{filename_hint}.{ext}"
    req = urllib.request.Request(
        f"{supa_url}/storage/v1/object/site-images/{path}", data=data, method="POST",
        headers={"Authorization": f"Bearer {service_key}", "apikey": service_key,
                 "Content-Type": content_type, "x-upsert": "true"})
    with urllib.request.urlopen(req, timeout=60):
        pass
    return f"{supa_url}/storage/v1/object/public/site-images/{path}"


def cmd_fetch(a):
    channel = env("DISCORD_CHANNEL_OWNER_NOTES")
    if not channel:
        sys.exit("DISCORD_CHANNEL_OWNER_NOTES が未設定です（.env.local）")
    con = connect()
    last = con.execute("select discord_message_id from owner_notes order by discord_message_id::numeric desc limit 1"
                        ).fetchone()
    params = {"limit": 100}
    if last:
        params["after"] = last["discord_message_id"]
    else:
        params["limit"] = 50  # 初回は直近50件だけ遡る
    messages = _discord_get(f"/channels/{channel}/messages", params)
    messages = list(reversed(messages))  # 新着APIは新しい順で返るので、時系列順に直す

    inserted, skipped_bot, skipped_empty = 0, 0, 0
    for m in messages:
        if m.get("author", {}).get("bot"):
            skipped_bot += 1
            continue
        text = (m.get("content") or "").strip()
        images = []
        for att in m.get("attachments", []):
            ctype = att.get("content_type") or ""
            if not ctype.startswith("image/"):
                continue
            try:
                hosted = _upload_image(att["url"], att.get("id", "img"))
            except Exception as e:  # noqa: BLE001 - 1枚失敗しても他のメモ取り込みは続ける
                hosted = None
                print(f"  画像の再ホストに失敗（メッセージ{m['id']}）: {e}")
            if hosted:
                images.append(hosted)
            else:
                print(f"  画像あり・再ホスト未実施（SUPABASE_SERVICE_ROLE_KEY未設定 or 失敗）。文字のみ取り込みます: {m['id']}")
        if not text and not images:
            skipped_empty += 1
            continue
        con.execute(
            "insert into owner_notes (discord_message_id, raw_text, image_urls, posted_at) "
            "values (%s, %s, %s, %s) on conflict (discord_message_id) do nothing",
            (m["id"], text or "（本文なし・写真のみ）", json.dumps(images) if images else None,
             m["timestamp"]))
        con.commit()
        inserted += 1
        _discord_react(channel, m["id"])
        print(f"取り込み: {m['id']} 「{text[:40]}」 画像{len(images)}枚")

    print(f"完了: 新規{inserted}件（Bot発言除外{skipped_bot}件・本文空欄除外{skipped_empty}件）")


def cmd_request_approval(a):
    con = connect()
    trial = con.execute(
        "select r.id, r.post_text, r.hook, r.trial_date, r.slot, t.age_band, "
        "t.research_notes->>'pillar' pillar, t.title from threads_trials r "
        "left join threads_topics t on t.id = r.topic_id where r.id=%s", (a.trial_id,)).fetchone()
    if not trial:
        sys.exit(f"trial {a.trial_id} が存在しません")
    if trial["hook"] is None:
        pass  # hookは無くても続行可
    meta = " / ".join(x for x in (trial["pillar"], trial["age_band"]) if x)
    summary = (f"🙋 井上さんの記録から作ったThreads投稿（{trial['trial_date']} {trial['slot']}本目）\n"
               f"{meta}\n\n{trial['post_text']}\n\n"
               f"承認すると、予定の時刻に自動でThreadsへ投稿されます。却下すると投稿されません。")
    draft = con.execute(
        "insert into content_drafts (channel_type, content_text, status, trial_id) "
        "values ('threads', %s, 'pending', %s) returning id", (summary, trial["id"])).fetchone()
    con.commit()

    channel = env("DISCORD_CHANNEL_THREADS") or env("DISCORD_CHANNEL_KPI") or env("DISCORD_CHANNEL_NOTICE")
    if not channel:
        print(f"content_drafts={draft['id']} を作成しましたが、送信先チャンネル未設定のため通知は送っていません。"
              f"/admin/approvals で承認してください。")
        return
    body = {
        "content": with_footer(summary, "threads"),
        "allowed_mentions": {"parse": []},
        "components": [{"type": 1, "components": [
            {"type": 2, "style": 3, "label": "承認", "custom_id": f"approve:{draft['id']}"},
            {"type": 2, "style": 4, "label": "却下", "custom_id": f"reject:{draft['id']}"},
        ]}],
    }
    try:
        msg = _discord_post(f"/channels/{channel}/messages", body)
    except Exception as e:  # noqa: BLE001 - 通知失敗でも下書き作成は成立させる
        msg = None
        print(f"Discord送信に失敗: {e}")
    if msg:
        con.execute("update content_drafts set discord_channel_id=%s, discord_message_id=%s where id=%s",
                    (msg["channel_id"], msg["id"], draft["id"]))
        con.commit()
    print(f"承認依頼を作成しました: content_drafts={draft['id']} trial={trial['id']} "
          f"discord={'送信済み' if msg else '未送信（/admin/approvals で承認）'}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("remind").set_defaults(fn=cmd_remind)
    sub.add_parser("fetch").set_defaults(fn=cmd_fetch)
    p = sub.add_parser("request-approval")
    p.add_argument("--trial-id", type=int, required=True)
    p.set_defaults(fn=cmd_request_approval)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
