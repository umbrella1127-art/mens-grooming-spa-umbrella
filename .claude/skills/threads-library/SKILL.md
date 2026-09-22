---
name: threads-library
description: 週1回、Threadsの投稿結果と日々の学びを「効いた型・外れた型」の知識（knowledge）に整理する手順。重複をまとめ、根拠の数を添える。threads-librarian 専用。
user-invocable: false
---

# 知識整理の手順（threads-librarian 専用・週1回）

日々の検証担当が書き散らした学びを、**一枚で読める型** に整える。新しい主張は作らない。根拠のある整理だけ。

## 0. 最初に読む
1. `.claude/skills/threads-blog-rules/SKILL.md`
2. `python scripts/threads/tdb.py --context`

## 1. 材料を出す
```
python scripts/threads/tdb.py "SELECT r.trial_date, r.slot, r.hook, r.reaction_score, r.is_winner, r.result_note, r.predicted_note, r.predicted_metric, r.predicted_vs_baseline, s1.views v1, s1.verdict verdict_t1, s7.views v7, s7.verdict verdict_t7, s7.prediction_hit hit_t7, s7.note note_t7, t.age_band, t.research_notes->>'pillar' pillar, t.research_notes->>'persona' persona, left(r.post_text,80) txt FROM threads_trials r LEFT JOIN threads_topics t ON t.id=r.topic_id LEFT JOIN threads_trial_snapshots s1 ON s1.trial_id=r.id AND s1.days_after=1 LEFT JOIN threads_trial_snapshots s7 ON s7.trial_id=r.id AND s7.days_after=7 WHERE r.measured_at IS NOT NULL AND r.trial_date >= (now() at time zone 'Asia/Tokyo')::date - 28 ORDER BY r.trial_date" --format json
python scripts/threads/tdb.py "SELECT id, title, body, category, updated_at FROM knowledge WHERE source='threads' ORDER BY category, title" --format json
```

## 1.5 事業の改善案を読む（振り返り④）
各担当が日々出した「事業の改善案」を週1回ここで仕分ける。
```
python scripts/reflect/reflect.py open --kind business --channel threads
```
- 手順2の集計で裏付けられた案 → 知識に反映し `resolve --id N --status accepted --by threads-librarian --note "knowledge「<title>」に反映"`
- データで否定された案 → `resolve --id N --status rejected --by threads-librarian --note "<n本中m本で逆の結果>"`（消さずに理由を残す）
- まだ根拠が足りない案（同じ提案が3回未満・本数3未満）→ open のまま残す。翌週また読む

## 2. 集計する（自分で数える）
- フック型別 / pillar 別 / persona 別 / 時間枠（slot）別に、本数・勝者数・平均スコアを出す
- **判定は T+7 の確定（verdict_t7）を優先**する。T+7 が無い投稿（直近7日）は T+1 の暫定として別に数える
- 予測の当たり率（hit_t7 の hit / partial / miss）も数える。外れ続ける予測の立て方は「外れた型」に書く
- 本数が3未満の組み合わせは「まだ分からない」として扱う（断言しない）

## 3. 知識を整える
- 同じ型を指す項目が複数あれば **1つに統合**（残す方の body に統合した旨と日付を書き、他は削除）
- 各項目の body 冒頭に「集計（〜MM/DD）: n本中 勝者m本、平均スコアx」を置き、その下に日々の追記を残す
- 勝率が低い型は category を `Threadsで外れた型` に移す（逆も同じ）
- 「今のところ」「n回中m回」を付け、次に試すべきことがあれば1行で書く
```
python scripts/threads/tdb.py "UPDATE knowledge SET body='...', category='...', updated_at=now() WHERE id='<uuid>'" --write
python scripts/threads/tdb.py "DELETE FROM knowledge WHERE id='<uuid>' AND source='threads'" --write
```
`source='manual'`（オーナーが手で書いたもの）は **絶対に編集・削除しない**。

## 4. 週次サマリーを1本残す
category `Threadsで効いた型`、title `週次まとめ YYYY-MM-DD`、body に「今週の結論3行」「来週試す型1つ」「データが足りないこと」。

## 振り返りを書く（完了報告の直前に必ず1回）
`.claude/skills/run-reflection/SKILL.md` の手順で、`--channel threads --agent threads-librarian --run-ref threads:library:<日本時間の日付>` として記録する。
③ 仕組みの改善案と ④ 事業の改善案は分けて書く。無ければ `--no-system` / `--no-business`。

## 5. 報告
Discord に短く送る（`python scripts/threads/threads_notify.py --kind learn --text "📚 Threads 週次の学び (MM/DD)\n..."`）。
チャットには、統合した件数・今週の結論・来週試す型を返す。
