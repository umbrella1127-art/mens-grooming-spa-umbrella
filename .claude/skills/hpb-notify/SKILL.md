---
name: hpb-notify
description: HPB月次レポートのDiscord通知を送る・状況を確認する。レポートを共有し直したいときや、通知が届いているか確認したいときに使う。
argument-hint: "[send|status] [月号]"
user-invocable: true
---

# Discord通知の操作

引数: `$ARGUMENTS`

## 使い分け

| 引数 | 動作 |
|---|---|
| （なし）/ `status` | 通知の状況一覧を表示 |
| `send <月号>` | その月のレポートの要約とURLを改めて送信 |

## コマンド

```bash
python scripts/hpb/notify.py status
python scripts/hpb/notify.py send --store <store> --month 2026-06 --message "..."
```

送信先は `.env.local` の `DISCORD_CHANNEL_KPI`（無ければ `DISCORD_CHANNEL_NOTICE`）。
サイトのコンテンツ承認と同じ Bot（`DISCORD_BOT_TOKEN`）を使う。

## 通知メッセージの作り方

`send` する場合は、DBから当月の数値を取ってメッセージを組み立てる。必ず含める:

1. **新規獲得数とCPA**（最初に書く）
2. 全体の予約数・売上（参考として）
3. 最大の課題
4. 筆頭施策

レポートのURL（`/admin/kpi/hpb/<月号>`）は自動で末尾に付く。

```bash
python scripts/hpb/query.py "SELECT customers_new, plan_cost_yen, net_reservations, sales_man_yen, cvr, acr FROM hpb_monthly_kpi WHERE store='<store>' AND month='2026-06'"
python scripts/hpb/query.py "SELECT title FROM strategies WHERE store='<store>' AND month='2026-06' ORDER BY priority LIMIT 1"
python scripts/hpb/query.py "SELECT headline FROM analysis_reports WHERE store='<store>' AND month='2026-06'"
```
