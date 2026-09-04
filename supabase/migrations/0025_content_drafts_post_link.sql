-- 自動生成したブログ記事は posts に下書きとして入れ、その承認を
-- content_drafts 側で受ける。承認されたら記事をそのまま公開するため、
-- どの記事に紐づく下書きかを持たせる。
-- 2026-09-04
alter table content_drafts
  add column if not exists post_id uuid references posts(id) on delete set null;
