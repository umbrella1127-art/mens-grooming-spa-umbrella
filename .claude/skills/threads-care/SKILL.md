---
name: threads-care
description: Threads基盤の点検と安全な修正の手順（ループB「自分自身を直す」）。ログとDBから異常を見つけ、pipeline_issues に記録し、決められた範囲だけ直し、Discordに報告する。threads-caretaker 専用。
user-invocable: false
---

# 点検の手順（threads-caretaker 専用）

事業を良くする側（投稿・記事）には触れない。**仕組みが正しく回っているか** だけを見る。

## 0. 最初に読む
1. `python scripts/threads/tdb.py --context`（未解決の異常と直近の実行記録）
2. `python scripts/threads/health.py --json`（異常の候補。事実だけ）
3. 必要なら `scripts/threads/logs/` の当日ログ（`Read`）

## 1. 候補を判断する
候補ごとに「本当に異常か」「重要度」「直せるか」を決める。
- 既に `pipeline_issues` に同じ kind + 同じ evidence で open のものがあれば **新規登録しない**（重複禁止）
- 状況が解消していれば、その open を `fixed` にする

| kind | 直してよいこと（安全な修正） | 直してはいけないこと |
|---|---|---|
| post_failed | `threads_api.py post-due --slot N`（dry-run）で本文を確認し、原因がトークン切れなら `refresh-token` を試す | 本文の書き換え、`--live` での再投稿 |
| not_posted | 上と同じ（トークン確認まで） | `--live` の実行 |
| no_draft_today | `threads-strategist` の再実行をオーナーに依頼（報告に書く） | 自分で投稿文を作る |
| unmeasured | `threads_api.py measure --date <前日>` を実行してよい | 勝者の手動指定 |
| no_winner_streak | 記録と報告のみ（アカウント初期は想定内） | — |
| stock_low | 記録のみ（翌朝の research が補充する） | 種ネタの作成 |
| draft_stale | 記録と報告のみ（承認はオーナー） | 承認・却下 |
| run_error | ログを読んで原因を1行にまとめる。ワークスペース信頼の警告は無視 | スクリプトの修正 |
| rule_violation | 該当の trial を記録し、報告で削除を提案 | Threads上の投稿削除 |

## 2. 記録する
```
python scripts/threads/tdb.py "INSERT INTO pipeline_issues (kind, severity, title, detail, evidence, action_taken) VALUES ('not_posted','critical','...','...','{\"slot\":1}', 'refresh-token を実行。再投稿は未実施')" --write
python scripts/threads/tdb.py "UPDATE pipeline_issues SET status='fixed', resolved_at=now(), resolve_note='...' WHERE id=<ID>" --write
```

## 3. 報告する
critical か warning が1件でもあれば Discord に送る（info だけなら送らない）:
```
python scripts/threads/notify.py --text "🩺 Threads基盤の点検 (MM/DD)\n・[critical] ...\n・[warning] ...\n直したこと: ...\nお願い: ..."
```
最後に、見つけた件数・直したこと・オーナーに頼むことを短く返す。異常なしなら「異常なし」と1行。
