---
name: threads-run
description: Threads検証→ブログ化パイプラインを実行する。research（在庫補充）／validate（実測・勝者・今日の3本）／blog（勝者の記事化）／care（点検）／library（週次の知識整理）。省略時は research→validate→blog。
argument-hint: "[research|validate|blog|care|library]"
user-invocable: true
---

# Threads→ブログ 実行

引数: `$ARGUMENTS`
- `research` = 在庫が9件未満なら種ネタを補充
- `validate` = 前日の実測→勝者→学び→今日の3本（draft）
- `blog` = 勝者の記事を下書き保存→Discord承認依頼
- `care` = 点検（異常の記録・安全な修正・報告）
- `library` = 週次の知識整理
- 省略 = research → validate → blog

`threads-orchestrator`（宮下 律）に委譲する。引数があればその工程だけを指示に含める。

## 事前確認
- Supabase に `0029_threads_pipeline.sql` と `0030_threads_ops.sql` が適用済みか（未適用なら `tdb.py` が失敗する。適用を依頼して止まる）
- **実投稿（`--live`）はここでは行わない**。本番投稿はタスクスケジューラ（`scripts/threads/schedule/`）の仕事

## 完了時の報告
在庫数・勝者と理由・今日の3本・作成した下書き（承認待ち）・異常・要確認事項を短くまとめる。
