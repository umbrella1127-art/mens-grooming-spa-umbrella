---
name: error-fix
description: 監視が自動修復できなかった異常（pipeline_issues channel='system'）を調べて直す手順。error-fixer 専用。コード変更は承認制、人の確認はDiscordとダッシュボード（/admin/errors）で通知する。
---

# エラー修復の手順

全体像: **watchdog.py（2時間おき・Claude不要）が見つける → 決まった修復は自動 → 残りを error-fixer（毎日1回）が調べる → 直せないものは人へ**。

## 自動で直してよい範囲（watchdog.py の RUNBOOK。これ以上は広げない）
- Windowsタスクの起動方式が wscript 経由で失敗 → pwsh 直接起動に戻す
- 何度走らせても同じ結果になるジョブ（`SAFE_RERUN`）の再実行・取り込み直し（GA4日次など）

## error-fixer がやること
1. `issues.py queue` → `show <id>` → `note <id>`
2. 原因を `logs_for` が出すログ・`agent_runs.detail`・関連スクリプトから特定する。
   よくある原因: 環境変数の欠落／トークン期限切れ（`refresh-token`）／API仕様変更／claude の権限拒否（`--allowedTools` に無い）／
   Windowsのログオン状態（S4U・Interactive）／パスの文字化け
3. 仕分け（agents/error-fixer.md の表）に従って実行。**コード変更は draft（承認制）、環境の書き換えは人**。
4. 直したら成功を確認 → `issues.py resolve <id> "直した内容と確認方法"`。直せなければ `escalate`。

## 通知
- 解決は `resolve`、要確認は `escalate` がDiscord（点検用チャンネル）に送る。ダッシュボードは `/admin/errors`。
- 同じ件を連投しない（`note` で着手の印、24時間は再拾いしない）。

## 自律の度合い（オーナーの判断で変える。ここでは変えない）
今は「決まった環境修復＝自動、コード変更＝承認制」。承認制を外す判断は `improve.py` の `AUTO_APPLY` を通じてオーナーだけが行う。
