---
name: threads-batch
description: Threadsの「まとめて考えてまとめて投稿」の手順。ネタ出し→井上さんが方向を決める→文章化→チェック→登録→指示があれば投稿。自動投稿を止めている間の標準の流れ。/threads-batch で起動。
user-invocable: true
---

# Threads まとめ投稿（人が考え、AIが書き、人の合図で投稿）

2026-11-20 から、Threadsの自動投稿（post1〜3）と毎朝の3本づくり（validate）は止めている。
投稿の中身は **井上さんが決める**。AIは「ネタ出し」「文章化」「チェック」「登録・投稿」を担当する。
**井上さんの「投稿して」「OK」が出るまで、投稿は絶対にしない。**

## 0. 最初に読む
1. `.claude/skills/threads-blog-rules/SKILL.md`（絶対ルール。**8の「他店・同業・誤読」も必ず**）
2. `scripts/threads/persona.md` ／ `scripts/threads/tags.md`
3. `python scripts/threads/tdb.py --context`（直近の反応・形式別・タグ別）
4. `python scripts/threads/tdb.py --knowledge`（採用の型だけ型として使う）

## 1. ネタ出し（ここで一度止まる）
- 在庫: `python scripts/threads/tdb.py "SELECT id, persona, pillar, title FROM threads_topics WHERE status='active' ORDER BY id DESC LIMIT 20" --format json`
  （列名が違えば `--context` か `\d` 相当で確認。在庫が少なければ `threads-research` 手順で補充してよい）
- 井上さんのメモ（`owner_notes` の status='new'）があれば一緒に出す
- **5〜10個**、1行ずつ番号付きで出す: 「番号｜ネタ｜切り口（1行）｜向く形式（一言/標準/長文）」
- 出したら止まり、井上さんの返事を待つ。**勝手に書き始めない**

## 2. 井上さんが決める
井上さんが「この番号でこの方向」「自分の言葉でこう言いたい」と返す。その内容が中身の正。
- メモに無い事実を足さない。店の事実は `lib/fallback-data.ts` で確認できる範囲だけ
- 曖昧なら1回だけ短く聞く（本数・いつ投稿するか・写真の有無）

## 3. 文章にする
`threads-validate` の C-1（形式の組み合わせ）・C-3（AI感を避ける）・C-4（付けるもの）と同じ作法で書く。
本数は井上さんの指定どおり。1日あたり最大3本（slot 1〜3）。

- 1本ごとに `post_text`・`format`・`hook`・`topic_tag`（`tags.md`）・`predicted_note`・`predicted_metric`・`predicted_vs_baseline`
- **書いたあと必ず**:
  ```
  python scripts/threads/check_article.py --text "本文＋タグ"
  ```
  NGは直す。「要確認・他店」「要確認・価格」は自分で意味を確かめ、問題があれば直す
- 次の**自己点検**を1本ずつ行い、1つでも当てはまれば書き直す
  1. 他店・同業・行きつけの店を下げたり、乗り換えを促したりしていないか（rules 8）
  2. 特定の店・職種・人が読んで自分のことだと感じそうな描写になっていないか
  3. 比喩（「注文」「椅子」など）を文字どおりに取られて、意味がずれないか。読者が誤読しそうな言葉は言い換える
  4. 他人の気持ちを代弁して断定していないか（「〜と思う人は多い」「〜だろう」）
  5. 医療的断定・煽り・価格・個室などの絶対ルール
- まとめて **番号付きで一覧にして井上さんに見せる**（本文・形式・字数・タグ）。直しの指示があれば直す。登録は承認後

## 4. 登録（井上さんが「OK」と言ってから）
すでに井上さん本人が内容を確認しているので、`status='draft'` で登録する（`pending_approval` にはしない）。
`trial_date` は**投稿する日（日本時間）**、`slot` は1日の何本目か（同じ日に同じ slot は入れられない）。
```
python scripts/threads/tdb.py "INSERT INTO threads_trials (trial_date, slot, topic_id, post_text, hook, format, predicted_note, predicted_metric, predicted_vs_baseline, topic_tag) VALUES ('2026-11-21', 1, NULL, '...', '問いかけ', 'standard', '...', 'views', 'same', '40代の疲れ') RETURNING id" --write
```
`topic_id` は元ネタが `threads_topics` にあればその id、無ければ NULL。写真を付けるときは `image_url` も入れる。
元ネタを使ったら `UPDATE threads_topics SET status='drafted' WHERE id=...`。

## 5. 投稿する（井上さんの明示の合図があるときだけ）
投稿は外に公開される操作なので、**前に必ず内容を確認してもらう**。まず dry-run:
```
python scripts/threads/threads_api.py post-due --date <日付> [--slot N]
```
- **今すぐ投稿**: 井上さんが「今投稿して」と言ったら `--live` を付けて実行。複数本を同日に出す場合は、
  slot 順に、間を数時間あけたいかを聞く（一度に3本は連投に見える）
- **日を分けて予約**: Windowsタスク `mensumbrella-threads-post1〜3`（8:00／12:30／19:00）を再開すると、
  登録済みの `draft` が**その日の** `trial_date` と slot で自動投稿される。再開してよいか井上さんに確認してから
  `Enable-ScheduledTask -TaskName "mensumbrella-threads-post1"`（post2・post3も）。無い日は何も投稿されない。
  再開しない限り、未来日の draft は投稿されない
- 投稿後は結果（成功・失敗とリンク）を報告する。失敗したら `result_note` を見て原因を伝え、勝手に再投稿しない

## 6. 投稿後
- 答え合わせ（`threads_api.py measure`・`validate` の A〜B）は `validate` タスクが止まっている間は走らない。
  反応を見たいときは井上さんに伝えて、手動で `python scripts/threads/threads_api.py measure` を実行する
- 投稿から数時間後にコメント欄を見ることを井上さんに勧める（誤解されたコメントや同業アカウントの反応に早く気づける）

## 振り返り（完了報告の直前に1回）
`.claude/skills/run-reflection/SKILL.md` の手順で、`--channel threads --agent threads-batch --run-ref threads:batch:<日本時間の日付>` として記録。
③ 仕組みの改善案と ④ 事業の改善案は分けて書く。無ければ `--no-system` / `--no-business`。
