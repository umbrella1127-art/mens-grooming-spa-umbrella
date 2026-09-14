# -*- coding: utf-8 -*-
"""DBに任意のSQLを投げる。サブエージェントの共通インターフェース。

    python scripts/hpb/query.py "SELECT month, customers_new FROM hpb_monthly_kpi WHERE store='<store>'"
    python scripts/hpb/query.py "SELECT ..." --format json
    python scripts/hpb/query.py "UPDATE ... " --write      # 更新系は --write が必須
    python scripts/hpb/query.py --tables                    # KPI関連テーブルの一覧とスキーマ

更新系は集客KPI基盤のテーブルにしか許可しない（サイトCMSのテーブルは書き換えない）。
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hpb_db import KPI_TABLES, connect, table_columns  # noqa: E402

WRITE_WORDS = ("insert", "update", "delete", "drop", "alter", "create", "replace", "truncate")
FORBIDDEN_WRITE = ("drop", "alter", "create", "truncate")


def print_table(rows):
    if not rows:
        print("(0件)")
        return
    cols = list(rows[0].keys())
    data = [[("" if r[c] is None else str(r[c])) for c in cols] for r in rows]
    w = [max(len(c), *(len(d[i]) for d in data)) for i, c in enumerate(cols)]
    w = [min(x, 52) for x in w]

    def fmt(vals):
        return " | ".join(v[:w[i]].ljust(w[i]) for i, v in enumerate(vals))

    print(fmt(cols))
    print("-+-".join("-" * x for x in w))
    for d in data:
        print(fmt(d))
    print(f"({len(rows)}件)")


def write_targets(sql):
    """更新系SQLが触るテーブル名を拾う。"""
    return {m.lower() for m in re.findall(
        r"(?:insert\s+into|update|delete\s+from)\s+\"?([a-zA-Z_][a-zA-Z0-9_]*)\"?", sql, re.I)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sql", nargs="?")
    ap.add_argument("--format", choices=["table", "json", "csv"], default="table")
    ap.add_argument("--write", action="store_true", help="更新系SQLを許可する")
    ap.add_argument("--tables", action="store_true", help="テーブル一覧とスキーマを表示")
    args = ap.parse_args()

    con = connect()

    if args.tables:
        for t in KPI_TABLES:
            n = con.execute(f'SELECT COUNT(*) c FROM "{t}"').fetchone()["c"]
            cols = table_columns(con, t)
            print(f"■ {t} ({n}件)\n   {', '.join(cols)}\n")
        return

    if not args.sql:
        ap.error("SQL を指定するか --tables を使ってください")

    first = args.sql.strip().split()[0].lower()
    is_write = first in WRITE_WORDS
    if is_write and not args.write:
        sys.exit("更新系のSQLには --write を付けてください（誤操作防止）")
    if is_write:
        if first in FORBIDDEN_WRITE:
            sys.exit("スキーマ変更（DROP/ALTER/CREATE/TRUNCATE）はこの入口からは行えません。"
                     "supabase/migrations にSQLを追加してください。")
        bad = write_targets(args.sql) - set(KPI_TABLES)
        if bad:
            sys.exit(f"集客KPI基盤以外のテーブルは書き換えられません: {', '.join(sorted(bad))}")

    try:
        cur = con.execute(args.sql)
    except Exception as e:
        con.rollback()
        sys.exit(f"SQLエラー: {e}")

    if is_write:
        con.commit()
        print(f"OK: {cur.rowcount}行に影響しました")
        return

    rows = cur.fetchall()
    if args.format == "json":
        print(json.dumps([dict(r) for r in rows], ensure_ascii=False, indent=2, default=str))
    elif args.format == "csv":
        if rows:
            print(",".join(rows[0].keys()))
            for r in rows:
                print(",".join("" if v is None else str(v).replace(",", "、")
                               for v in r.values()))
    else:
        print_table(rows)


if __name__ == "__main__":
    main()
