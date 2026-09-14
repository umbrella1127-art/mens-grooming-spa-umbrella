---
name: hpb-collect
description: 集計だけを実行する。inboxのSalon Report PDF・担当者リボンPDF・CSVを読み取ってDBへ格納する。分析はしない。データの取り込み直しや、新しいPDFが届いたときに使う。
argument-hint: "[店舗コード]"
user-invocable: true
---

# 集計のみ実行

引数: `$ARGUMENTS`（省略時は設定にある店舗が1件ならそれを使用。複数ある場合は明示すること）

`hpb-collector` サブエージェントに委譲し、`data/hpb/<store>/inbox/` のファイルをDBへ取り込む。

## 手順

1. `python scripts/hpb/context.py --store <store>` で inbox の中身を確認
2. `hpb-collector` を起動（対象店舗と、inboxにあるファイル名を伝える）
3. 完了後、検算結果を確認して報告する:
   ```bash
   python scripts/hpb/db_put.py --verify --store <store> --month <YYYY-MM>
   ```

## 報告に含めること

- 取り込んだ月号とテーブルごとの件数
- 欠損・不整合として検算に引っかかった項目
- 続けて分析したい場合は `/hpb-analyze` を案内する
