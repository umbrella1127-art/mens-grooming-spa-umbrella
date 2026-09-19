# -*- coding: utf-8 -*-
"""Threads投稿・ブログ記事の禁止表現チェック（AGENTS.md「コンテンツ上の絶対ルール」の機械化）。

    python scripts/threads/check_article.py path/to/article.md
    python scripts/threads/check_article.py --text "投稿文"

違反があれば1行ずつ表示して終了コード1。人の目のレビューの代わりではなく、明白な事故を止める最低ライン。
"""
import argparse
import re
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

RULES = [
    ("医療的断定", r"治(る|ります|せる|療)|改善(する|します|できる)|完治|若返(る|り)|(毛が|髪が)生え|発毛(する|します|できる)|"
                  r"必ず|絶対に|間違いなく|100%|確実に|効果が(ある|出る)と保証|副作用(なし|はありません)"),
    ("煽り・偽の希少性", r"今だけ|今すぐ|残り\d+(名|枠|席)|限定\d+名|急いで|見逃(す|さないで)|選ばれた|一部の男性だけ|"
                       r"大幅値引き|激安|最安"),
    ("個室（存在しない）", r"個室|完全個室|プライベートルーム"),
    ("業態の誤り（理容室）", r"美容室|美容院"),
    ("電話・他媒体", r"\d{2,4}-\d{2,4}-\d{3,4}|お電話|電話予約|ホットペッパー|HotPepper|Hot Pepper"),
    ("未確定価格・実績", r"全国1%|受賞|No\.?1|ナンバーワン|第1位|導入実績\d+"),
    ("上から目線・高級演出", r"(であるべき|すべきです)|セレブ|ラグジュアリー|至高|極上"),
]
# 確定済み価格以外の金額（¥・円）は人が確認する対象として警告（違反ではなく要確認）
PRICE = re.compile(r"[¥￥]\s?[\d,]+|[\d,]{3,}\s?円")
CONFIRMED = ("9,900", "12,870", "17,600", "9900", "12870", "17600")


def check(text):
    bad = []
    for label, pat in RULES:
        for m in re.finditer(pat, text):
            s = max(0, m.start() - 12)
            bad.append(f"[{label}] 「{m.group(0)}」…{text[s:m.end() + 12]!r}")
    warn = []
    for m in PRICE.finditer(text):
        if not any(c in m.group(0) for c in CONFIRMED):
            warn.append(f"[要確認・価格] 未確定の可能性: {m.group(0)}")
    return bad, warn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?")
    ap.add_argument("--text")
    a = ap.parse_args()
    text = a.text if a.text is not None else Path(a.path).read_text(encoding="utf-8")
    bad, warn = check(text)
    for w in warn:
        print(w)
    for b in bad:
        print(b)
    if bad:
        print(f"NG: 禁止表現 {len(bad)}件")
        sys.exit(1)
    print("OK" + (f"（要確認 {len(warn)}件）" if warn else ""))


if __name__ == "__main__":
    main()
