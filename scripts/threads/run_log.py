# -*- coding: utf-8 -*-
"""定期実行1回ごとの記録を agent_runs（業務日報）に残す。run-job.ps1 / run-daily.ps1 の最初と最後で呼ばれる。

    python scripts/threads/run_log.py --job research --start                  # 開始（status=running の行を作る）
    python scripts/threads/run_log.py --job research --exit 0 --log scripts/threads/logs/2026-09-19-research.log
    python scripts/threads/run_log.py --routine site:daily --start            # threads 以外は --routine で指定

routine は既定で 'threads:<job>'。終了時は、同じ routine の直近6時間以内の running 行を更新する
（開始の記録が無ければ1行追加）。管理画面 /admin/activity の「いま動いている」「今日の時間割」がこれを読む。
status は exit code と機械的な印だけで判定する
（エージェントの報告文に「エラー」「失敗」等の語が出ても反応しない。以前はそれで誤報が出ていた）:
  error   … exit != 0、または行頭に Python の Traceback
  それ以外 … 報告の最終行 `RESULT: ok|partial|error`（run-job.ps1 がエージェントに指示）に従う。
            無ければ ok
summary はログの最終行付近（エージェントの報告の冒頭）、detail はログ末尾40行。
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "hpb"))
from hpb_db import connect  # noqa: E402
from threads_notify import send as notify  # noqa: E402

NOISE = re.compile(r"^(===|exit=|\[exited|Ignoring \d+ permissions|`?RESULT:|agent_runs に)")
RESULT = re.compile(r"^[`*\s]*RESULT:\s*(ok|partial|error)\b", flags=re.M | re.I)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--job")
    ap.add_argument("--routine", help="既定は threads:<job>")
    ap.add_argument("--start", action="store_true")
    ap.add_argument("--exit", type=int)
    ap.add_argument("--log")
    a = ap.parse_args()
    if not (a.routine or a.job):
        ap.error("--job か --routine を指定してください")
    routine = a.routine or f"threads:{a.job}"
    con = connect()

    if a.start:
        con.execute("INSERT INTO agent_runs (routine, status, summary, started_at, ran_at) "
                    "VALUES (%s, 'running', '実行中', now(), now())", (routine,))
        con.commit()
        print(f"agent_runs に開始を記録: {routine}")
        return

    if a.exit is None or not a.log:
        ap.error("終了の記録には --exit と --log が必要です")
    text = Path(a.log).read_text(encoding="utf-8", errors="replace") if Path(a.log).exists() else ""
    # 同じ日のログは追記されるので、最後の "=== ... ===" 見出し以降だけを見る
    parts = re.split(r"^=== .* ===$", text, flags=re.M)
    body = parts[-1] if parts else text
    lines = [ln.rstrip() for ln in body.splitlines() if ln.strip() and not NOISE.match(ln.strip())]

    results = RESULT.findall(body)
    if a.exit != 0 or re.search(r"^Traceback \(most recent call last\)", body, flags=re.M):
        status = "error"
    elif results:
        status = results[-1].lower()
    else:
        status = "ok"
    summary = (lines[0] if lines else f"{routine}: 出力なし")[:200]
    detail = "\n".join(lines[-40:])[:4000]

    cur = con.execute(
        "UPDATE agent_runs SET status=%s, summary=%s, detail=%s, finished_at=now(), ran_at=now() "
        "WHERE id = (SELECT id FROM agent_runs WHERE routine=%s AND status='running' "
        "AND started_at > now() - interval '6 hours' ORDER BY started_at DESC LIMIT 1)",
        (status, summary, detail, routine))
    if cur.rowcount == 0:
        con.execute("INSERT INTO agent_runs (routine, status, summary, detail, finished_at) "
                    "VALUES (%s,%s,%s,%s,now())", (routine, status, summary, detail))
    con.commit()
    print(f"agent_runs に記録: {routine} status={status}")
    if status == "error":
        label = "Threads定期実行" if routine.startswith("threads:") else "定期実行"
        notify(f"⚠️ {label}が失敗しました（{routine}）" + chr(10) + summary, "care")


if __name__ == "__main__":
    main()
