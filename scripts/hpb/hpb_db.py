# -*- coding: utf-8 -*-
"""集客KPI基盤の共有データベース（Supabase Postgres）への接続と共通ヘルパー。

すべてのサブエージェントはこのDBを介して状態を共有する。
実行前に必ず `python scripts/hpb/context.py` で現状を確認してから作業すること。

    from hpb_db import connect
    con = connect()
    rows = con.execute("SELECT * FROM stores WHERE active").fetchall()

接続先は .env.local の HPB_DATABASE_URL（Supabase の Session pooler URI）。
"""
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

# Windowsの既定コンソールは cp932 なので、¥ や ─ を含む出力で
# UnicodeEncodeError を起こして全スクリプトが落ちる。ここで一度だけUTF-8に固定する。
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "hpb"
CONFIG_PATH = SCRIPT_DIR / "config.json"
ENV_PATH = PROJECT_ROOT / ".env.local"

JST = timezone(timedelta(hours=9))

# HPB固有の実績テーブル（集計担当・db_put が upsert する）
HPB_TABLES = (
    "hpb_monthly_kpi", "hpb_blog_effects", "hpb_feature_stats",
    "hpb_feature_coupon_clicks", "hpb_coupon_stats", "hpb_style_stats",
    "hpb_stylist_stats", "hpb_competitor_stats", "hpb_ribbon_metrics",
    "hpb_kpi_snapshots",
)
# 分析側の共通テーブル
ANALYSIS_TABLES = (
    "stores", "channel_metrics", "analysis_runs", "agent_roster", "agent_tasks",
    "analysis_methods", "findings", "strategies", "strategy_options",
    "page_observations", "analysis_reports", "notifications",
)
KPI_TABLES = HPB_TABLES + ANALYSIS_TABLES


def now_iso():
    return datetime.now(JST).isoformat(timespec="seconds")


def load_env():
    """リポジトリ直下の .env.local を読み、未設定の環境変数だけ補う。"""
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        os.environ.setdefault(k, v)


def env(name, default=None):
    load_env()
    return os.environ.get(name, default)


def database_url():
    url = env("HPB_DATABASE_URL") or env("DATABASE_URL")
    if not url:
        sys.exit(
            "HPB_DATABASE_URL が未設定です。.env.local に Supabase の接続文字列を追加してください。\n"
            "  Supabase ダッシュボード → Connect → Session pooler の URI（postgresql://postgres.xxx:...@...:5432/postgres）")
    return url


def connect():
    con = psycopg.connect(database_url(), row_factory=dict_row)
    return con


def load_config():
    if not CONFIG_PATH.exists():
        return {}
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


# ---------- テーブル定義の参照（information_schema） ----------

_COLUMNS_CACHE = {}


