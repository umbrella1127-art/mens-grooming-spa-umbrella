# -*- coding: utf-8 -*-
"""自律改善の安全ゲート。変更（ファイルごとの 変更前 → 変更後）を auto / approval / forbidden に仕分ける。

  forbidden … 公開サイト・管理画面のコード、DB、秘密情報、絶対ルール、権限・スケジュール、この仕組み自身
  auto      … Threads の手順書の文言（小さな差分・ルールらしき行を消さない）と、judge.py のしきい値の数字だけ
  approval  … それ以外（担当の定義・プログラムの処理・HPBの手順・新しいファイルなど）

ここを変える変更は forbidden（ゲート自身を AI に書き換えさせない）。
"""
import fnmatch
import re

FORBIDDEN = [
    "app/*", "components/*", "lib/*", "public/*", "proxy.ts", "next.config*", "package.json", "package-lock.json",
    "tsconfig.json", "postcss.config*", "eslint.config*",
    "supabase/*",
    ".env*", "secrets/*", "data/*", "scripts/hpb/config.json",
    "AGENTS.md", "CLAUDE.md", ".gitignore",
    ".claude/settings*.json", ".claude/launch.json",
    ".claude/skills/threads-blog-rules/*",      # 絶対ルールと声のトーン
    "scripts/threads/check_article.py",         # 禁止表現チェック
    "scripts/threads/schedule/*",               # 定期実行と許可ツール
    "scripts/site/*",
    "scripts/improve/*",                        # この仕組み自身
    ".claude/agents/auto-improver.md", ".claude/skills/self-improve/*",
]
AUTO_DOCS = [
    ".claude/skills/threads-research/SKILL.md", ".claude/skills/threads-validate/SKILL.md",
    ".claude/skills/threads-blog-writing/SKILL.md", ".claude/skills/threads-care/SKILL.md",
    ".claude/skills/threads-library/SKILL.md", ".claude/skills/threads-run/SKILL.md",
    ".claude/skills/run-reflection/SKILL.md",
]
AUTO_CONSTANTS = {"scripts/threads/judge.py": {"MIN_N": (2, 10), "LEAD": (1.05, 5), "LOSE": (0.05, 0.95),
                                                "UP": (1.01, 3), "DOWN": (0.3, 0.99)}}
MAX_AUTO_LINES = 30
# 消すと安全が下がりうる行（手順書のルール・禁止事項）。これを含む行を消す変更は承認に回す
RULE_WORDS = ("禁止", "絶対", "必ず", "しない", "させない", "いけない", "守る", "だけ", "NG", "--live", "個室", "価格",
              "電話", "医療", "断定", "煽", "承認", "削除", "DELETE", "source='manual'")
CONST_LINE = re.compile(r"^([A-Z_]+)\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*(#.*)?$")


def _match(path, patterns):
    return any(fnmatch.fnmatch(path, p) for p in patterns)


def changed_lines(old, new):
    import difflib
    removed, added = [], []
    for ln in difflib.unified_diff(old.splitlines(), new.splitlines(), lineterm="", n=0):
        if ln.startswith(("---", "+++", "@@")):
            continue
        if ln.startswith("-"):
            removed.append(ln[1:])
        elif ln.startswith("+"):
            added.append(ln[1:])
    return removed, added


def classify_file(path, old, new):
    """1ファイル分の判定。(gate, 理由) を返す。old が None なら新規ファイル。"""
    if _match(path, FORBIDDEN):
        return "forbidden", f"{path} は自動改善で触ってはいけない場所"
    if not new.strip():
        return "forbidden", f"{path} を空にする（消す）変更"
    if old is None:
        return "approval", f"{path} は新しいファイル"

    removed, added = changed_lines(old, new)
    if not removed and not added:
        return "auto", f"{path} は変更なし"

    if path in AUTO_CONSTANTS:
        bounds = AUTO_CONSTANTS[path]
        rm = [CONST_LINE.match(x.strip()) for x in removed]
        ad = [CONST_LINE.match(x.strip()) for x in added]
        if all(rm) and all(ad) and {m.group(1) for m in rm} == {m.group(1) for m in ad}:
            for m in ad:
                lo, hi = bounds.get(m.group(1), (None, None))
                if lo is None:
                    return "approval", f"{path} の {m.group(1)} は自動で変えてよい数字ではない"
                if not lo <= float(m.group(2)) <= hi:
                    return "approval", f"{path} の {m.group(1)}={m.group(2)} は安全な範囲（{lo}〜{hi}）の外"
            return "auto", f"{path} はしきい値の数字だけの変更"
        return "approval", f"{path} は数字以外（処理）も変わる"

    if path in AUTO_DOCS:
        if len(removed) + len(added) > MAX_AUTO_LINES:
            return "approval", f"{path} の変更が大きい（{len(removed) + len(added)}行 > {MAX_AUTO_LINES}行）"
        risky = [x for x in removed if any(w in x for w in RULE_WORDS)]
        if risky:
            return "approval", f"{path} でルールらしき行を消している: {risky[0][:40]}"
        if any("--live" in x for x in added):
            return "approval", f"{path} に本番投稿（--live）の手順を足している"
        return "auto", f"{path} は手順書の小さな文言修正"

    return "approval", f"{path} は人の確認が必要な場所（担当の定義・プログラム・HPBの手順など）"


def classify(changes):
    """changes: [(path, old_or_None, new)]。全体の gate と理由の一覧を返す（一番厳しいものに合わせる）。"""
    order = {"auto": 0, "approval": 1, "forbidden": 2}
    gate, reasons = "auto", []
    for path, old, new in changes:
        g, why = classify_file(path, old, new)
        reasons.append(f"[{g}] {why}")
        if order[g] > order[gate]:
            gate = g
    return gate, reasons
