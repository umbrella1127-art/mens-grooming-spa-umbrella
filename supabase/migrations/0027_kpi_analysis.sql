-- 集客KPI基盤（HPB / GBP / SEO / GA4 を横断する分析データ）
-- 2026-09-13
--
-- salon_syuukyaku（Python+SQLite）のデータモデルを Postgres へ移植したもの。
-- HPB固有の実績は hpb_* に、所見・戦略・実ページ観察・分析手法・実行記録は
-- channel 列付きの共通テーブルに置き、GBP/SEO でも同じ仕組みで回せるようにする。
--
-- 書き込みは主にローカルPCの Python スクリプト（直接DB接続＝RLS対象外）が行う。
-- 管理画面（authenticated）は閲覧と一部の状態更新のみ。

-- ============ 店舗マスタ ============
create table if not exists stores (
  code text primary key,
  name text not null,
  genre text,
  hpb_cd text,
  area text,
  sub_area text,
  seats integer,
  plan_cost_yen jsonb not null default '{}'::jsonb,   -- {"ライト": 38500, ...}
  plan_cost_note text,
  variable_cost_rate double precision not null default 0.1,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ HPB 事実データ（集計担当が書く） ============
create table if not exists hpb_monthly_kpi (
  store text not null references stores(code),
  month text not null,                              -- 'YYYY-MM'（月号）
  plan text,
  plan_cost_yen integer,
  net_reservations integer, tel_visits integer,
  unit_price_yen integer, sales_man_yen double precision,
  customers_new integer, customers_repeat integer,
  reservations_new integer, reservations_repeat integer,
  sales_new_man_yen double precision, sales_repeat_man_yen double precision,
  unit_price_new_yen integer, unit_price_repeat_yen integer,
  shimei_with integer, shimei_without integer,
  coupon_with integer, coupon_without integer, coupon_message integer,
  pv_total integer, pv_total_avg integer,
  pv_salon integer, pv_salon_avg integer,
  pv_kodawari integer, pv_kodawari_avg integer,
  pv_style_detail integer, pv_style_detail_avg integer,
  pv_coupon_menu integer, pv_coupon_menu_avg integer,
  pv_coupon_print integer, pv_coupon_print_avg integer,
  pv_reserve_done integer, pv_reserve_done_avg integer,
  cvr double precision, cvr_avg double precision,
  acr double precision, acr_avg double precision,
  new_repeat_rate double precision,
  female_rate double precision, male_rate double precision,
  age_u20 double precision, age_20s double precision, age_30s double precision,
  age_40s double precision, age_50plus double precision,
  device_pc integer, device_mb integer, device_sp integer,
  blog_posts integer, blog_views integer, blog_views_avg integer,
  blog_coupon_posts integer, blog_coupon_clicks integer, blog_coupon_clicks_avg integer,
  review_posts integer, review_views integer, review_views_avg integer,
  style_count integer,
  tel_screen_pv integer, tel_calls integer, mypage_users integer,
  source text,                                      -- salon_report / ribbon / manual
  data_status text not null default 'full',         -- full / partial（締め前の途中集計）
  data_as_of text,
  updated_at timestamptz not null default now(),
  primary key (store, month)
);

create table if not exists hpb_blog_effects (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  blog_title text not null,
  coupon_name text,
  clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (store, month, blog_title, coupon_name)
);
create index if not exists hpb_blog_effects_month_idx on hpb_blog_effects (store, month);

create table if not exists hpb_feature_stats (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  genre text,
  feature_name text not null,
  participants integer,
  view_rate double precision,
  own_clicks integer,
  avg_clicks double precision,
  max_clicks integer,
  joined boolean,
  updated_at timestamptz not null default now(),
  unique (store, month, feature_name)
);
create index if not exists hpb_feature_stats_month_idx on hpb_feature_stats (store, month);

create table if not exists hpb_feature_coupon_clicks (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  feature_name text not null,
  coupon_name text not null,
  clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (store, month, feature_name, coupon_name)
);

create table if not exists hpb_coupon_stats (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  coupon_name text not null,
  label text,                                       -- 新規 / 全員 / 再来 / メッセージ
  price_yen integer,                                -- 定価（Salon Report記載）
  actual_price_yen integer,                         -- 実ページの新規お試し価格
  price_source text not null default 'salon_report_list',
  reservations integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (store, month, coupon_name)
);
create index if not exists hpb_coupon_stats_month_idx on hpb_coupon_stats (store, month);

create table if not exists hpb_style_stats (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  style_name text not null,
  listing_no integer,
  stylist text,
  views integer,
  bookmarks_total integer,
  bookmarks_new integer,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (store, month, style_name, listing_no)
);

create table if not exists hpb_stylist_stats (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  stylist text not null,
  reservations integer,
  views integer,
  bookmarks integer,
  shimei_available boolean,
  sales_man_yen double precision,
  unit_price_yen integer,
  updated_at timestamptz not null default now(),
  unique (store, month, stylist)
);

create table if not exists hpb_competitor_stats (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  salon_name text not null,
  is_self boolean not null default false,
  seats text,
  cut_price_yen integer,
  reviews integer, blogs integer, styles integer, coupons integer,
  nearest_station text,
  period_type text not null default 'calendar',
  updated_at timestamptz not null default now(),
  unique (store, month, salon_name)
);

create table if not exists hpb_ribbon_metrics (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  metric text not null,
  own_value double precision,
  comp_avg double precision,
  area_avg double precision,
  unit text,
  note text,
  period_type text not null default 'calendar',
  updated_at timestamptz not null default now(),
  unique (store, month, metric)
);

-- 月の途中の進捗スナップショット（確定値ではないので hpb_monthly_kpi に混ぜない）
create table if not exists hpb_kpi_snapshots (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  month text not null,
  as_of date not null,
  elapsed_days integer not null,
  month_days integer not null,
  source text not null,
  customers_new integer,
  net_reservations integer,
  sales_man_yen double precision,
  cvr double precision, acr double precision,
  pv_coupon_menu integer, pv_reserve_done integer,
  note text,
  created_at timestamptz not null default now(),
  unique (store, month, as_of)
);

-- ============ チャネル横断の月次指標（GA4 / GBP / SEO 用） ============
create table if not exists channel_metrics (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  channel text not null,                            -- ga4 / gbp / seo / line
  month text not null,
  metric text not null,                             -- line_click / sessions / gbp_calls ...
  value double precision,
  note text,
  source text,                                      -- api / manual / csv
  updated_at timestamptz not null default now(),
  unique (store, channel, month, metric)
);

-- ============ パイプライン実行と稼働記録 ============
create table if not exists analysis_runs (
  id bigint generated always as identity primary key,
  store text not null references stores(code),
  channel text not null default 'hpb',
  month text not null,
  kind text not null default 'monthly',             -- monthly / backfill / adhoc / midcheck
  status text not null default 'running',           -- running / completed / failed
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  report_id bigint,
  summary text,
  note text
);
create index if not exists analysis_runs_store_idx on analysis_runs (store, channel, started_at desc);

create table if not exists agent_roster (
  agent text primary key,
  display_name text not null,
  kana text,
  age integer,
  role_title text not null,
  team text not null,
  icon text,
  catchphrase text,
  color text,
  channel text not null default 'hpb',
  sort_order integer not null default 0
);

create table if not exists agent_tasks (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  agent text not null,
  role text not null,
  status text not null default 'pending',           -- pending / running / completed / failed / skipped
  input_note text,
  output_note text,
  error text,
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists agent_tasks_run_idx on agent_tasks (run_id);
create index if not exists agent_tasks_agent_idx on agent_tasks (agent, id desc);

-- ============ 分析の成果物 ============
create table if not exists analysis_methods (
  code text primary key,
  channel text not null default 'hpb',
  name text not null,
  category text not null,
  description text not null,
  procedure text not null,
  owner_agent text not null,
  introduced_at timestamptz not null default now(),
  introduced_by text,
  backfill_needed boolean not null default false,
  backfilled_through text,
  status text not null default 'active',
  retire_reason text
);

create table if not exists findings (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  store text not null references stores(code),
  channel text not null default 'hpb',
  month text not null,
  method_code text references analysis_methods(code),
  agent text not null,
  category text not null,
  severity text not null check (severity in ('critical','warning','info','good')),
  title text not null,
  detail text not null,
  evidence jsonb,
  confidence text,
  acked_at timestamptz,
  acked_note text,
  created_at timestamptz not null default now()
);
create index if not exists findings_month_idx on findings (store, channel, month);

create table if not exists strategies (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  store text not null references stores(code),
  channel text not null default 'hpb',
  month text not null,
  priority integer not null,
  title text not null,
  rationale text not null,
  steps text not null,
  expected_effect text,
  target_metric text,
  target_value double precision,
  baseline_value double precision,
  status text not null default 'proposed',          -- proposed / adopted / done / dropped
  outcome_month text,
  outcome_value double precision,
  outcome_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists strategies_month_idx on strategies (store, channel, month, status);

create table if not exists strategy_options (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  store text not null references stores(code),
  channel text not null default 'hpb',
  month text not null,
  theme text not null,
  lens text not null,                               -- price / creative / ops / page
  stance text not null,                             -- conservative / standard / aggressive
  agent text not null,
  title text not null,
  rationale text not null,
  steps text,
  expected_effect text,
  target_metric text,
  baseline_value double precision,
  target_value double precision,
  sim_price_yen integer,
  sim_new_customers double precision,
  sim_unit_price_yen integer,
  sim_sales_man_yen double precision,
  sim_cpa_yen double precision,
  sim_margin_man_yen double precision,
  assumptions text,
  risk text,
  score_impact integer, score_cost integer, score_risk integer, score_speed integer,
  score_total double precision,
  selected boolean not null default false,
  strategy_id bigint references strategies(id),
  decision_note text,
  created_at timestamptz not null default now()
);
create index if not exists strategy_options_month_idx on strategy_options (store, channel, month, theme);

create table if not exists page_observations (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  store text not null references stores(code),
  channel text not null default 'hpb',
  observed_at date not null,
  surface text not null,
  url text,
  "position" integer,
  label text,
  title text not null,
  body text,
  value_num double precision,
  value_unit text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists page_observations_idx on page_observations (store, channel, observed_at, surface);

-- 月次レポート本体。HTMLファイルではなく構造化して持ち、管理画面が描画する。
create table if not exists analysis_reports (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  store text not null references stores(code),
  channel text not null default 'hpb',
  month text not null,
  title text not null,
  headline text,                                    -- 3秒で分かる結論（ハナのひとこと）
  summary_md text,                                  -- 結論ブロック（Markdown）
  sections jsonb not null default '[]'::jsonb,      -- [{"heading": "...", "body_md": "..."}]
  kpi jsonb not null default '{}'::jsonb,           -- {"customers_new": 12, "cpa": 3208, ...}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store, channel, month)
);

create table if not exists notifications (
  id bigint generated always as identity primary key,
  run_id bigint references analysis_runs(id),
  store text not null references stores(code),
  channel text not null default 'hpb',
  month text not null,
  message text not null,
  url text,
  status text not null default 'pending',           -- pending / sent / failed
  sent_at timestamptz,
  discord_message_id text,
  last_error text,
  created_at timestamptz not null default now()
);

-- ROUND(double precision, int) は Postgres 標準に無い（numeric のみ）。
-- エージェントが書くアドホックSQLで cvr / sales_man_yen 等の実数列を丸められるよう補う。
create or replace function public.round(double precision, integer)
returns numeric language sql immutable strict
as $$ select round($1::numeric, $2) $$;

-- ============ RLS ============
do $$
declare
  t text;
begin
  foreach t in array array[
    'stores','hpb_monthly_kpi','hpb_blog_effects','hpb_feature_stats',
    'hpb_feature_coupon_clicks','hpb_coupon_stats','hpb_style_stats','hpb_stylist_stats',
    'hpb_competitor_stats','hpb_ribbon_metrics','hpb_kpi_snapshots','channel_metrics',
    'analysis_runs','agent_roster','agent_tasks','analysis_methods','findings',
    'strategies','strategy_options','page_observations','analysis_reports','notifications'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_select_authenticated', t);
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
      t || '_select_authenticated', t);
  end loop;
end $$;

-- 管理画面から更新するもの（所見の確認・戦略の状態・店舗設定・手入力の指標）
do $$
declare
  t text;
begin
  foreach t in array array['stores','findings','strategies','channel_metrics'] loop
    execute format('drop policy if exists %I on %I', t || '_update_authenticated', t);
    execute format(
      'create policy %I on %I for update to authenticated using (true) with check (true)',
      t || '_update_authenticated', t);
  end loop;
  execute 'drop policy if exists channel_metrics_insert_authenticated on channel_metrics';
  execute 'create policy channel_metrics_insert_authenticated on channel_metrics for insert to authenticated with check (true)';
  execute 'drop policy if exists stores_insert_authenticated on stores';
  execute 'create policy stores_insert_authenticated on stores for insert to authenticated with check (true)';
end $$;
