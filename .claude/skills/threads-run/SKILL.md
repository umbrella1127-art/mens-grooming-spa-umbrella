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

## 勝者が3日以上出ていないときの blog 工程
`tdb.py --context` に `no_winner_streak` の異常があるか、直近3日の投稿が全て反応スコア0のとき（毎回オーナーに聞かずに、この順で進める）:
- **記事化の基準は緩めない**。スコア0の投稿を勝者に格上げして記事にはしない
- blog 工程は「勝者なし・記事化なし」と1行で報告して終える（空振りは異常ではない）
- 続けて到達側を確かめる。枠ごとの表示数（views）の推移を見て、文面より先に投稿時刻・投稿頻度・アカウント側を疑う
- 表示数の落ち込みが枠をまたいで続いているときは care 工程で記録し、報告の「お願い」にアカウント側の確認を1行で上げる

## 完了時の報告
在庫数・勝者と理由・今日の3本・作成した下書き（承認待ち）・異常・要確認事項を短くまとめる。
