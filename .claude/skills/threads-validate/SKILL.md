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

## A. 答え合わせ（T+1 = 昨日の投稿 ／ T+7 = 7日前の投稿）
```
python scripts/threads/threads_api.py measure
```
1回で両方を測る（アカウント未接続なら飛ばす）。それぞれ「その投稿より前の7日間に出した投稿の、同じ日数後の平均」と比べて
判定が付く（ルールは `scripts/threads/judge.py`）:

| 判定 | 意味 |
|---|---|
| 反応あり（win） | いいね・返信などが平均を上回った。T+1 はその日の最高が勝者→ブログ化候補。T+7 で初めて上回ったものも勝者に追加される |
| 表示が伸びた（lead） | 反応は無いが、表示が平均の1.5倍以上 |
| 平均並み（flat） / 表示が落ちた（lose） | 表示が平均の0.5倍超〜1.5倍未満 / 0.5倍以下 |
| 比べる投稿が足りない（insufficient） | 前の7日間に3本未満。判定しない |

予測（`predicted_metric` × `predicted_vs_baseline`）がある投稿には **予測どおり／一部当たり／予測と逆** が出る。

- **T+1**: 昨日の各投稿の `result_note` に **なぜそうなったか** を1〜2文で書く（暫定。`predicted_note` と比べる）
  ```
  python scripts/threads/tdb.py "UPDATE threads_trials SET result_note='...' WHERE id=<ID>" --write
  ```
- **T+7**: 7日前の各投稿の確定所見を `note` に1〜2文で書く。**T+1 から伸びたか・止まったか**も見る
  ```
  python scripts/threads/tdb.py "SELECT t.id, t.trial_date, t.slot, t.hook, t.predicted_note, s1.views v1, s7.views v7, s7.verdict, s7.prediction_hit FROM threads_trials t JOIN threads_trial_snapshots s7 ON s7.trial_id=t.id AND s7.days_after=7 LEFT JOIN threads_trial_snapshots s1 ON s1.trial_id=t.id AND s1.days_after=1 WHERE t.trial_date=(now() at time zone 'Asia/Tokyo')::date - 7" --format json
  python scripts/threads/tdb.py "UPDATE threads_trial_snapshots SET note='...' WHERE trial_id=<ID> AND days_after=7" --write
  ```
- 勝者が無い日は「勝者なし」でよい。無理に選ばない

## B. 学びを知識に残す（T+7 の判定が出た投稿と、T+1 で勝者が決まった投稿）
**知識に書くのは T+7 の確定判定が基本**（T+1 は暫定。T+1 の勝者だけは例外で書いてよい）。
- 予測どおり（hit）かつ 反応あり・表示が伸びた → `Threadsで効いた型`
- 予測と逆（miss）、または 表示が落ちた → `Threadsで外れた型`（なぜ外れたかを書く）
- 平均並み・比べる投稿が足りない → 書かない
型（フック・長さ・柱・年代・時間枠）ごとに1行ずつ `knowledge` に書く。
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
- さらに **測れる予測を2つ必須で付ける**（無いとDBが登録を拒否する）:
  - `predicted_metric` … `views`（表示）か `reaction_score`（いいね・返信など）
  - `predicted_vs_baseline` … 直近7日の平均と比べて `above`（1.2倍以上）／ `same` ／ `below`（0.8倍以下）
  - 平均は `--context` の「直近7日の平均」を見る。T+1 と T+7 の両方でこの予測と答え合わせされる
- 声はサロン公式・共感型。「〜ですよね」「実は多いです」。説教・断定・上から目線は禁止
- サロンの宣伝は3本に1本まで。LINE誘導ではなく「月に一度、自分を整える。」の世界観で軽く
- **理容室**であり美容室ではない。身だしなみ・コンディションの言葉で。限定・選別表現を使わない
- 時間の柱では確認済みの事実（火・金 17:00〜23:00）を使ってよい
- 髪の悩み（薄毛・分け目）に触れるときは「気になる場合は専門医に相談を」を添える

フック型: `問いかけ` ／ `あるある共感` ／ `意外な事実（確認できるものだけ）` ／ `小さな行動提案` ／ `数字（確認済みの事実のみ）`

## D. 検査して登録
```
python scripts/threads/check_article.py --text "投稿文"     # NGなら書き直す
python scripts/threads/tdb.py "INSERT INTO threads_trials (trial_date, slot, topic_id, post_text, hook, predicted_note, predicted_metric, predicted_vs_baseline) VALUES ((now() at time zone 'Asia/Tokyo')::date, 1, 12, '...', '問いかけ', '...', 'views', 'above')" --write
```
**日付は必ず日本時間で書く。** SQL の `current_date` はUTCなので、朝9時前に実行すると1日前になる。
今日すでに同じ slot があれば作り直さない（`unique(trial_date, slot)`）。

## E. 投稿は自分でしない
```
python scripts/threads/threads_api.py post-due      # dry-run（内容表示のみ）で確認
```
`--live` は付けない。本番投稿はタスクスケジューラ（`scripts/threads/schedule/`）が時刻どおりに行う。

## 振り返りを書く（完了報告の直前に必ず1回）
`.claude/skills/run-reflection/SKILL.md` の手順で、`--channel threads --agent threads-strategist --run-ref threads:validate:<日本時間の日付>` として記録する。
③ 仕組みの改善案と ④ 事業の改善案は分けて書く。無ければ `--no-system` / `--no-business`。

## F. 報告
勝者（あれば）と理由、知識に書いた型、今日の3本の要約（persona・pillar・フック・予測）。
