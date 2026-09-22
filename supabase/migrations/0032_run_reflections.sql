-- 実行ごとの振り返り（4層）。スライドS07「振り返りは全改善の燃料」。
--   ① 成果本文        run_reflections.output_summary / output_urls   … 人間が読む
--   ② やったこと＋自己診断 run_reflections.did / self_check / rules_ok   … 人間＋点検担当が読む
--   ③ 仕組みの改善案    improvement_proposals kind='system'            … 点検担当が毎朝読む → 次回すぐ反映
--   ④ 事業の改善案      improvement_proposals kind='business'          … 知識整理・戦略担当が読む → 中長期で反映
-- ③と④は読み手も時間軸も違うので、同じ列に混ぜない（kind で分け、読む担当も分ける）。
-- 書き込みは scripts/reflect/reflect.py だけ。手順は .claude/skills/run-reflection/SKILL.md。

create table if not exists run_reflections (
  id             bigint generated always as identity primary key,
  channel        text not null check (channel in ('threads', 'hpb', 'site', 'gbp', 'seo')),
  agent          text not null,
  run_ref        text not null,                 -- 'threads:validate:2026-09-22' / 'hpb:analysis_runs:5'
  output_summary text not null check (length(btrim(output_summary)) > 0),
  output_urls    text[] not null default '{}',
  did            text not null check (length(btrim(did)) > 0),
  self_check     text not null check (length(btrim(self_check)) > 0),
  rules_ok       boolean not null,
  created_at     timestamptz not null default now()
);
create index if not exists run_reflections_channel_idx on run_reflections (channel, created_at desc);

create table if not exists improvement_proposals (
  id            bigint generated always as identity primary key,
  reflection_id bigint not null references run_reflections(id) on delete cascade,
  channel       text not null,
  kind          text not null check (kind in ('system', 'business')),
  -- system: agent / skill / code / rule / data   business: content / timing / offer / channel / other
  target        text not null,
  target_ref    text,                            -- 対象のファイルや項目（例 .claude/skills/threads-validate/SKILL.md）
  proposal      text not null check (length(btrim(proposal)) > 0),
  reason        text not null check (length(btrim(reason)) > 0),
  status        text not null default 'open'
                check (status in ('open', 'reported', 'accepted', 'applied', 'rejected')),
  resolved_by   text,
  resolve_note  text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  check (
    (kind = 'system'   and target in ('agent', 'skill', 'code', 'rule', 'data'))
    or (kind = 'business' and target in ('content', 'timing', 'offer', 'channel', 'other'))
  ),
  -- 却下・適用したものは理由を必ず残す（消さずに「もう使わない理由」を残す）
  check (status in ('open', 'reported') or length(btrim(coalesce(resolve_note, ''))) > 0)
);
create index if not exists improvement_proposals_open_idx on improvement_proposals (kind, channel, status);

alter table run_reflections enable row level security;
alter table improvement_proposals enable row level security;
drop policy if exists run_reflections_select_authenticated on run_reflections;
create policy run_reflections_select_authenticated on run_reflections
  for select to authenticated using (true);
drop policy if exists improvement_proposals_select_authenticated on improvement_proposals;
create policy improvement_proposals_select_authenticated on improvement_proposals
  for select to authenticated using (true);
-- 管理画面から「採用／見送り」を記録できるようにする
drop policy if exists improvement_proposals_update_authenticated on improvement_proposals;
create policy improvement_proposals_update_authenticated on improvement_proposals
  for update to authenticated using (true) with check (true);
