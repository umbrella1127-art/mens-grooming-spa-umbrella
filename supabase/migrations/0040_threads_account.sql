-- Threads アカウント全体のインサイト（投稿単位ではなくアカウント単位）を日別に残す。
-- 2026-10-16
--   書くのは scripts/threads/threads_api.py account-daily（毎朝 05:50、mensumbrella-threads-account）。
--   描画は /admin/kpi/threads の「アカウント全体」カード（lib/admin/threads-account.ts）。
--
-- 「1日」の区切り: Threads API の day は米国太平洋時間の0時で切れるため、日本時間では
--   前日16時（夏時間。冬時間は17時）〜当日16時 になる。day はその区間が終わる日（日本時間）。
--   まだ終わっていない区間は保存しない。反応は遅れて数え直されるので、毎回直近7日を取り直して上書きする。
-- follower_demographics（年齢・地域）はフォロワー100人未満だと API が返さないため、まだ持たない。

create table if not exists threads_account_daily (
  day              date primary key,
  views            integer,            -- その日にアカウントの投稿が表示された回数
  likes            integer,
  replies          integer,
  reposts          integer,
  quotes           integer,
  posts            integer,            -- その区間に公開した投稿数（API の投稿一覧から数える。手動投稿も含む）
  followers_count  integer,            -- 取得した時点の総数。API は現在値しか返さないので、過去日は null
  fetched_at       timestamptz not null default now()
);

create table if not exists threads_link_clicks_daily (
  day         date not null,
  link_url    text not null,           -- プロフィールや投稿に置いたリンク（URL別に API が返す）
  clicks      integer not null default 0,
  fetched_at  timestamptz not null default now(),
  primary key (day, link_url)
);

alter table threads_account_daily enable row level security;
drop policy if exists threads_account_daily_select_authenticated on threads_account_daily;
create policy threads_account_daily_select_authenticated on threads_account_daily
  for select to authenticated using (true);

alter table threads_link_clicks_daily enable row level security;
drop policy if exists threads_link_clicks_daily_select_authenticated on threads_link_clicks_daily;
create policy threads_link_clicks_daily_select_authenticated on threads_link_clicks_daily
  for select to authenticated using (true);
