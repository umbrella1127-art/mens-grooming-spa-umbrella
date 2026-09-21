# Threads検証 → 公式ブログ化パイプライン 運用ガイド

「リサーチ → 悩みキーワードを種ネタに → Threadsに1日3投稿 → 一番反応が良かったものだけ翌日ブログ化」を回す仕組み。
ブログは公式サイトの `posts`（`/blog`）に**下書き**で入り、Discordで承認すると公開される。

```
種ネタ(threads_topics) ─▶ 今日の3本(threads_trials) ─▶ 実測 ─▶ 勝者(priority=true)
                                                               └─▶ 翌日: 記事化 → posts(draft) → Discord承認 → 公開
```

## 構成

| 何 | どこ |
|---|---|
| テーブル | `0029_threads_pipeline.sql`（`threads_topics` / `threads_trials`）、`0030_threads_ops.sql`（`pipeline_issues`・名簿の性格・knowledge の source） |
| エージェント（人格・権限。薄い） | `.claude/agents/threads-*.md`：宮下 律(統括)／小野寺 遥(リサーチ)／榊原 慎(検証)／三浦 文乃(執筆)／大槻 護(点検)／篠田 環(知識整理) |
| 手順書（厚い） | `.claude/skills/threads-research` / `threads-validate` / `threads-blog-writing` / `threads-care` / `threads-library` |
| ルール | `.claude/skills/threads-blog-rules/SKILL.md`（全員が最初に読む）、ペルソナ `scripts/threads/persona.md` |
| 実行 | `/threads-run`（`research` `validate` `blog` `care` `library`） |
| 名簿 | `python scripts/threads/roster.py`（agent_roster。名前・年齢・性格） |
| 点検（ループB） | `python scripts/threads/health.py`（異常の候補）→ caretaker が `pipeline_issues` に記録・安全な修正・Discord報告 |
| 未投稿の見張り | `python scripts/threads/watch.py`（09:30/14:00/20:30。Claudeを呼ばない。未投稿を記録＋Discord通知、再投稿はしない） |
| 実行記録 | `run-job.ps1` が毎回 `agent_runs`（routine=`threads:<job>`）に1行残す（`run_log.py`） |
| 管理画面 | `/admin/kpi/threads`（在庫・今日の3本・反応・異常・実行記録・効いた型・名簿） |
| DB窓口 | `python scripts/threads/tdb.py`（`--context` で現状） |
| 禁止表現チェック | `python scripts/threads/check_article.py` |
| Threads API | `python scripts/threads/threads_api.py post-due / measure / refresh-token` |
| 記事の下書き保存 | `python scripts/threads/save_blog.py`（禁止表現チェック → posts → Discord承認依頼） |

実行はローカルPC（HPB基盤と同じ）。接続は `.env.local` の `HPB_DATABASE_URL`。

## 初回セットアップ

1. Supabase の SQL Editor で `0029_threads_pipeline.sql` と `0030_threads_ops.sql` を実行し、`python scripts/threads/roster.py` で名簿を入れる
2. `.env.local` の `DISCORD_CHANNEL_BLOG`（承認依頼の送り先）と `DISCORD_BOT_TOKEN` を確認（既存のブログ承認と同じ）
3. `python scripts/threads/tdb.py --context` がエラーなく表示されればOK
4. Claude Code で `/threads-run research` → 種ネタが入る
5. `/threads-run validate` → 今日の3本が draft で入る。`threads_api.py post-due`（dry-run）で内容を確認

この時点では Threads 未接続でも動く（実投稿と実測だけが動かない）。

## Threadsの接続（アカウント作成後）

1. Threads アカウントを開設（サロン公式。プロフィールは「月に一度、自分を整える。」の世界観で）
2. https://developers.facebook.com/ でアプリを作成 → ユースケース「Threads API にアクセス」
   - 権限: `threads_basic` / `threads_content_publish` / `threads_manage_insights`
3. アプリのロールでThreadsアカウントを「Threadsテスター」に追加し、Threads側で招待を承認
4. アクセストークン（短期）を発行 → 長期トークン（60日）に交換
   - `GET https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<APP_SECRET>&access_token=<短期トークン>`
5. `.env.local` に追記:
   ```
   THREADS_USER_ID=<ThreadsのユーザーID>
   THREADS_ACCESS_TOKEN=<長期トークン>
   ```
