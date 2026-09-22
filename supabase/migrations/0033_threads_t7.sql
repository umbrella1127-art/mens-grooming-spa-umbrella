-- Threads の答え合わせを T+1（翌朝）と T+7（1週間後）の2点で行う。
--   - 実測値は threads_trial_snapshots に「何日後の値か」付きで残す（threads_trials.metrics は最新値）
--   - 比べる相手は「その投稿より前の7日間に出した投稿の、同じ日数後の平均」（ベースライン）
--   - 投稿前に「どの指標が・平均より上か下か」を予測として必須にし、T+7 で当たり外れを自動判定する
-- 書き込みは scripts/threads/threads_api.py measure（毎朝 validate 工程で実行）。

create table if not exists threads_trial_snapshots (
  id             bigint generated always as identity primary key,
  trial_id       bigint not null references threads_trials(id) on delete cascade,
  days_after     integer not null check (days_after in (1, 7)),
  metrics        jsonb not null,
  views          numeric not null default 0,
  reaction_score numeric not null default 0,
  -- {"n":5,"views":78.2,"reaction_score":0,"from":"2026-09-12","to":"2026-09-18"}
  baseline       jsonb,
  -- win=反応（いいね等）が平均を上回った / lead=反応は無いが表示が平均の1.5倍以上 /
  -- flat=平均並み / lose=表示が平均の半分以下 / insufficient=比べる投稿が3本未満
  verdict        text check (verdict in ('win', 'lead', 'flat', 'lose', 'insufficient')),
  -- 投稿前の予測（predicted_metric × predicted_vs_baseline）との答え合わせ。予測が無い投稿は null
  prediction_hit text check (prediction_hit in ('hit', 'partial', 'miss')),
  note           text,                             -- 検証担当の所見（なぜそうなったか）
  measured_at    timestamptz not null default now(),
  unique (trial_id, days_after)
);
create index if not exists threads_trial_snapshots_days_idx on threads_trial_snapshots (days_after, measured_at desc);

alter table threads_trial_snapshots enable row level security;
drop policy if exists threads_trial_snapshots_select_authenticated on threads_trial_snapshots;
create policy threads_trial_snapshots_select_authenticated on threads_trial_snapshots
  for select to authenticated using (true);

-- 投稿前の予測を「測れる形」で持つ
alter table threads_trials add column if not exists predicted_metric text
  check (predicted_metric in ('views', 'reaction_score'));
alter table threads_trials add column if not exists predicted_vs_baseline text
  check (predicted_vs_baseline in ('above', 'same', 'below'));

-- 測り方のない下書きは登録させない（スライドS07「測定項目・時期・場所がない仮説はDBが拒否」）。
-- 既存の行は検査しない（NOT VALID）。これから作る下書きにだけ効く
alter table threads_trials drop constraint if exists threads_trials_prediction_required;
alter table threads_trials add constraint threads_trials_prediction_required check (
  status <> 'draft'
  or (predicted_note is not null and length(btrim(predicted_note)) > 0
      and predicted_metric is not null and predicted_vs_baseline is not null)
) not valid;

-- これまでの翌朝実測（threads_trials.metrics）を T+1 のスナップショットとして取り込む
insert into threads_trial_snapshots (trial_id, days_after, metrics, views, reaction_score, measured_at)
select id, 1, metrics, coalesce((metrics->>'views')::numeric, 0), coalesce(reaction_score, 0), measured_at
from threads_trials
where measured_at is not null and metrics is not null
on conflict (trial_id, days_after) do nothing;
