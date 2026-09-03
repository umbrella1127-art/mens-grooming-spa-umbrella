-- Discord連携：コンテンツ下書き（Threads/ブログ/GBP投稿）の承認フロー用テーブル
-- 2026-09-03
create table if not exists content_drafts (
  id uuid primary key default gen_random_uuid(),
  channel_type text not null check (channel_type in ('threads', 'blog', 'gbp')),
  content_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'editing')),
  edit_note text,
  discord_channel_id text,
  discord_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLSを有効化し、anon/authenticated向けのポリシーは作らない
-- （このテーブルはservice_role経由のサーバー処理からのみアクセスする）
alter table content_drafts enable row level security;
