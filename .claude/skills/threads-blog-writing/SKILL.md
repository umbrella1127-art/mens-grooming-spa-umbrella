---
name: threads-blog-writing
description: Threadsで勝った種ネタを公式ブログ記事にする手順。材料集め→記事の型→禁止表現チェック→下書き保存→Discord承認依頼。threads-blog-writer 専用。
user-invocable: false
---

# ブログ執筆の手順（threads-blog-writer 専用）

勝った種ネタだけを記事にする。反応が取れていないネタは書かない。**公開はしない**。

## 0. 最初に読む
1. `.claude/skills/threads-blog-rules/SKILL.md`
2. `scripts/threads/persona.md`
3. `python scripts/threads/tdb.py --context` の「ブログ化待ちの勝者」。**無ければ何も書かず「勝者なし」と報告して終了**
4. 勝者が複数なら最新の1件だけ（1日1記事）

## 1. 材料を集める
```
python scripts/threads/tdb.py "SELECT t.*, r.post_text, r.metrics, r.hook FROM threads_topics t JOIN threads_trials r ON r.topic_id=t.id WHERE t.id=<ID> AND r.is_winner" --format json
python scripts/threads/tdb.py "SELECT title, body FROM knowledge WHERE source='threads' AND category='Threadsで効いた型'" --format json
```
- 勝った投稿の文面・フック・反応が **読者の関心の答え**。記事はその悩みに深く答える
- 一般的な生活・肌・頭皮のケア情報は WebSearch で裏を取る
- **サロンの事実は `lib/fallback-data.ts` / `supabase/seed.sql` から**。出てこないものは書かない
- 断定できない話は「個人差があります」「気になる場合は専門医へ」で受ける

## 2. 記事の型（Markdown・1,500〜2,500字）
- タイトル: 悩みの言葉を入れた30字前後。煽り・断定は不可
- 導入: 悩みへの共感（勝った投稿の入口を活かす）→ この記事で分かること
- 本文: `##` 見出し3〜4つ。**今日から自分でできる行動**を必ず入れる（来店しなくても役に立つ）
- 末尾に1節だけサロンの話（「月に一度、自分を整える。」の文脈。男性専用のスペース／男性だけの空間）。
  LINEは文章で軽く触れる程度。本文にURLを書かない
- 書かない: 電話番号・ホットペッパー・個室・確定していない価格・統計の数字・「美容室」

## 3. 保存
1. 本文を `scripts/threads/_work/article-<topic_id>.md` に保存（無ければ作る）
2. `python scripts/threads/check_article.py scripts/threads/_work/article-<topic_id>.md` → **OK になるまで次へ進まない**
3. ```
   python scripts/threads/save_blog.py --topic-id <ID> --title "..." --excerpt "120字以内" --meta-description "120字以内" --body-file scripts/threads/_work/article-<topic_id>.md
   ```
   posts に下書きで入り、Discordに承認依頼が飛ぶ。承認はオーナーの判断

## 4. 報告
記事タイトル・想定読者（persona）・「要確認」が出た項目・保存結果。
