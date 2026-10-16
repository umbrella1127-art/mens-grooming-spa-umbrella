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
3. `python scripts/threads/tdb.py --context`（過去の勝者・直近7日の平均・T+7 の判定）
4. `python scripts/threads/tdb.py --knowledge`（知識。**採用だけを型として使う**。保留は仮説、退役は理由を見て繰り返さない）

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

## B. 根拠を積む（T+7 の確定判定が出た投稿ごと）
知識は **根拠（knowledge_evidence）を1投稿1行ずつ積む** だけにする。**採用・退役は知識整理担当の仕事なので、ここではしない**。
T+1 の判定は暫定なので根拠にしない（T+1 の勝者も T+7 を待つ）。

1. 投稿の型を決める。title は `<フック>×<柱>（<年代>・<時間枠>）` の形（例 `あるある共感×疲労・休息（40s・朝）`）。
   タグそのものの効き目は型に混ぜず、知識整理担当が週1でタグ別に集計する
2. `--knowledge` で同じ型があるか探す（採用・保留とも）。**無ければ保留で作る**:
   ```
   python scripts/threads/tdb.py "INSERT INTO knowledge (title, body, category, source, kind, status) VALUES ('あるある共感×疲労・休息（40s・朝）', '2026-09-26: 初出。<T+7の結果を1行>', 'Threadsで効いた型', 'threads', 'pattern', 'candidate') RETURNING id" --write
   ```
   category は「効くはず」なら `Threadsで効いた型`、「避けるべき」なら `Threadsで外れた型`
3. 根拠を1行足す。その型の向きと結果が合えば `support`、逆なら `contradict`:
   | 型の category | support にする結果 | contradict にする結果 |
   |---|---|---|
   | Threadsで効いた型 | 反応あり・表示が伸びた（かつ予測と逆でない） | 表示が落ちた・予測と逆 |
   | Threadsで外れた型 | 表示が落ちた・予測と逆 | 反応あり・表示が伸びた |
   平均並み・比較対象不足は根拠にしない。
   ```
   python scripts/threads/tdb.py "INSERT INTO knowledge_evidence (knowledge_id, trial_id, outcome, days_after, note, added_by) VALUES ('<uuid>', <trial_id>, 'support', 7, 'T+7 表示140（平均71の2.0倍）・予測どおり', 'threads-strategist')" --write
   python scripts/threads/tdb.py "UPDATE knowledge SET body = body || E'
2026-09-26: ...', updated_at=now() WHERE id='<uuid>'" --write
   ```
**採用された型に反証が出たら**、根拠を contradict で足すだけでよい（退役させるかは知識整理担当が決める）。
断言しない。「今のところ」「n回中m回」のように、根拠の数を添える。

## C. 今日の3本を作る

目的は2つ。**毎日同じ長さ・同じ構造にしないこと**（読み手に「また同じ型だ」と思わせない）と、
**どの形式が表示・反応に効くかを測れるようにすること**（`format` 列。判定の基準は形式で変えない）。

### C-1. 先に3本の形式（`format`）を決める

| `format` | 字数 | どう書くか |
|---|---|---|
| `short` 一言 | 〜40字 | 言い切りでも問いでもよい。気づき・情景を1つだけ。**宣伝にしない**。説明を足さない |
| `standard` 標準 | 80〜200字 | これまでの長さ。ただし下の「AI感を避ける」を守る |
| `long` 長文 | 350〜500字（Threadsの上限は500字） | 出来事→気づき→読者への一言、のように**1本の中に起伏を入れる**。箇条書き・見出し・説明の羅列にしない |

- 基本の組み合わせは **標準2＋一言1** か **標準1＋一言1＋長文1**。**同じ形式を3本続けない**
- 長文は **週に2〜3本**。`--context` の「直近3日の形式の並び」に `long` が無ければ今日1本入れる、くらいの目安
- 同じ形式を同じ slot に3日続けて置かない（朝は一言・夜は長文、のような決めつけをしない。並びを変えて測る）
- `--context` の「形式別の表示」で伸びている形式は続けつつ、件数が少ない形式（n が5未満）は1本試す
- 井上さんのメモ由来の1本は、メモの量で形式を選ぶ（一言のメモなら `short`、出来事が書いてあれば `long` に向く）
- 字数は書いたあとに数える（例: `python -c "import sys; print(len(sys.argv[1]))" "本文"`）。幅から外れたら削るか足す

### C-2. ネタを選ぶ
- **まず井上さんのメモ由来（`threads_topics.source='owner'`）で未使用の在庫を確認する。1件でもあれば、
  最も古いもの1件を必ず3本のうち1本に使う**（無ければ通常どおり全て通常ネタでよい）。声のルール・写真の扱いは
  `.claude/skills/threads-blog-rules/SKILL.md` の「井上さん本人のメモ由来の投稿」を見る（一人称OK・断定禁止は変わらず）
- 残り（通常は2本、owner在庫が無ければ3本）は「未テストの新鮮ネタ」から。persona と pillar を偏らせず、同じ pillar を同じ日に重ねない
- `knowledge` の「効いた型」があれば1本は寄せ、1本は別の型を試す（同じ型を3日続けない）

### C-3. 書く — AI感を避ける
声はサロン公式・共感型（説教・断定・上から目線は禁止）。その上で、次を守る:

- **「問いかけで始めて提案で締める」の定型を毎回使わない**。この型は1日1本まで
- **結論や提案を言わずに終えてよい**。情景や気づきで止めて、読者が続きを考える余白を残す
- **具体的な名詞を1本に1つ入れる**: 天気・季節・曜日や時間帯（火曜の21時、など）・店の道具（蒸しタオル、バリカン、鏡…）。
  ただし事実は捏造しない。店の設備・道具は `lib/fallback-data.ts` で確認できるものだけ、店の出来事は井上さんのメモにある範囲だけ。
  前橋・群馬の地名は `threads-blog-rules` のとおり、井上さんのメモ由来か宣伝の1本でだけ使う
