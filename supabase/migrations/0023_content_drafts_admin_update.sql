-- 管理画面の「承認」ページからも承認・却下できるようにする。
-- Discordのボタンと同じ操作を、ログイン済み管理者に許可する。
-- 2026-09-03
create policy "content_drafts_update_authenticated"
  on content_drafts for update
  to authenticated
  using (true)
  with check (true);
