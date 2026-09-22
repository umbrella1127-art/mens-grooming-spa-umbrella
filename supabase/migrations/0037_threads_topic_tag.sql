-- Threads のトピックタグ（1投稿に1つ）。Threads API の topic_tag パラメータで付ける（本文に # を書かない）。
--   API の制約: 1〜50文字、ピリオド（.）とアンパサンド（&）は不可
--   候補と使わない言葉は scripts/threads/tags.md。どのタグで表示が伸びたかは T+1 / T+7 で集計する

alter table threads_trials add column if not exists topic_tag text;
alter table threads_trials drop constraint if exists threads_trials_topic_tag_format;
alter table threads_trials add constraint threads_trials_topic_tag_format check (
  topic_tag is null
  or (char_length(topic_tag) between 1 and 50
      and position('.' in topic_tag) = 0
      and position('&' in topic_tag) = 0
      and position('#' in topic_tag) = 0)
);

-- これから作る下書きはタグ必須（既存の行は検査しない）
alter table threads_trials drop constraint if exists threads_trials_topic_tag_required;
alter table threads_trials add constraint threads_trials_topic_tag_required check (
  status <> 'draft' or topic_tag is not null
) not valid;
