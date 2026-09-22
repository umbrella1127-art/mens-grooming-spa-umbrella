-- 稼働タイムライン（/admin/activity）。スライドS16「今どのAIが何をしているか、一目で見る」。
-- agent_runs（業務日報）に「実行中」を持たせ、開始と終了の時刻を残す。
--   開始: run-job.ps1 / run-daily.ps1 の最初に run_log.py --start が status='running' で1行作る
--   終了: 同じ行を ok / partial / error に更新する（開始の記録が無ければ従来どおり1行追加）

alter table agent_runs drop constraint if exists agent_runs_status_check;
alter table agent_runs add constraint agent_runs_status_check
  check (status in ('running', 'ok', 'partial', 'error'));
alter table agent_runs add column if not exists started_at timestamptz;
alter table agent_runs add column if not exists finished_at timestamptz;

-- これまでの行は「終わった時刻」だけを持っている
update agent_runs set finished_at = ran_at where finished_at is null and status <> 'running';

create index if not exists agent_runs_routine_idx on agent_runs (routine, ran_at desc);
