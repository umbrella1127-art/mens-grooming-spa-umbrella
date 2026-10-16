-- 井上さんの日々の出来事メモ → Threads種ネタの最優先ソース。承認付きで投稿する。
-- 2026-09-27
--   1. owner_notes: Discord「#今日の店（DISCORD_CHANNEL_OWNER_NOTES）」から取り込んだ生のメモ
--      （scripts/threads/owner_notes.py fetch が書く）。写真はSupabase Storage(site-images)に
--      再ホストしたURLをimage_urlsに持つ（Discordの添付URLは失効するため）
--   2. threads_topics.source: 種ネタの出所（research=Web検索 / owner=井上さんのメモ由来）
--   3. threads_trials: 井上さん由来の投稿は自動投稿の前に承認を要求する（pending_approval）。
--      写真つき投稿のための image_url も持つ
--   4. content_drafts.trial_id: 既存の承認基盤（Discordボタン／管理画面 /admin/approvals）を
--      threads_trials の承認にも使い回す（channel_type='threads' は元々予約されていたが未使用だった）

create table if not exists owner_notes (
  id                  bigint generated always as identity primary key,
  discord_message_id  text not null unique,
  raw_text            text not null,
  image_urls          jsonb,              -- 再ホスト後のSupabase Storage公開URL配列。無ければnull
  posted_at           timestamptz not null,
  status              text not null default 'new' check (status in ('new', 'used', 'skipped')),
  topic_id            bigint references threads_topics(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index if not exists owner_notes_status_idx on owner_notes (status, posted_at);

alter table owner_notes enable row level security;
drop policy if exists owner_notes_select_authenticated on owner_notes;
create policy owner_notes_select_authenticated on owner_notes
  for select to authenticated using (true);

alter table threads_topics add column if not exists source text not null default 'research'
  check (source in ('research', 'owner'));

alter table threads_trials drop constraint if exists threads_trials_status_check;
alter table threads_trials add constraint threads_trials_status_check
  check (status in ('draft', 'pending_approval', 'posted', 'failed', 'skipped'));
alter table threads_trials add column if not exists image_url text;

alter table content_drafts add column if not exists trial_id bigint references threads_trials(id) on delete cascade;
create index if not exists content_drafts_trial_idx on content_drafts (trial_id) where trial_id is not null;
