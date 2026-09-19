# -*- coding: utf-8 -*-
"""定期実行1回ごとの記録を agent_runs（業務日報）に残す。run-job.ps1 の最後で呼ばれる。

    python scripts/threads/run_log.py --job research --exit 0 --log scripts/threads/logs/2026-09-19-research.log

routine は 'threads:<job>'。status は exit code と本文から判定:
  error   … exit != 0、または本文に Traceback / ERROR / エラー
  partial … 本文に「失敗」「止まり」「未実行」
  ok      … それ以外
summary はログの最終行付近（エージェントの報告の冒頭）、detail はログ末尾40行。
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import connect  # noqa: E402

NOISE = re.compile(r"^(===|exit=|\[exited|Ignoring \d+ permissions)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--job", required=True)
    ap.add_argument("--exit", type=int, required=True)
    ap.add_argument("--log", required=True)
    a = ap.parse_args()

    text = Path(a.log).read_text(encoding="utf-8", errors="replace") if Path(a.log).exists() else ""
    # 同じ日のログは追記されるので、最後の "=== ... job=" 以降だけを見る
    parts = re.split(r"^=== .* job=\S+ ===$", text, flags=re.M)
    body = parts[-1] if parts else text
    lines = [ln.rstrip() for ln in body.splitlines() if ln.strip() and not NOISE.match(ln.strip())]

    if a.exit != 0 or re.search(r"Traceback|\bERROR\b|エラー", body):
        status = "error"
    elif re.search(r"失敗|止まり|未実行|できませんでした", body):
        status = "partial"
    else:
        status = "ok"
    summary = (lines[0] if lines else f"{a.job}: 出力なし")[:200]
    detail = "\n".join(lines[-40:])[:4000]

    con = connect()
    con.execute("INSERT INTO agent_runs (routine, status, summary, detail) VALUES (%s,%s,%s,%s)",
                (f"threads:{a.job}", status, summary, detail))
    con.commit()
    print(f"agent_runs に記録: threads:{a.job} status={status}")


if __name__ == "__main__":
    main()
