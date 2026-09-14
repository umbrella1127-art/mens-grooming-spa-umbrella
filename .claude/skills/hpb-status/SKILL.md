---
name: hpb-status
description: HPB分析システムの現状を確認する。データの蓄積状況・実行履歴・未検証の戦略・通知の状況・分析手法の一覧を表示する。今どうなっているか知りたいときに使う。
argument-hint: "[店舗コード]"
user-invocable: true
---

# システム状況の確認

引数: `$ARGUMENTS`（省略時 全店舗）

## 手順

1. 現状を取得:
   ```bash
   python scripts/hpb/context.py
   python scripts/hpb/notify.py status
   python scripts/hpb/schedule_check.py --next
   python scripts/hpb/agent_checkin.py status
   ```

2. ユーザーへ次を **要約して** 伝える（生の出力を貼らない）:
   - データの蓄積状況（何ヶ月分・最新月号）
   - 直近の実行と結果
   - 新規獲得数とCPAの直近推移
   - 未検証の戦略（何を提案していて、まだ結果が出ていないか）
   - 未送信・失敗した通知があるか
   - 次回の実行日（最終木曜の翌日）
   - 遡り適用が必要な分析手法
   - 稼働中のまま止まっているエージェントがいないか（`agent_checkin.py status` の🟢稼働中が
     不自然に長く続いている場合、チェックアウトを忘れたまま終了した可能性がある）

## 補足

画面での確認は管理画面 `/admin/kpi`（集客KPIハブ）と `/admin/kpi/hpb`（HPB詳細・月次レポート）。
