---
name: ga4-analysis
description: GA4の週次分析の手順。流入元別・ページ別のLINEクリック率を見て、所見と実験案を findings(channel=ga4) に書く。ga4-analyst 専用。
---

# GA4週次分析

毎週月曜 09:15（`scripts/site/run-weekly.ps1`）。事実の取得は `scripts/site/analyze.py`、解釈と所見は ga4-analyst。

## 読み方の原則
- 最重要KPIは **LINEクリック率（LINEクリック ÷ 訪問）**。訪問数ではなく率で入口とページを比べる。
- 訪問が1日数件の規模。10訪問未満の行の率、LINE合計10件未満の差は「参考」扱い。
- 流入元の見方: `google_business_profile / organic`＝Googleマップ・検索の店舗情報、`umbrella-no9.net / referral`＝旧サイト、
  `instagram / social`・`threads / social`＝SNS、`(direct)`＝URL直打ち・ブックマーク（SNSのアプリ内ブラウザもここに入ることがある）。
- 「入口の質」（その入口から来た人がLINEを押す率）と「入口の量」（訪問数）を分けて考え、伸ばす先を決める:
  率が高く量が少ない入口を増やす／量が多く率が低い入口の受け皿（ページ）を直す。

## 実験案の書き方（登録は人）
「何を変える／どのページ／何の指標がどうなるはず／何日見る」を1行ずつ。偽の希少性・価格の未確定表示・医療的断定は禁止（AGENTS.md の絶対ルール）。

## 出力先
- 所見: `db_put.py --finding --channel ga4`（`/admin/ga4` と `/admin/kpi` に出る）
- 要約: Discord 1通
- 振り返り: `reflect.py add`
