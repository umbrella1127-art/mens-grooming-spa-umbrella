---
name: hpb-backfill
description: 新しく登録された分析手法を過去の月へ遡って適用する。分析担当が「この切り口も見ておけばよかった」と気づいた手法を、過去13ヶ月分に当てはめて所見を追加する。分析を継続的に改善するための仕組み。
argument-hint: "[手法コード | all] [店舗コード]"
user-invocable: true
---

# 分析手法の遡り適用（バックフィル）

引数: `$ARGUMENTS`（例 `blog_timing <store>` / `all` で未適用の全手法）

分析担当が新しい切り口を思いついたとき、それを **過去の月にも適用し直す** ための仕組み。
これによって、分析の質が上がるたびに過去データの解釈も更新される。

## 手順

1. 遡り適用が必要な手法を確認:
   ```bash
   python scripts/hpb/query.py "SELECT code, name, category, owner_agent, description, procedure, backfilled_through FROM analysis_methods WHERE backfill_needed=true AND status='active'"
   ```
   何もなければ「遡り適用が必要な手法はありません」と伝えて終了。

2. 対象月を決める:
   ```bash
   python scripts/hpb/query.py "SELECT month FROM hpb_monthly_kpi WHERE store='<store>' ORDER BY month"
   ```
   `backfilled_through` より後の月（未適用の月）が対象。

3. 手法の `owner_agent` に対応するサブエージェントを起動する。
   **`owner_agent` の値をそのままエージェント名として使う**
   （`hpb-analyst-funnel` / `hpb-analyst-retention` / `hpb-analyst-market` /
   `hpb-content-analyst` のいずれか）。担当が違うエージェントに実行させない。
   複数の手法が異なる担当にまたがる場合は、担当ごとに1体ずつ並列起動する。
   プロンプトに含める:
   - 手法コード・description・procedure（DBから取得したもの）
   - 適用対象の月リスト
   - **各月について findings を追加すること**（`--method-code <手法コード>` を必ず付ける）
   - 月をまたいだ傾向が見えたら、最新月の findings にまとめて書くこと

4. 完了したら手法の状態を更新:
   ```bash
   python scripts/hpb/query.py "UPDATE analysis_methods SET backfill_needed=false, backfilled_through='<最新月>' WHERE code='<code>'" --write
   ```

5. 遡り適用で新しい発見があった場合は、`hpb-strategist` を起動して
   戦略を見直すべきか判断させる。

## 報告に含めること

- 適用した手法と対象月数
- 遡って分かった新しい傾向（これが一番の成果）
- 戦略の見直しが必要かどうか