6. `python scripts/threads/threads_api.py post-due --live --slot 1` で1本だけ試験投稿
7. トークンは60日で失効。月1回 `python scripts/threads/threads_api.py refresh-token`（下のスケジュールに入れる）

## 毎日のスケジュール（Windowsタスクスケジューラ）

| 時刻 | コマンド | 内容 |
|---|---|---|
| 05:30 | `claude -p "/threads-run research"` | 在庫が9件未満なら種ネタを補充 |
| 06:00 | `claude -p "/threads-run validate"` | 前日の実測→勝者→今日の3本（draft） |
| 06:30 | `claude -p "/threads-run blog"` | 勝者の記事を下書き保存→Discord承認依頼 |
| 07:00 | `claude -p "/threads-run care"` | 点検：異常を記録、安全な範囲を修正、critical/warning があればDiscord |
| 日曜 07:30 | `claude -p "/threads-run library"` | 週次の知識整理：効いた型・外れた型を統合、週次まとめ |
| 08:00 | `python scripts/threads/threads_api.py post-due --slot 1 --live` | 1本目を投稿 |
| 12:30 | `... --slot 2 --live` | 2本目 |
| 19:00 | `... --slot 3 --live` | 3本目 |
| 4週間ごと | `python scripts/threads/threads_api.py refresh-token` | トークン更新 |

- 実測は投稿の翌日に取る（`measure` は既定で前日分）。表示が安定するのを待つため、朝6:00の実行が目安
- 実投稿の3本は決まった時間帯に投稿するので、絶対に手動で `--live` を連打しない（同じ slot は `posted` になると再投稿されない）

## 運用の原則

- **公開は必ず人が承認**。記事は `posts.status=draft` で入り、Discordの承認ボタン or `/admin/approvals` で公開される
- **勝者が居ない日は記事を書かない**（反応が無かったネタを記事にしない）
- 「勝者」は1日の中で相対的に一番。数字が小さい間（アカウント開設直後）は勝者の信頼性が低い。
  最初の2〜3週間は記事化前に内容を自分の目で確認する
- 反応スコア = likes×1 + replies×2 + reposts×3 + quotes×3 + shares×3。重みを変えたいときは `threads_api.py` の `WEIGHT`
- 絶対ルール（医療的断定・煽り・個室・電話・確定前の価格）は `check_article.py` が最低ラインで止める。
  機械で拾えない事実の捏造は、承認時に人が見る

## 自己改善の2つのループ

```
A 事業を良くする   種ネタ → 3投稿 → 実測 → 勝者 → 記事    ＋ 学びを knowledge（効いた型・外れた型）へ
B 自分自身を直す   ログ・DB → health.py → 異常の記録(pipeline_issues) → 安全な修正 → Discord報告
```
部品どうしは直接呼び合わず、DB（threads_*・knowledge・pipeline_issues・agent_runs）だけで連携する。
知識は `knowledge.source='threads'` の行だけを自動で書く。`source='manual'`（手入力）は自動では触らない。

## Discord通知（チャンネル分け）

種類ごとに既存のチャンネルへ振り分け、**末尾に必ずダッシュボードのURL**（`NEXT_PUBLIC_SITE_URL` + `/admin/kpi/threads`）を付ける。
記事の承認依頼には、承認画面（`/admin/approvals`）のURLも添える。実装は `scripts/threads/threads_notify.py`。

| 種類 | いつ届くか | 送り先チャンネル | `.env.local` の設定名 |
|---|---|---|---|
| 今日の3本 | 毎朝、検証のあと（06:00頃） | **#threads-下書き** | `DISCORD_CHANNEL_THREADS` |
| 投稿の結果 | 投稿のたび（8:00 / 12:30 / 19:00。成功・失敗とも） | **#threads-下書き** | 同上 |
| 点検・異常 | 毎朝7:00の点検、実行や投稿の失敗 | **#お知らせ** | `DISCORD_CHANNEL_NOTICE` |
| 週次の学び | 日曜の知識整理 | **#お知らせ** | 同上 |
| 記事の承認依頼（ボタン付き） | 勝者の記事ができたとき | **#blog-ネタ帳** | `DISCORD_CHANNEL_BLOG` |

将来チャンネルを分けたくなったら、`DISCORD_CHANNEL_THREADS_POST` / `_THREADS_CARE` / `_THREADS_LEARN` を `.env.local` に足すだけで、そちらが優先される。
送信内容の確認: `python scripts/threads/threads_notify.py plan --dry-run`（送らずに本文と送り先の設定名を表示）。
