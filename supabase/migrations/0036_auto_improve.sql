-- 自律改善ループ（スライドS09「自分を直す。でも、安全に。」）。
--   考える人: 修繕担当（.claude/agents/auto-improver.md）が「仕組みの改善案」から直したいファイルの新しい中身を書く
--   触る人  : scripts/improve/improve.py が差分を出し、安全ゲートで仕分け、auto-improve/<id> ブランチにコミットして反映する
--   安全ゲート: auto（手順書の文言・しきい値の数字だけ）/ approval（人の承認が要る）/ forbidden（公開サイト・DB・絶対ルール）
--   効果確認: 変更ごとに「減るはずの問題」を決め、7日後に前後比較。良くなっていなければ自動で元に戻す（revert）

create table if not exists improvement_changes (
  id            bigint generated always as identity primary key,
  proposal_id   bigint references improvement_proposals(id) on delete set null,
  summary       text not null check (length(btrim(summary)) > 0),
  files         text[] not null,
  diff          text not null,
  base_blobs    jsonb not null,            -- {path: 変更前の blob sha}（反映・差し戻しのときの突き合わせ用）
  new_blobs     jsonb not null,            -- {path: 変更後の blob sha}
  gate          text not null check (gate in ('auto', 'approval', 'forbidden')),
  gate_reasons  text[] not null default '{}',
  -- drafted→（auto）applied ／（approval）awaiting_approval→approved→applied ／ forbidden・却下→rejected
  -- applied→kept（効果あり・悪化なし）／ reverted（効果なし→元に戻した）／ stale（元のファイルが変わっていて反映・差し戻しできない）
  status        text not null default 'drafted' check (status in (
                  'drafted', 'awaiting_approval', 'approved', 'applied', 'kept', 'reverted', 'rejected', 'stale', 'failed')),
  branch        text,
  commit_sha    text,
  revert_sha    text,
  -- 効果の測り方（すべて「少ないほど良い」）: run_error_rate / issue_count / rules_ng_rate
  watch_metric  text not null check (watch_metric in ('run_error_rate', 'issue_count', 'rules_ng_rate')),
  watch_target  text not null check (length(btrim(watch_target)) > 0),  -- routine / pipeline_issues.kind / agent
  baseline      jsonb,
  result        jsonb,
  applied_at    timestamptz,
  verify_after  date,
  verified_at   timestamptz,
  decided_by    text,
  note          text,
  created_by    text not null default 'auto-improver',
  created_at    timestamptz not null default now()
);
create index if not exists improvement_changes_status_idx on improvement_changes (status, verify_after);

alter table improvement_changes enable row level security;
drop policy if exists improvement_changes_select_authenticated on improvement_changes;
create policy improvement_changes_select_authenticated on improvement_changes
  for select to authenticated using (true);
-- 管理画面からは「承認」「却下」だけを付けられる（反映の作業はローカルPCの improve.py が行う）
drop policy if exists improvement_changes_update_authenticated on improvement_changes;
create policy improvement_changes_update_authenticated on improvement_changes
  for update to authenticated using (status = 'awaiting_approval')
  with check (status in ('approved', 'rejected', 'awaiting_approval'));
