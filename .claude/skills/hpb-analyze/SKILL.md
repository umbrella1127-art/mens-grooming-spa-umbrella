---
name: hpb-analyze
description: 分析と戦略立案だけを実行する。DBに取り込み済みのデータから新規CPA・ファネル・ブログ・特集・クーポンを分析し、findingsと戦略を出す。レポート生成はしない。分析をやり直したいときに使う。
argument-hint: "[店舗コード] [月号 YYYY-MM]"
user-invocable: true
---

# 分析・戦略のみ実行

引数: `$ARGUMENTS`（例 `umbrella-mens 2026-06`）

すでにDBへ取り込み済みのデータを対象に、分析と戦略立案を行う（レポートHTMLは作らない）。

## 手順

1. 現状確認:
   ```bash
   python scripts/hpb/context.py --store <store> --month <YYYY-MM>
   ```
   コンテンツ明細が空なら先に `/hpb-collect` が必要な旨を伝えて終了する。

2. **分析4担当を1つのメッセージで並列起動**する（1人1役なので必ず4体すべて呼ぶ）:
   - `hpb-analyst-funnel` — 新規をどの段階でいくらかけて失っているか（CPA・ファネル）
   - `hpb-analyst-retention` — 獲った新規は残るか、受け入れ余力はあるか
   - `hpb-analyst-market` — 市場での位置とプランの妥当性（母集団の罠の検知を含む）
   - `hpb-content-analyst` — どのコンテンツが集客に効いたか

   全員のプロンプトに必ず含める:
   - 対象店舗・月号
   - 「ホットペッパーは新規集客のための投資。新規獲得数とCPAを主軸に評価する」
   - findings をDBに書くこと
   - 担当外の切り口を思いついたら自分で登録せず完了報告に書くこと

3. findings が揃ったら **戦略パネルを並列起動**する（1つのメッセージで4体同時に）:
   - `hpb-strategist-price`（価格・採算）— 値付け・プラン選択を限界利益まで試算
   - `hpb-strategist-creative`（訴求・コピー）— 価格は変えず名前と見せ方で改善
   - `hpb-strategist-ops`（運用・口コミ）— 価格も名前も変えず現場の手順で取りに行く
   - `hpb-strategist-page`（実ページ起点）— 実際の画面のどこを直すか

   前3体は**レポートの数字**から、`hpb-strategist-page` は**実ページの観察**から案を出す。
   この2系統を必ず両方走らせること（数字が正常でも中身が壊れていることがあるため）。
   `page_observations` の最終観察日が2週間以上前なら、先に `hpb-page-scout` を走らせる。

   全員に必ず伝える:
   - 対象店舗・月号・run_id
   - **1つの論点につき 守り(conservative)／標準(standard)／攻め(aggressive) の3案を出すこと**
   - 案は `python scripts/hpb/db_put.py --option ...` で `strategy_options` に登録すること
   - 試算の前提（`--assumptions`）を必ず書くこと

4. パネルの完了後に `hpb-strategist`（統合担当）を起動する。プロンプトに必ず含める:
   - **前回提案の効果検証を先に行うこと**
   - `strategy_options` の全案を4軸（効果・コスト・リスク・速さ）で採点し、
     `--option-score` で採否と理由を書き戻すこと
   - **攻めの案を最低1つは採用し、撤退条件を付けること**（守りだけ選ぶと市場平均に埋もれる）
   - 採用案を `strategies` に登録し `--from-option` で紐付けること
   - 新規獲得数またはCPAを target_metric にすること

5. 結果を確認して報告:
   ```bash
   python scripts/hpb/query.py "SELECT severity, category, title FROM findings WHERE store='<store>' AND month='<YYYY-MM>' ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'good' THEN 3 ELSE 4 END"
   python scripts/hpb/query.py "SELECT id, theme, lens, stance, title, score_total, selected, decision_note FROM strategy_options WHERE store='<store>' AND month='<YYYY-MM>' ORDER BY theme, score_total DESC"
   python scripts/hpb/query.py "SELECT priority, title, target_metric, baseline_value, target_value FROM strategies WHERE store='<store>' AND month='<YYYY-MM>' ORDER BY priority"
   ```

## 報告に含めること

- 今月の新規獲得数とCPA、その評価
- 所見の件数（severity別）と、critical の内容
- **パネルが検討した案の数と、採用/不採用の内訳**（どんな選択肢があったかが分かるように）
- 採用した戦略の一覧と、攻めの案を採った場合はその撤退条件
- レポート化するなら `/hpb-report` を案内する
