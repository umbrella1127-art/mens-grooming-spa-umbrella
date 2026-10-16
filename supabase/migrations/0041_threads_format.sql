-- Threads投稿の「形式」（文字数の幅）。1日3本の形式を混ぜ、どの形式が表示・反応に効くかを T+1 / T+7 で集計する。
--   short    … 一言（〜40字）。言い切りでも問いでもよい。宣伝にしない
--   standard … 標準（80〜200字）。これまでの投稿はすべてこの形式
--   long     … 長文（350〜500字。Threadsの上限は500字）。出来事→気づき→読者への一言のように起伏を入れる
-- 判定（scripts/threads/judge.py）は形式で分けず、同じ基準（前7日の平均比）で比べる。
-- 選び方は .claude/skills/threads-validate/SKILL.md の手順C、説明は scripts/threads/GUIDE.md。

alter table threads_trials add column if not exists format text not null default 'standard';
alter table threads_trials drop constraint if exists threads_trials_format_check;
alter table threads_trials add constraint threads_trials_format_check check (
  format in ('short', 'standard', 'long')
);

-- 既存行はすべて標準（80〜200字）で書かれているので 'standard' のまま
comment on column threads_trials.format is
  'short=一言(〜40字) / standard=標準(80〜200字) / long=長文(350〜500字)。形式別の効きを比べるための区分';
