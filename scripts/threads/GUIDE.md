# Threads検証 → 公式ブログ化パイプライン 運用ガイド

> **【2026-11-20〜 自動投稿は停止中（オーナー判断：効果が見合わないため）】**
> 止めているもの: 毎日3本の自動投稿（`post1`〜`post3`）と、今日の3本を作る毎朝の `validate`。タスクスケジューラ上は無効（Disabled）。
> `register-tasks.ps1` は登録後に再び無効化するので、再登録しても復活しない。
> 監視（`watchdog.py` の鮮度チェック・`health.py` の run_missing）も `threads:validate` を「走るはず」に数えない。
> **勝手に再開しない・タスクを有効化しない。** 再開はオーナーの明示の指示があったときだけ（その際は上記3か所を戻す）。
> 投稿は `/threads-batch`（人がネタを決め、AIが書き、井上さんの「投稿して」で出す）だけ。
> 続けているもの: リサーチ・アカウント数字の取り込み・ブログ化・点検・知識整理・井上さんメモの取り込み・トークン更新。

「リサーチ → 悩みキーワードを種ネタに → Threadsに1日3投稿 → 一番反応が良かったものだけ翌日ブログ化」を回す仕組み。
ブログは公式サイトの `posts`（`/blog`）に**下書き**で入り、Discordで承認すると公開される。
種ネタの最優先ソースは、井上さんがDiscord「#今日の店」に書く日々の記録（`threads_topics.source='owner'`）。
この由来の投稿だけは、自動投稿の前に井上さんの承認を待つ（他はすべて承認なしで自動投稿される）。

