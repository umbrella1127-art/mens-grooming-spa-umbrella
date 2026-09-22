-- サイト改善ループ: GA4の日次実績を貯め、サイトの変更を「実験」として前後比較する。
--   毎日: scripts/site/daily.py が GA4 → site_metrics_daily へ保存し、期限の来た実験を判定する
--   変更したら: /admin/ga4 の「サイト改善の実験」から登録する（何を・どのページで・何が増えるはずか）
-- 0001 で「将来用」として作った experiments を使い始める。測り方のない実験はDBが受け付けない。

-- ========== GA4 日次実績（ページ × 指標） ==========
create table if not exists site_metrics_daily (
  day        date not null,
  page       text not null,                 -- '/menu/facial' など。サイト全体は '(all)'
  metric     text not null,                 -- sessions / page_views / line_click / engagement_sec
  value      double precision not null default 0,
  source     text not null default 'ga4',
  updated_at timestamptz not null default now(),
  primary key (day, page, metric)
);
create index if not exists site_metrics_daily_page_idx on site_metrics_daily (page, metric, day);

alter table site_metrics_daily enable row level security;
drop policy if exists site_metrics_daily_select_authenticated on site_metrics_daily;
create policy site_metrics_daily_select_authenticated on site_metrics_daily
  for select to authenticated using (true);

-- ========== experiments に測定計画と判定結果を足す ==========
alter table experiments add column if not exists what_changed   text;
alter table experiments add column if not exists expected       text;
alter table experiments add column if not exists measure_days   integer not null default 14;
alter table experiments add column if not exists before_stats   jsonb;
alter table experiments add column if not exists after_stats    jsonb;
alter table experiments add column if not exists verdict        text;
alter table experiments add column if not exists measured_at    timestamptz;
alter table experiments add column if not exists source         text not null default 'admin';

-- 測定項目・時期・場所がない実験は登録させない（スライドS07「測り方のない仮説はDBが拒否」）
alter table experiments alter column hypothesis   set not null;
alter table experiments alter column target_page  set not null;
alter table experiments alter column started_at   set not null;
alter table experiments alter column what_changed set not null;
alter table experiments alter column expected     set not null;

alter table experiments drop constraint if exists experiments_plan_check;
alter table experiments add constraint experiments_plan_check check (
  length(btrim(hypothesis)) > 0
  and length(btrim(what_changed)) > 0
  and length(btrim(expected)) > 0
  and (target_page = '(all)' or target_page like '/%')
  and kpi in ('line_click', 'page_views', 'sessions', 'engagement_sec')
  and measure_days between 7 and 56
);

alter table experiments drop constraint if exists experiments_verdict_check;
alter table experiments add constraint experiments_verdict_check check (
  verdict is null or verdict in ('win', 'lose', 'flat', 'insufficient')
);

alter table experiments drop constraint if exists experiments_source_check;
alter table experiments add constraint experiments_source_check check (
  source in ('admin', 'ai')
);