def table_columns(con, table):
    """{列名: データ型} を返す（キャッシュあり）。"""
    if table not in _COLUMNS_CACHE:
        rows = con.execute(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=%s", (table,)).fetchall()
        if not rows:
            sys.exit(f"テーブル {table} が存在しません。supabase/migrations/0027_kpi_analysis.sql "
                     f"を Supabase の SQL Editor で実行してください。")
        _COLUMNS_CACHE[table] = {r["column_name"]: r["data_type"] for r in rows}
    return _COLUMNS_CACHE[table]


def coerce(value, data_type):
    """SQLite時代の 1/0 やJSON文字列を Postgres の型に合わせる。"""
    if value is None:
        return None
    if data_type == "boolean":
        if isinstance(value, str):
            return value.strip().lower() in ("1", "true", "t", "yes", "y")
        return bool(value)
    if data_type == "jsonb":
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except ValueError:
                pass
        return Json(value)
    if data_type == "integer" and isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def upsert(con, table, keys: dict, values: dict):
    """keys で一意に決まる行を挿入または更新する。None の値は「変更なし」扱い。"""
    values = {k: v for k, v in values.items() if v is not None}
    row = dict(keys)
    row.update(values)
    cols = table_columns(con, table)
    row = {k: coerce(v, cols[k]) for k, v in row.items() if k in cols}
    if "updated_at" in cols:
        row["updated_at"] = now_iso()
    names = ", ".join(f'"{c}"' for c in row)
    ph = ", ".join("%s" for _ in row)
    conflict = ", ".join(f'"{c}"' for c in keys)
    updates = ", ".join(f'"{c}"=EXCLUDED."{c}"' for c in row if c not in keys)
    if not updates:
        updates = f'"{next(iter(keys))}"=EXCLUDED."{next(iter(keys))}"'
    sql = (f'INSERT INTO "{table}" ({names}) VALUES ({ph}) '
           f"ON CONFLICT ({conflict}) DO UPDATE SET {updates}")
    con.execute(sql, list(row.values()))


def insert_returning_id(con, table, row: dict):
    cols = table_columns(con, table)
    row = {k: coerce(v, cols[k]) for k, v in row.items() if k in cols}
    names = ", ".join(f'"{c}"' for c in row)
    ph = ", ".join("%s" for _ in row)
    cur = con.execute(f'INSERT INTO "{table}" ({names}) VALUES ({ph}) RETURNING id',
                      list(row.values()))
    return cur.fetchone()["id"]


# ---------- 実行記録 ----------

def start_run(con, store, month, kind="monthly", channel="hpb"):
    rid = insert_returning_id(con, "analysis_runs", {
        "store": store, "channel": channel, "month": month, "kind": kind,
        "status": "running", "started_at": now_iso()})
    con.commit()
    return rid


def finish_run(con, run_id, status="completed", report_id=None, summary=None, note=None):
    con.execute(
        "UPDATE analysis_runs SET status=%s, finished_at=%s, "
        "report_id=COALESCE(%s, report_id), summary=COALESCE(%s, summary), "
        "note=COALESCE(%s, note) WHERE id=%s",
        (status, now_iso(), report_id, summary, note, run_id))
    con.commit()


def task_start(con, run_id, agent, role, input_note=None):
    tid = insert_returning_id(con, "agent_tasks", {
        "run_id": run_id, "agent": agent, "role": role, "status": "running",
        "input_note": input_note, "started_at": now_iso()})
    con.commit()
    return tid


def task_finish(con, task_id, status="completed", output_note=None, error=None):
    con.execute(
        "UPDATE agent_tasks SET status=%s, output_note=%s, error=%s, finished_at=%s WHERE id=%s",
        (status, output_note, error, now_iso(), task_id))
    con.commit()


# ---------- 分析の成果物 ----------

def add_finding(con, store, month, agent, category, severity, title, detail,
                evidence=None, method_code=None, confidence="medium", run_id=None,
                channel="hpb"):
    fid = insert_returning_id(con, "findings", {
        "run_id": run_id, "store": store, "channel": channel, "month": month,
        "method_code": method_code, "agent": agent, "category": category,
        "severity": severity, "title": title, "detail": detail,
        "evidence": evidence, "confidence": confidence, "created_at": now_iso()})
    con.commit()
    return fid


def register_method(con, code, name, category, description, procedure,
                    owner_agent, backfill_needed=True, run_id=None, channel="hpb"):
    con.execute(
        "INSERT INTO analysis_methods (code, channel, name, category, description, procedure, "
        "owner_agent, introduced_at, introduced_by, backfill_needed) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (code) DO UPDATE SET "
        "name=EXCLUDED.name, description=EXCLUDED.description, procedure=EXCLUDED.procedure",
        (code, channel, name, category, description, procedure, owner_agent, now_iso(),
         str(run_id) if run_id else None, bool(backfill_needed)))
    con.commit()


def months_of(con, store):
    return [r["month"] for r in con.execute(
        "SELECT month FROM hpb_monthly_kpi WHERE store=%s ORDER BY month", (store,))]


def active_stores(con):
    return [dict(r) for r in con.execute(
        "SELECT * FROM stores WHERE active ORDER BY code")]


# 集計期間の種別。分析時にこれを取り違えると因果を読み違える。
PERIOD_CALENDAR = "calendar"   # 暦月: 1日〜月末（リボンPDF、Salon Reportの予約データ）
PERIOD_ISSUE = "issue"         # 月号: 最終木曜締め（Salon ReportのPV・CVR・ACR）

KPI_PERIOD_MAP = {
    PERIOD_CALENDAR: [
        "net_reservations", "tel_visits", "unit_price_yen", "sales_man_yen",
        "customers_new", "customers_repeat", "reservations_new", "reservations_repeat",
        "sales_new_man_yen", "sales_repeat_man_yen", "unit_price_new_yen",
        "unit_price_repeat_yen", "shimei_with", "shimei_without",
        "coupon_with", "coupon_without", "coupon_message",
        "female_rate", "male_rate", "age_u20", "age_20s", "age_30s", "age_40s",
        "age_50plus", "device_pc", "device_mb", "device_sp", "new_repeat_rate",
    ],
    PERIOD_ISSUE: [
        "pv_total", "pv_salon", "pv_kodawari", "pv_style_detail", "pv_coupon_menu",
        "pv_coupon_print", "pv_reserve_done", "cvr", "acr",
        "blog_posts", "blog_views", "blog_coupon_posts", "blog_coupon_clicks",
        "review_posts", "review_views", "style_count",
        "tel_screen_pv", "tel_calls", "mypage_users",
    ],
}


if __name__ == "__main__":
    con = connect()
    missing = []
    for t in KPI_TABLES:
        n = con.execute(
            "SELECT COUNT(*) c FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=%s", (t,)).fetchone()["c"]
        if not n:
            missing.append(t)
    if missing:
        print(f"未作成のテーブル: {', '.join(missing)}")
        print("supabase/migrations/0027_kpi_analysis.sql を Supabase の SQL Editor で実行してください。")
        sys.exit(1)
    print(f"接続OK: {len(KPI_TABLES)} テーブルすべて存在します。")
