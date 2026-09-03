-- 業務日報（スケジュール実行の記録）とナレッジ（気づきの蓄積）
-- 2026-09-03

-- スケジュール実行が1回動くごとに1行。書き込みはservice_role（自動実行）のみ。
create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  routine text not null,
  status text not null default 'ok' check (status in ('ok', 'partial', 'error')),
  summary text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_ran_at_idx on agent_runs (ran_at desc);

alter table agent_runs enable row level security;

create policy "agent_runs_select_authenticated"
  on agent_runs for select
  to authenticated
  using (true);

-- 気づき・お客様の声・試したことの蓄積。管理画面から編集する。
create table if not exists knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  category text not null default 'その他',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_updated_at_idx on knowledge (updated_at desc);

alter table knowledge enable row level security;

create policy "knowledge_select_authenticated"
  on knowledge for select
  to authenticated
  using (true);

create policy "knowledge_insert_authenticated"
  on knowledge for insert
  to authenticated
  with check (true);

create policy "knowledge_update_authenticated"
  on knowledge for update
  to authenticated
  using (true)
  with check (true);

create policy "knowledge_delete_authenticated"
  on knowledge for delete
  to authenticated
  using (true);
