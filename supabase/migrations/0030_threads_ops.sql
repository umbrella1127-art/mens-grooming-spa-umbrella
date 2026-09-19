-- Threads→ブログ基盤の「自己改善」部品
-- 2026-09-19
--  1. 名簿に性格（personality）を追加。Threads側の担当も同じ agent_roster に載せる
--  2. 管理画面 /admin/kpi/threads が読めるよう、threads_* に select ポリシー
--  3. pipeline_issues: 自分自身を直すループ（ログ→異常発見→安全に修正）の記録
--  4. knowledge に source 列（手入力 / threads の自動整理 を区別）

alter table agent_roster add column if not exists personality text;

create policy "threads_topics_select_authenticated"
  on threads_topics for select to authenticated using (true);
create policy "threads_trials_select_authenticated"
  on threads_trials for select to authenticated using (true);

-- 異常の台帳。書くのは threads-caretaker（直接接続）。管理画面からは閲覧と「無視」の更新のみ
create table if not exists pipeline_issues (
  id           bigint generated always as identity primary key,
  channel      text not null default 'threads',
  detected_at  timestamptz not null default now(),
  kind         text not null,          -- post_failed / no_draft / no_winner_streak / stock_low / run_error /
                                       -- draft_stale / rule_violation / token_expiring / other
  severity     text not null check (severity in ('info', 'warning', 'critical')),
  title        text not null,
  detail       text,
  evidence     jsonb,
  action_taken text,                   -- 自動で直したこと（直していなければ null）
  status       text not null default 'open' check (status in ('open', 'fixed', 'ignored')),
  resolved_at  timestamptz,
  resolve_note text
);
create index if not exists pipeline_issues_open_idx on pipeline_issues (channel, status, detected_at desc);
alter table pipeline_issues enable row level security;
create policy "pipeline_issues_select_authenticated"
  on pipeline_issues for select to authenticated using (true);
create policy "pipeline_issues_update_authenticated"
  on pipeline_issues for update to authenticated using (true) with check (true);

alter table knowledge add column if not exists source text not null default 'manual';
create index if not exists knowledge_source_idx on knowledge (source, updated_at desc);
