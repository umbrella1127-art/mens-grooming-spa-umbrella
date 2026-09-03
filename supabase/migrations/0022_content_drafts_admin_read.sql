-- 管理画面の業務ボードから下書きの進捗を読めるようにする。
-- 書き込みは引き続き service_role（Discord連携）だけが行う。
-- 2026-09-03
create policy "content_drafts_select_authenticated"
  on content_drafts for select
  to authenticated
  using (true);
