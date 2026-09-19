---
name: threads-validate
description: Threads検証の手順。前日の実測→勝者決定→答え合わせ→知識の書き込み→今日の3本づくり。threads-strategist 専用。
user-invocable: false
---

# 検証の手順（threads-strategist 専用）

「前日の答え合わせ → 勝者 → 学びを残す → 今日の3本」を1回でやる。

## 0. 最初に読む
1. `.claude/skills/threads-blog-rules/SKILL.md`
2. `scripts/threads/persona.md`
3. `python scripts/threads/tdb.py --context`（過去の勝者と、`knowledge source=threads` の「効いた型」も見る）

## A. 前日の答え合わせ
```
python scripts/threads/threads_api.py measure
```
- その日の最高スコアが `is_winner`、その種ネタに `priority=true` が付く（アカウント未接続なら飛ばす）
- 前日の各投稿の `result_note` に **なぜ伸びた／伸びなかったか** を1〜2文で書く（`predicted_note` と比べる）
  ```
  python scripts/threads/tdb.py "UPDATE threads_trials SET result_note='...' WHERE id=<ID>" --write
  ```
- 勝者が無い日は「勝者なし」でよい。無理に選ばない

## B. 学びを知識に残す（勝者が決まった日だけ）
勝った投稿・負けた投稿から **型（フック・長さ・柱・年代）** を1行ずつ `knowledge` に書く。
- 既に同じ型の項目（`source='threads'`、同じ title）があれば **本文に日付付きで追記**（新規作成しない）
- category は `Threadsで効いた型` または `Threadsで外れた型`
```
python scripts/threads/tdb.py "SELECT id, title, body FROM knowledge WHERE source='threads' ORDER BY updated_at DESC" --format json
python scripts/threads/tdb.py "INSERT INTO knowledge (title, body, category, source) VALUES ('問いかけ×疲労（40s）', '2026-09-20: 表示120・返信3で勝者。夕方の具体的な場面を入れた。', 'Threadsで効いた型', 'threads')" --write
python scripts/threads/tdb.py "UPDATE knowledge SET body = body || E'\n2026-09-21: ...', updated_at=now() WHERE id='<uuid>'" --write
```
断言しない。「今のところ」「n回中m回」のように、根拠の数を添える。

## C. 今日の3本を作る
- 素材は「未テストの新鮮ネタ」から3件。persona と pillar を偏らせず、同じ pillar を同じ日に重ねない
- `knowledge` の「効いた型」があれば1本は寄せ、1本は別の型を試す（同じ型を3日続けない）
- 1本ごとに `post_text`（**80〜200字**）・`hook`（型名）・`predicted_note`（伸びそうな指標と根拠）
- 声はサロン公式・共感型。「〜ですよね」「実は多いです」。説教・断定・上から目線は禁止
- サロンの宣伝は3本に1本まで。LINE誘導ではなく「月に一度、自分を整える。」の世界観で軽く
- **理容室**であり美容室ではない。身だしなみ・コンディションの言葉で。限定・選別表現を使わない
- 時間の柱では確認済みの事実（火・金 17:00〜23:00）を使ってよい
- 髪の悩み（薄毛・分け目）に触れるときは「気になる場合は専門医に相談を」を添える

フック型: `問いかけ` ／ `あるある共感` ／ `意外な事実（確認できるものだけ）` ／ `小さな行動提案` ／ `数字（確認済みの事実のみ）`

## D. 検査して登録
```
python scripts/threads/check_article.py --text "投稿文"     # NGなら書き直す
python scripts/threads/tdb.py "INSERT INTO threads_trials (trial_date, slot, topic_id, post_text, hook, predicted_note) VALUES ((now() at time zone 'Asia/Tokyo')::date, 1, 12, '...', '問いかけ', '...')" --write
```
**日付は必ず日本時間で書く。** SQL の `current_date` はUTCなので、朝9時前に実行すると1日前になる。
今日すでに同じ slot があれば作り直さない（`unique(trial_date, slot)`）。

## E. 投稿は自分でしない
```
python scripts/threads/threads_api.py post-due      # dry-run（内容表示のみ）で確認
```
`--live` は付けない。本番投稿はタスクスケジューラ（`scripts/threads/schedule/`）が時刻どおりに行う。

## F. 報告
勝者（あれば）と理由、知識に書いた型、今日の3本の要約（persona・pillar・フック・予測）。
