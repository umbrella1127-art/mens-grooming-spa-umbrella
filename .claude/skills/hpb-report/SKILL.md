---
name: hpb-report
description: レポートだけを再生成する。DBのfindings・戦略・KPIから月次レポートを作り直して analysis_reports に保存する（管理画面 /admin/kpi/hpb に反映）。構成や文章を直したいときに使う。
argument-hint: "[店舗コード] [月号 YYYY-MM]"
user-invocable: true
---

# レポートのみ再生成

引数: `$ARGUMENTS`（例 `umbrella-mens 2026-06`）

## 手順

1. 対象月の findings と strategies が揃っているか確認:
   ```bash
   python scripts/hpb/query.py "SELECT COUNT(*) findings FROM findings WHERE store='<store>' AND month='<YYYY-MM>'"
   python scripts/hpb/query.py "SELECT COUNT(*) strategies FROM strategies WHERE store='<store>' AND month='<YYYY-MM>'"
   ```
   空なら `/hpb-analyze` が先に必要な旨を伝える。

2. `hpb-reporter` サブエージェントを起動する。プロンプトに必ず含める:
   - 対象店舗・月号
   - **新規獲得（新規数・CPA・新規率・初回回収率）をレポートの主役に据えること**
   - 前回提案の検証結果セクションを入れること
   - `python scripts/hpb/db_put.py --report ...` で `analysis_reports` に保存すること

3. 保存後、管理画面で確認する: `/admin/kpi/hpb/<YYYY-MM>`（開発中なら http://localhost:3000）

4. **完了したら必ずDiscordに通知する**（レポート単独再生成でも省略しない）:
   ```bash
   python scripts/hpb/notify.py send --store <store> --month <YYYY-MM> \
     --message "<新規数・CPA・最大の課題を含む3〜5行>"
   ```
   管理画面のレポートURLが本文に自動で付く。

## 報告に含めること

- レポートのURL（`/admin/kpi/hpb/<YYYY-MM>`）
- レポートに載せた主要数値
- DBに無くて載せられなかった項目
- Discord通知の送信状況
