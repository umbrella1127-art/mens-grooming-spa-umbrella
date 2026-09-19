---
name: threads-research
description: Threads用の種ネタ補充の手順。ペルソナ3タイプの日常の悩みをWeb検索で拾い、threads_topics に登録する。threads-researcher 専用。
user-invocable: false
---

# 種ネタ補充の手順（threads-researcher 専用）

ここで作るのは **Threadsで反応を試す材料**。ブログ企画ではない。ブログ化するかは反応が決める。

## 0. 最初に読む
1. `.claude/skills/threads-blog-rules/SKILL.md`（絶対ルール）
2. `scripts/threads/persona.md`（3タイプ p40/p47/p53 と5本柱。参考の一つ）
3. `python scripts/threads/tdb.py --context`

## 1. 在庫を数える
「未テストの新鮮ネタ」（`--context` の2番目の表）が **全体で9件未満** のときだけ補充する。
9件以上なら何もせず「在庫あり・補充なし」と報告して終わる。
補充するときは、既存在庫の persona / pillar の偏りを見て、足りない所を埋める（1回の補充は最大6件）。

## 2. 探す
「メンズ美容」で探しすぎない。彼らの日常そのものを探し、サロンに接続できる話題だけ拾う。
- クエリ例: 「40代男性 疲れ」「経営者 睡眠」「管理職 第一印象」「40代男性 清潔感」「50代男性 老けて見える」
  「経営者 身だしなみ」「男性 頭皮 悩み」「仕事帰り リフレッシュ」「40代男性 自己投資」
- 拾うのは **悩みの言葉と切り口**。文章の引用・転載はしない
- 出典URLは種ネタごとに別のものを使う（使い回さない）
- 拾わない: サロンと無関係な話題、「治す」話になる領域（病的な脱毛の診断など）、統計の数字

## 3. 種ネタにする（1件ずつ）
| 列 | 書くこと |
|---|---|
| `pain_keyword` | 読者が実際に打ちそうな悩みの言葉（例「頭皮 べたつき 夕方」） |
| `title` | Threadsで試す切り口。10〜30字。作り込まない |
| `age_band` | p40・p47=`40s`、p53=`50s`（30代は少数だけ `30s`） |
| `angle` | 共感の入口。断定・煽りを入れない |
| `material_text` | **サロンの確認済み事実だけ**（`lib/fallback-data.ts` / `supabase/seed.sql` で確認）。営業時間 火・金 17:00〜23:00 は使ってよい |
| `research_notes` | `{"persona":"p47","pillar":"疲労・休息","queries":[...],"urls":[...]}` |

既存の `pain_keyword`（closed も含む）と意味が被るものは作らない。

## 4. 登録
```
python scripts/threads/tdb.py "INSERT INTO threads_topics (title, age_band, pain_keyword, angle, material_text, research_notes) VALUES ('...','40s','...','...','...','{\"persona\":\"p47\",\"pillar\":\"疲労・休息\",\"queries\":[\"...\"],\"urls\":[\"...\"]}')" --write
```
シングルクォートは `''` でエスケープ。登録後 `--context` で件数を確かめる。

## 5. 報告
登録件数、persona 別・pillar 別の内訳、拾った悩みキーワードの一覧、要確認事項。
