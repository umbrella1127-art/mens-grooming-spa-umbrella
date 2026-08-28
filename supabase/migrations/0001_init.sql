-- MEN'S GROOMING SPA umbrella — 初期スキーマ
-- Supabase SQL Editor でそのまま実行できます。

-- ========== 共通: updated_at 自動更新 ==========
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ========== 1. site_settings（キー値ストア） ==========
-- 管理画面は group_name ごとにフォームを自動生成する。
-- 文字列値は {"text": "..."} 形式で保存する。
create table site_settings (
  key         text primary key,
  value       jsonb not null,
  label       text not null,
  group_name  text not null,           -- 'fv' | 'cta' | 'line' | 'hours' | 'shop' | 'gift'
  input_type  text not null default 'text',  -- 'text' | 'textarea' | 'url'
  sort_order  int  not null default 0,
  updated_at  timestamptz not null default now()
);
create trigger trg_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- ========== 2. menus ==========
create table menus (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  category       text not null,
  -- 'first_grooming'|'head_spa'|'facial'|'shaving'|'hair_growth'
  -- |'inner_beauty'|'slimming'|'mimitsubo'|'gift'|'membership'|'option'
  description    text,
  duration_min   int,
  price_yen      int,                  -- 未確定なら NULL（仮価格は入れない）
  price_status   text not null default 'tbd'
                 check (price_status in ('fixed','tbd','hidden')),
  price_note     text,
  is_published   boolean not null default false,
  is_recommended boolean not null default false,
  sort_order     int not null default 0,
  page_slug      text,                 -- 掲載先ページ（例 'head-spa'）
  image_url      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_menus_updated before update on menus
  for each row execute function set_updated_at();

-- ========== 3. faqs ==========
create table faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  category     text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);
create trigger trg_faqs_updated before update on faqs
  for each row execute function set_updated_at();

-- ========== 4. posts（ブログ） ==========
create table posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  excerpt          text,
  body_markdown    text not null default '',
  cover_image_url  text,
  status           text not null default 'draft' check (status in ('draft','published')),
  published_at     timestamptz,
  meta_title       text,
  meta_description text,
  source           text not null default 'manual' check (source in ('manual','ai')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_posts_pub on posts (status, published_at desc);
create trigger trg_posts_updated before update on posts
  for each row execute function set_updated_at();

-- ========== 5. images（スロット式メディア管理） ==========
-- url はローカル(/images/…)または Supabase Storage の公開URL。
create table images (
  id          uuid primary key default gen_random_uuid(),
  slot_key    text unique not null,
  url         text not null,
  alt         text not null default '',
  label       text not null,
  width       int,
  height      int,
  updated_at  timestamptz not null default now()
);
create trigger trg_images_updated before update on images
  for each row execute function set_updated_at();

-- ========== 6. 将来用: experiments / change_log / ab_variants ==========
create table experiments (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,        -- 'EXP-2026-001'
  name           text not null,
  hypothesis     text,
  target_page    text,
  target_element text,
  kpi            text not null default 'line_click',
  started_at     timestamptz,
  ended_at       timestamptz,
  result_summary text,
  decision       text not null default 'pending'
                 check (decision in ('pending','adopted','rolled_back')),
  created_at     timestamptz not null default now()
);

create table change_log (
  id            uuid primary key default gen_random_uuid(),
  table_name    text not null,
  record_key    text not null,
  before_value  jsonb,
  after_value   jsonb,
  experiment_id uuid references experiments(id),
  changed_by    text,
  changed_at    timestamptz not null default now()
);

-- site_settings の変更を自動記録（ロールバック用）
create or replace function log_settings_change() returns trigger as $$
begin
  insert into change_log (table_name, record_key, before_value, after_value, changed_by)
  values ('site_settings', old.key, old.value, new.value, coalesce(auth.uid()::text, 'system'));
  return new;
end;
$$ language plpgsql security definer;
create trigger trg_settings_log after update on site_settings
  for each row when (old.value is distinct from new.value)
  execute function log_settings_change();

create table ab_variants (
  id            uuid primary key default gen_random_uuid(),
  slot_key      text not null,               -- site_settings.key に対応
  variant_label text not null,               -- 'A' | 'B'
  content       jsonb not null,
  is_active     boolean not null default false,
  experiment_id uuid references experiments(id),
  created_at    timestamptz not null default now(),
  unique (slot_key, variant_label)
);

-- ========== RLS ==========
alter table site_settings enable row level security;
alter table menus         enable row level security;
alter table faqs          enable row level security;
alter table posts         enable row level security;
alter table images        enable row level security;
alter table experiments   enable row level security;
alter table change_log    enable row level security;
alter table ab_variants   enable row level security;

-- 公開読み取り（anon）
create policy "public read settings" on site_settings for select using (true);
create policy "public read menus"    on menus  for select using (is_published);
create policy "public read faqs"     on faqs   for select using (is_published);
create policy "public read posts"    on posts  for select using (status = 'published');
create policy "public read images"   on images for select using (true);

-- 管理者（authenticated = オーナー。サインアップは無効化しユーザーはDashboardで手動作成）
create policy "admin all settings"    on site_settings for all to authenticated using (true) with check (true);
create policy "admin all menus"       on menus         for all to authenticated using (true) with check (true);
create policy "admin all faqs"        on faqs          for all to authenticated using (true) with check (true);
create policy "admin all posts"       on posts         for all to authenticated using (true) with check (true);
create policy "admin all images"      on images        for all to authenticated using (true) with check (true);
create policy "admin all experiments" on experiments   for all to authenticated using (true) with check (true);
create policy "admin all change_log"  on change_log    for all to authenticated using (true) with check (true);
create policy "admin all ab_variants" on ab_variants   for all to authenticated using (true) with check (true);

-- ========== Storage ==========
-- バケットは Dashboard で作成してもよいが、SQLでも作成可能:
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "public read site-images" on storage.objects
  for select using (bucket_id = 'site-images');
create policy "admin write site-images" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-images');
create policy "admin update site-images" on storage.objects
  for update to authenticated using (bucket_id = 'site-images');
create policy "admin delete site-images" on storage.objects
  for delete to authenticated using (bucket_id = 'site-images');
