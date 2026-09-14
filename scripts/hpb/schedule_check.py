# -*- coding: utf-8 -*-
"""月次分析を回すべき日かどうかを判定する。

ホットペッパーの月号は「その月の最後の木曜日」で締まるため、
分析を回すのは**最終木曜の翌日（金曜）**。

    python scripts/hpb/schedule_check.py            # 今日が実行日か判定（実行日ならexit 0）
    python scripts/hpb/schedule_check.py --next     # 次の実行日を表示
    python scripts/hpb/schedule_check.py --date 2026-08-28
    python scripts/hpb/schedule_check.py --list 6   # 今後6回の実行日
"""
import argparse
import calendar
import sys
from datetime import date, timedelta

# Windowsの既定コンソール(cp932)で日本語出力が化けないようUTF-8に固定する
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


def last_thursday(year, month):
    """その月の最後の木曜日。"""
    last_day = calendar.monthrange(year, month)[1]
    d = date(year, month, last_day)
    # weekday(): 月=0 ... 木=3
    return d - timedelta(days=(d.weekday() - 3) % 7)


def is_run_day(d: date):
    """d が「最終木曜の翌日」なら、締まった月号の (year, month) を返す。"""
    if d.weekday() != 4:      # 金曜以外はありえない
        return None
    thu = d - timedelta(days=1)
    if last_thursday(thu.year, thu.month) == thu:
        return thu.year, thu.month
    return None


def next_run_days(start: date, n=1):
    out, d = [], start
    for _ in range(400 * n):
        info = is_run_day(d)
        if info:
            out.append((d, info))
            if len(out) >= n:
                break
        d += timedelta(days=1)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", help="判定する日付 YYYY-MM-DD（既定: 今日）")
    ap.add_argument("--next", action="store_true", help="次の実行日を表示")
    ap.add_argument("--list", type=int, metavar="N", help="今後N回の実行日を表示")
    args = ap.parse_args()

    today = date.fromisoformat(args.date) if args.date else date.today()

    if args.list:
        for d, (y, m) in next_run_days(today, args.list):
            print(f"{d.isoformat()}(金)  ← {y}年{m}月号が最終木曜 "
                  f"{last_thursday(y, m).isoformat()} で締め")
        return
    if args.next:
        d, (y, m) = next_run_days(today, 1)[0]
        print(f"次の実行日: {d.isoformat()}(金)  対象月号: {y}-{m:02d}  "
              f"(締め日 {last_thursday(y, m).isoformat()} 木)")
        return

    info = is_run_day(today)
    if info:
        y, m = info
        print(f"RUN {y}-{m:02d}")
        print(f"本日 {today.isoformat()} は {y}年{m}月号の締め（最終木曜 "
              f"{last_thursday(y, m).isoformat()}）の翌日です。月次分析を実行してください。")
        sys.exit(0)
    d, (y, m) = next_run_days(today, 1)[0]
    print("SKIP")
    print(f"本日 {today.isoformat()} は実行日ではありません。次回は {d.isoformat()}(金) "
          f"／対象 {y}-{m:02d}月号")
    sys.exit(1)


if __name__ == "__main__":
    main()