```
井上さんのメモ(#今日の店) ─▶ owner_notes ─▶ topics化 ─┐
                                                      ├─▶ 今日の3本(threads_trials) ─▶ 実測 ─▶ 勝者(priority=true)
種ネタ(threads_topics・通常のリサーチ由来)  ─────────┘         │                              └─▶ 翌日: 記事化 → posts(draft) → Discord承認 → 公開
                                                              └─▶ 井上さん由来だけ: 承認待ち(pending_approval) → 承認 → 自動投稿
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
| 未投稿・定期実行の欠けの見張り | `python scripts/threads/watch.py`（09:30/14:00/20:30。Claudeを呼ばない。①投稿時刻+1時間を過ぎても draft のまま（not_posted）②今日の朝の定期実行（improve〜care、日曜は library）が予定+30分を過ぎても `agent_runs` に無い（run_missing。PCにログオンしていない・停止した日に1日1件）を記録＋Discord通知。再投稿・工程の手動実行はしない。PC自体が止まっている間は走れないので、気づけるのはPCが戻って最初の見張りから） |
| 実行記録 | `run-job.ps1` が毎回 `agent_runs`（routine=`threads:<job>`）に1行残す（`run_log.py`） |
| 管理画面 | `/admin/kpi/threads`（在庫・今日の3本・反応・異常・実行記録・効いた型・名簿） |
| DB窓口 | `python scripts/threads/tdb.py`（`--context` で現状） |
| 井上さんの記録メモ | `scripts/threads/owner_notes.py`（`remind`=リマインド送信／`fetch`=取り込み／`request-approval`=承認依頼）。Discordチャンネルは `.env.local` の `DISCORD_CHANNEL_OWNER_NOTES` |
| 禁止表現チェック | `python scripts/threads/check_article.py` |
| Threads API | `python scripts/threads/threads_api.py post-due / measure / refresh-token` |
| 記事の下書き保存 | `python scripts/threads/save_blog.py`（禁止表現チェック → posts → Discord承認依頼） |

実行はローカルPC（HPB基盤と同じ）。接続は `.env.local` の `HPB_DATABASE_URL`。

## 初回セットアップ

1. Supabase の SQL Editor で `0029_threads_pipeline.sql` と `0030_threads_ops.sql` を実行し、`python scripts/threads/roster.py` で名簿を入れる
   （井上さんの記録メモを使うには `0039_owner_notes.sql` も実行し、Botの Message Content Intent をオンにする）
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
| 19:10（土日）／23:10（火・金） | `python scripts/threads/owner_notes.py remind` | 井上さんへ「#今日の店」への記録を促すリマインド。白紙で止まらないよう、`QUESTION_POOL`（12種）から毎回ランダムに3問選んで聞く（Claudeを呼ばない） |
| 05:25 | `python scripts/threads/owner_notes.py fetch` | 「#今日の店」の新着メモを取り込み（Claudeを呼ばない） |
| 05:30 | `claude -p "/threads-run research"` | 井上さんのメモを種ネタ化（毎回）＋在庫が9件未満ならWeb検索で補充 |
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

### ログオン不要で動かす（S4U）の検証メモ（2026-10-19）

現在の全タスクは「ログオン中のみ実行（Interactive）」。PCが再起動して誰もログオンしないと、朝の工程は走らない（2026-10-18の事故）。
`register-tasks.ps1 -S4U` で「ログオンの有無にかかわらず実行・パスワード不要（S4U）」に変えられる。**全タスクへ広げる前に、1タスクだけで確かめる**:

1. **管理者として実行した PowerShell で** `pwsh -File scripts/threads/schedule/s4u-verify.ps1`（通常権限だと S4U の登録が「アクセスが拒否されました」になる＝2026-10-21に確認）… テスト用タスク `mensumbrella-threads-s4utest` をS4Uで登録→手動実行→結果表示。
   中身は `s4u-check.ps1`（副作用なし）: セッションID（0＝ログオフ中と同じ条件）・python/claude/git が見つかるか・.env.local・
   DB接続（watch.py --dry-run）・Threads/Discord/Anthropic への到達・`claude -p`・logs への書き込み。終わったら `-Cleanup` で削除
2. 見るのは次の4つ: ①`session id` が 0 ②python/claude が見つかる（見つからなければ run-job.ps1 の PATH 補完が効く）
   ③`claude -p` が答える（ログイン情報がS4Uから読めるか） ④ DB・HTTPS が通る
3. 全部OKなら、本番は1つずつ `register-tasks.ps1 -Only <名前> -S4U` で切り替える（まず account → watch → 他）。
   戻すときは `-Only <名前>`（-S4U なし）。S4Uでもスリープ中は走らない（StartWhenAvailable で復帰後に追いかける）
4. watch にはログオン3分後のトリガーも付けた（`register-tasks.ps1` の `$logonWatch`）。停止・ログオン遅れのあとでも、戻った直後に
   「朝の工程が動いていない（最後の記録→再開、止まっていた時間）」を拾う

**検証結果（2026-10-21 06:56、管理者PowerShellで実行）**: LastTaskResult=0。session id 0（ログオフ中と同条件）で、python/claude/git が見つかり、
.env.local 読込・DB接続(watch.py --dry-run)・Discord到達・`claude -p`(応答7)・git・logs書き込みがすべて通った。S4Uは使える。
切り替え・削除（Unregister）にも管理者権限が必要。

S4Uの制約: ネットワーク資格情報・DPAPI・資格情報マネージャ・暗号化ファイル（EFS）は使えない。リポジトリはOneDrive配下のため、
ファイルが「オンラインのみ」に退避されるとログオン前（OneDrive未起動）は読めない可能性がある（フォルダを「常にこのデバイスに保持」にしておく）。

## 運用の原則

- **公開は必ず人が承認**。記事は `posts.status=draft` で入り、Discordの承認ボタン or `/admin/approvals` で公開される
- **勝者が居ない日は記事を書かない**（反応が無かったネタを記事にしない）
- 「勝者」は1日の中で相対的に一番。数字が小さい間（アカウント開設直後）は勝者の信頼性が低い。
  最初の2〜3週間は記事化前に内容を自分の目で確認する
- 反応スコア = likes×1 + replies×2 + reposts×3 + quotes×3 + shares×3。重みを変えたいときは `threads_api.py` の `WEIGHT`
- 絶対ルール（医療的断定・煽り・個室・電話・確定前の価格）は `check_article.py` が最低ラインで止める。
  機械で拾えない事実の捏造は、承認時に人が見る

## 投稿の形式（一言／標準／長文）

1日3本を毎回同じ長さ・同じ構造で書くと、読み手に「また同じ型だ」と思われ、AIっぽさも抜けない。
そこで `threads_trials.format` で形式を分け、3本の中で混ぜる（`0041_threads_format.sql`）。

| `format` | 字数 | 中身 |
|---|---|---|
| `short`（一言） | 〜40字 | 言い切りでも問いでもよい。気づき・情景を1つだけ。宣伝にしない |
| `standard`（標準） | 80〜200字 | これまでの長さ。2026-10-16 までの57本はすべてこの形式 |
| `long`（長文） | 350〜500字（Threadsの上限は500字） | 出来事→気づき→読者への一言、のように1本の中に起伏を入れる |

- 組み合わせは「標準2＋一言1」か「標準1＋一言1＋長文1」。同じ形式を3本続けない。長文は週に2〜3本
- どの形式を何本にするかは検証担当が毎朝 `tdb.py --context` の「形式別の表示」「直近3日の形式の並び」を見て決める
  （手順は `.claude/skills/threads-validate/SKILL.md` の C-1）
- **判定は形式で分けない**。`judge.py` は形式に関係なく「前7日間の投稿の平均」と比べる。形式ごとの効きは集計（`--context`、`/admin/kpi/threads`）で見る
- 絶対ルール（医療的断定・煽り・事実の捏造・価格・電話番号・限定表現）は形式に関係なく同じ。一言でも `check_article.py` を通す

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
| 記録リマインド | 火・金23:10／土日19:10 | **#今日の店** | `DISCORD_CHANNEL_OWNER_NOTES` |
| 井上さんのメモから作った投稿の承認依頼（ボタン付き） | 検証工程がメモを使ったとき | **#threads-下書き** | `DISCORD_CHANNEL_THREADS`（承認は `/admin/approvals` からも可） |

将来チャンネルを分けたくなったら、`DISCORD_CHANNEL_THREADS_POST` / `_THREADS_CARE` / `_THREADS_LEARN` を `.env.local` に足すだけで、そちらが優先される。
送信内容の確認: `python scripts/threads/threads_notify.py plan --dry-run`（送らずに本文と送り先の設定名を表示）。
