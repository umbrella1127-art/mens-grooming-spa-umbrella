-- 知識（knowledge）の3つのルール。スライドS10・S11「WIKIに載るのは再現した学びだけ」。
--   1. 3件たまるまで一般化しない … 型（kind=pattern）は candidate で始まり、支持する投稿が3件以上・
--      かつ反証より多くならないと adopted にできない（トリガーで強制）。根拠は knowledge_evidence に1投稿1行
--   2. 消さない               … 自動で書いた知識（source<>'manual'）は DELETE できない。
--      使わなくなったら status=retired にし、retired_reason（もう使わない理由）を必ず残す
--   3. 全員が最初に読む        … python scripts/threads/tdb.py --knowledge（各手順書の「0. 最初に読む」）
-- オーナーが手で書いた知識（source='manual'）には、これらの制約をかけない。

alter table knowledge add column if not exists kind text;            -- pattern（型）/ summary（週次まとめ）/ ops（運用の決めごと）
alter table knowledge add column if not exists status text;          -- candidate（保留）/ adopted（採用）/ retired（退役）
alter table knowledge add column if not exists retired_reason text;
alter table knowledge add column if not exists retired_at timestamptz;

update knowledge set
  kind = case when title like '週次まとめ%' then 'summary'
              when category = 'Threads運用の学び' then 'ops'
              else 'pattern' end,
  status = case when title like '週次まとめ%' or category = 'Threads運用の学び' then 'adopted'
                else 'candidate' end
where source <> 'manual' and kind is null;

alter table knowledge drop constraint if exists knowledge_auto_fields;
alter table knowledge add constraint knowledge_auto_fields check (
  source = 'manual'
  or (kind in ('pattern', 'summary', 'ops') and status in ('candidate', 'adopted', 'retired'))
);
alter table knowledge drop constraint if exists knowledge_retired_reason;
alter table knowledge add constraint knowledge_retired_reason check (
  status is distinct from 'retired' or length(btrim(coalesce(retired_reason, ''))) > 0
);

-- 根拠: どの投稿が、その型を支持したか／反証したか
create table if not exists knowledge_evidence (
  id           bigint generated always as identity primary key,
  knowledge_id uuid not null references knowledge(id) on delete restrict,
  trial_id     bigint not null references threads_trials(id) on delete restrict,
  outcome      text not null check (outcome in ('support', 'contradict')),
  days_after   integer not null default 7 check (days_after in (1, 7)),   -- どの時点の判定を根拠にしたか
  note         text not null check (length(btrim(note)) > 0),
  added_by     text not null,
  created_at   timestamptz not null default now(),
  unique (knowledge_id, trial_id)
);
create index if not exists knowledge_evidence_knowledge_idx on knowledge_evidence (knowledge_id);

alter table knowledge_evidence enable row level security;
drop policy if exists knowledge_evidence_select_authenticated on knowledge_evidence;
create policy knowledge_evidence_select_authenticated on knowledge_evidence
  for select to authenticated using (true);

create or replace function knowledge_guard() returns trigger as $$
declare
  n_support integer;
  n_contra  integer;
begin
  if tg_op = 'DELETE' then
    if old.source <> 'manual' then
      raise exception '自動で書いた知識は消せません。status=''retired'' と retired_reason（もう使わない理由）で退役させてください（%）', old.title;
    end if;
    return old;
  end if;

  if new.source <> 'manual' and new.kind = 'pattern' and new.status = 'adopted'
     and (tg_op = 'INSERT' or old.status is distinct from 'adopted') then
    select count(*) filter (where outcome = 'support'), count(*) filter (where outcome = 'contradict')
      into n_support, n_contra
      from knowledge_evidence where knowledge_id = new.id;
    if n_support < 3 or n_support <= n_contra then
      raise exception '根拠が足りないので採用できません（支持%件・反証%件）。3件たまるまで一般化しない', n_support, n_contra;
    end if;
  end if;

  if new.status = 'retired' and (tg_op = 'INSERT' or old.status is distinct from 'retired') then
    new.retired_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_knowledge_guard on knowledge;
create trigger trg_knowledge_guard before insert or update on knowledge
  for each row execute function knowledge_guard();
drop trigger if exists trg_knowledge_guard_delete on knowledge;
create trigger trg_knowledge_guard_delete before delete on knowledge
  for each row execute function knowledge_guard();
