# -*- coding: utf-8 -*-
"""Threads基盤からの Discord 通知。種類ごとにチャンネルを分け、末尾に必ずダッシュボードのURLを付ける。

    python scripts/threads/threads_notify.py --kind care  --text "..."     # 点検・異常・実行の失敗
    python scripts/threads/threads_notify.py --kind learn --text "..."     # 週次の知識整理
    python scripts/threads/threads_notify.py --kind post  --text "..."     # 投稿の結果
    python scripts/threads/threads_notify.py plan                          # 今日の3本（DBから組み立てて送る）
    python scripts/threads/threads_notify.py plan --dry-run                # 送らずに内容と送り先の設定名だけ表示

チャンネル（.env.local）。上から順に、最初に設定されているものへ送る:
    plan  今日の3本        DISCORD_CHANNEL_THREADS_POST → DISCORD_CHANNEL_KPI → DISCORD_CHANNEL_NOTICE
    post  投稿の結果       DISCORD_CHANNEL_THREADS_POST → DISCORD_CHANNEL_KPI → DISCORD_CHANNEL_NOTICE
    care  点検・異常       DISCORD_CHANNEL_THREADS_CARE → DISCORD_CHANNEL_KPI → DISCORD_CHANNEL_NOTICE
    learn 週次の知識整理   DISCORD_CHANNEL_THREADS_LEARN → DISCORD_CHANNEL_KPI → DISCORD_CHANNEL_NOTICE
    blog  記事の承認依頼   DISCORD_CHANNEL_BLOG（save_blog.py が送る。ボタン付き）
ダッシュボード: NEXT_PUBLIC_SITE_URL + /admin/kpi/threads（承認依頼は /admin/approvals も添える）
"""
import argparse
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import JST, connect, env  # noqa: E402

CHAINS = {
    "plan": ("DISCORD_CHANNEL_THREADS_POST", "DISCORD_CHANNEL_KPI", "DISCORD_CHANNEL_NOTICE"),
    "post": ("DISCORD_CHANNEL_THREADS_POST", "DISCORD_CHANNEL_KPI", "DISCORD_CHANNEL_NOTICE"),
    "care": ("DISCORD_CHANNEL_THREADS_CARE", "DISCORD_CHANNEL_KPI", "DISCORD_CHANNEL_NOTICE"),
    "learn": ("DISCORD_CHANNEL_THREADS_LEARN", "DISCORD_CHANNEL_KPI", "DISCORD_CHANNEL_NOTICE"),
    "blog": ("DISCORD_CHANNEL_BLOG", "DISCORD_CHANNEL_NOTICE"),
}
DEFAULT_SITE = "https://mens.umbrella1127.com"


def base_url():
    return (env("NEXT_PUBLIC_SITE_URL") or DEFAULT_SITE).rstrip("/")


def dashboard_url():
    return f"{base_url()}/admin/kpi/threads"


def footer(kind):
    """末尾の案内。承認依頼は承認画面も添える。"""
    lines = []
    if kind == "blog":
        lines.append(f"✅ 承認・却下: {base_url()}/admin/approvals")
    lines.append(f"📊 ダッシュボード: {dashboard_url()}")
    return "\n".join(lines)


def with_footer(text, kind, limit=1950):
    tail = "\n\n" + footer(kind)
    body = text.rstrip()
    if len(body) + len(tail) > limit:
        body = body[: limit - len(tail) - 1] + "…"
    return body + tail


def channel_for(kind):
    for name in CHAINS[kind]:
        v = env(name)
        if v:
            return name, v
    return None, None


def send(text, kind="care", dry_run=False):
    """種類に応じたチャンネルへ送る。末尾のダッシュボードURLは自動で付く。送れたら結果、送らなければ None。"""
    msg = with_footer(text, kind)
    name, channel = channel_for(kind)
    if dry_run:
        print(f"--- 送り先の設定名: {name or '（未設定）'} / 種類: {kind}\n{msg}")
        return None
    token = env("DISCORD_BOT_TOKEN")
    if not token or not channel:
        print(f"Discord未設定（DISCORD_BOT_TOKEN / {' か '.join(CHAINS[kind])}）。送信をスキップ")
        return None
    body = json.dumps({"content": msg, "allowed_mentions": {"parse": []}}).encode("utf-8")
    req = urllib.request.Request(
        f"https://discord.com/api/v10/channels/{channel}/messages", data=body, method="POST",
        headers={"Authorization": f"Bot {token}", "Content-Type": "application/json",
                 "User-Agent": "DiscordBot (mens-umbrella, 1.0)"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:  # noqa: BLE001 - 通知の失敗で本体の処理を止めない
        print(f"Discord送信に失敗: {e}")
        return None


def plan_text():
    """今日（日本時間）の3本を、DBから組み立てる。"""
    today = datetime.now(JST).date()
    rows = connect().execute(
        "select r.slot, r.hook, r.post_text, t.age_band, t.research_notes->>'pillar' pillar "
        "from threads_trials r left join threads_topics t on t.id=r.topic_id "
        "where r.trial_date=%s order by r.slot", (today,)).fetchall()
    if not rows:
        return None
    times = {1: "08:00", 2: "12:30", 3: "19:00"}
    parts = [f"🗓️ 今日のThreads投稿（{today:%m/%d}）"]
    for r in rows:
        meta = " / ".join(x for x in (r["hook"], r["age_band"], r["pillar"]) if x)
        parts.append(f"\n【{times.get(r['slot'], r['slot'])}】{meta}\n{r['post_text']}")
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", nargs="?", choices=["plan"])
    ap.add_argument("--kind", choices=[k for k in CHAINS if k not in ("plan", "blog")], default="care")
    ap.add_argument("--text")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.cmd == "plan":
        text = plan_text()
        if not text:
            print("今日の投稿は未作成のため通知しません")
            return
        r = send(text, "plan", a.dry_run)
    else:
        if not a.text:
            ap.error("--text が必要です")
        r = send(a.text, a.kind, a.dry_run)
    if not a.dry_run:
        print("送信しました" if r else "未送信")


if __name__ == "__main__":
    main()
