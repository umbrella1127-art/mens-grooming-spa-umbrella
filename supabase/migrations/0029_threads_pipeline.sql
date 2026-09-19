-- Threads検証 → 公式ブログ化パイプライン用テーブル
-- 2026-09-19
-- リサーチで拾った「種ネタ」を Threads で試し、反応が良かったものだけブログ記事にする。
-- ブログ記事そのものは既存の posts（status=draft, source=ai）に入れ、承認は content_drafts で受ける。
-- どちらもサイト（公開側）からは読まない。service_role / 直接接続（scripts/threads）専用。

-- 種ネタ在庫。priority=true が「Threadsで勝った = ブログ化してよい」の関所
create table if not exists threads_topics (
  id            bigint generated always as identity primary key,
  title         text not null,
  age_band      text check (age_band in ('30s', '40s', '50s', 'all')),  -- 想定する読者の年代
  pain_keyword  text not null,        -- 拾った悩みキーワード（検索されそうな言葉そのまま）
  angle         text,                 -- 切り口・フック案
  material_text text,                 -- 事実として使える材料（サロンの確認済み事実のみ）
  research_notes jsonb,               -- 出典URL・検索クエリ・拾った言い回し
  status        text not null default 'active'
                check (status in ('active', 'tested', 'drafted', 'published', 'closed')),
  priority      boolean not null default false,   -- Threadsの勝者 = true
  post_id       uuid references posts(id) on delete set null,   -- 記事化したらここに紐づく
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_threads_topics_status on threads_topics (status);
create index if not exists idx_threads_topics_priority on threads_topics (priority) where priority;
create trigger trg_threads_topics_updated before update on threads_topics
  for each row execute function set_updated_at();

-- Threads投稿の台帳（draft → posted → 実測 → 勝者選定）
create table if not exists threads_trials (
  id              bigint generated always as identity primary key,
  trial_date      date not null,
  slot            int not null check (slot between 1 and 5),   -- 1日の何本目か（通常1〜3）
  topic_id        bigint references threads_topics(id) on delete set null,
  post_text       text not null,
  hook            text,               -- 冒頭の型（問いかけ・共感・数字 など）
  status          text not null default 'draft'
                  check (status in ('draft', 'posted', 'failed', 'skipped')),
  threads_post_id text,
  posted_at       timestamptz,
  metrics         jsonb,              -- views/likes/replies/reposts/quotes/shares の生値
  reaction_score  numeric,            -- likes*1 + replies*2 + reposts*3 + quotes*3 + shares*3
  is_winner       boolean not null default false,
  measured_at     timestamptz,
  predicted_note  text,               -- 投稿前の予測と根拠（答え合わせ用）
  result_note     text,               -- 反応が良かった/悪かった理由
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (trial_date, slot)
);
create index if not exists idx_threads_trials_date on threads_trials (trial_date);
create trigger trg_threads_trials_updated before update on threads_trials
  for each row execute function set_updated_at();

alter table threads_topics enable row level security;
alter table threads_trials enable row level security;
-- policy は作らない（anon / authenticated からは読ませない）