- **3本とも同じ長さ・同じ構造にしない**。出だしも変える（名詞で始める／会話で始める／情景で始める／結論から始める）
- **「月に一度、自分を整える。」で締めるのは1日1本まで**
- 読者をひとまとめにする決まり文句（「〜ですよね」「〜ではないでしょうか」「そういう方は多い」）に頼らない。
  使うなら3本で1回まで
- 書き終えたら3本を並べて読む。長さと構造（問い→説明→提案）が揃っていたら、1本を崩してから登録する

### C-4. 1本ごとに付けるもの
- `post_text`（字数は C-1 の形式どおり）・`format`・`hook`（型名）・`predicted_note`（伸びそうな指標と根拠。**その形式を選んだ理由も1行**）
- **測れる予測を2つ必須で付ける**（無いとDBが登録を拒否する）:
  - `predicted_metric` … `views`（表示）か `reaction_score`（いいね・返信など）
  - `predicted_vs_baseline` … 直近7日の平均と比べて `above`（1.2倍以上）／ `same` ／ `below`（0.8倍以下）
  - 平均は `--context` の「直近7日の平均」を見る。T+1 と T+7 の両方でこの予測と答え合わせされる。**形式が違っても比べる相手は同じ平均**
- **トピックタグを1つ必須で付ける**（`topic_tag`。無いとDBが登録を拒否する）
  - 選び方・候補・使わない言葉は `scripts/threads/tags.md`。本文に `#` を書かない
  - `--context` の「タグ別の表示」を見て、伸びたタグは続け、3本に1本はまだ使っていないタグを試す
  - `check_article.py --text` にはタグも本文の末尾に足して通す（禁止表現が無いか確かめる）
- サロンの宣伝は3本に1本まで。LINE誘導ではなく「月に一度、自分を整える。」の世界観で軽く
- **理容室**であり美容室ではない。身だしなみ・コンディションの言葉で。限定・選別表現を使わない
- 時間の柱では確認済みの事実（火・金 17:00〜23:00）を使ってよい
- 髪の悩み（薄毛・分け目）に触れるときは「気になる場合は専門医に相談を」を添える

フック型（`hook`。冒頭の型で、`format` とは別に付ける）:
`問いかけ` ／ `あるある共感` ／ `意外な事実（確認できるものだけ）` ／ `小さな行動提案` ／ `数字（確認済みの事実のみ）` ／
`一言`（`short` で、他の型に当てはまらない言い切り・情景）／ `長文の語り`（`long` で、出来事から語り起こすもの）

## D. 検査して登録
```
python scripts/threads/check_article.py --text "投稿文"     # NGなら書き直す
python scripts/threads/tdb.py "INSERT INTO threads_trials (trial_date, slot, topic_id, post_text, hook, format, predicted_note, predicted_metric, predicted_vs_baseline, topic_tag) VALUES ((now() at time zone 'Asia/Tokyo')::date, 1, 12, '...', '問いかけ', 'standard', '...', 'views', 'above', '40代の疲れ')" --write
```
`format` は `short` / `standard` / `long` のどれか（省略すると `standard` になるので、一言・長文のときは必ず書く）。
**日付は必ず日本時間で書く。** SQL の `current_date` はUTCなので、朝9時前に実行すると1日前になる。
今日すでに同じ slot があれば作り直さない（`unique(trial_date, slot)`）。

**井上さんのメモ由来の topic（source='owner'）を使うときだけ**、上のINSERTを次のように変える:
- `status` に明示的に `'pending_approval'` を入れる（省略すると既定の `'draft'` になり、承認なしで投稿されてしまう）
- topicの `research_notes->>'image_urls'` に画像があれば、その1枚目を `image_url` 列に入れる（無ければ省略してよい）
```
python scripts/threads/tdb.py "INSERT INTO threads_trials (trial_date, slot, topic_id, post_text, hook, format, predicted_note, predicted_metric, predicted_vs_baseline, topic_tag, status, image_url) VALUES ((now() at time zone 'Asia/Tokyo')::date, 1, 12, '...', '長文の語り', 'long', '...', 'views', 'above', '40代の疲れ', 'pending_approval', 'https://.../owner-notes/....jpg') RETURNING id" --write
```
登録できたら、返ってきた `id` で承認依頼を送る（必ず実行する。忘れると井上さんに届かず、そのまま投稿されずに終わる）:
```
python scripts/threads/owner_notes.py request-approval --trial-id <上のid>
```

## E. 投稿は自分でしない
```
python scripts/threads/threads_api.py post-due      # dry-run（内容表示のみ）で確認
```
`--live` は付けない。本番投稿はタスクスケジューラ（`scripts/threads/schedule/`）が時刻どおりに行う。
**`pending_approval` の投稿は dry-run の一覧に出ない**（`post-due` は `status='draft'` だけを見る）。
井上さんの承認（Discordボタン or `/admin/approvals`）で `draft` に変わって初めて対象になる。却下されると `skipped` になり投稿されない。

## 振り返りを書く（完了報告の直前に必ず1回）
`.claude/skills/run-reflection/SKILL.md` の手順で、`--channel threads --agent threads-strategist --run-ref threads:validate:<日本時間の日付>` として記録する。
③ 仕組みの改善案と ④ 事業の改善案は分けて書く。無ければ `--no-system` / `--no-business`。

## F. 報告
勝者（あれば）と理由、知識に書いた型、今日の3本の要約（persona・pillar・フック・**形式**・予測）、
井上さんのメモを使ったか（使った場合は承認依頼を送ったこと）。
