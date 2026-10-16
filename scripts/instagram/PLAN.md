# Instagram を「新規集客につながる発信」にする設計（設計・検証のみ。実装は未着手）

作成 2026-10-16。対象アカウント @umbrella_men_salon（2026-09-27時点でフォロワー23人・投稿は文字入り画像の広告風・
プロフィールのリンクが `umbrella-no9.net/mens` でサイトと別ドメイン）。
目的はフォロワーでも「いいね」でもなく、**前橋・群馬の35〜50代男性の新規予約**。導線は
「Instagram プロフィール → サイト → LINE」で固定し、この導線の数字だけを見る。

このページで決めてほしいこと（§7 の比較表）: **①世界観をどれにするか ②画像の作り方 ③投稿経路の進め方**。

---

## 1. 世界観（3案 → 推奨は A）

共通の前提（`scripts/threads/persona.md` の「高級メンズサロンへの警戒感」と同じ）:
「高級」「上質」「特別」を**文章で言わない**。高級感は写真の静けさと余白で伝え、文章は「必要性」だけを言う。
「意識高い人向け？」「若い人向け？」「高そう」と思われた瞬間に 47歳の高橋健一は離れる。

| | A. 閉店後の静けさ（推奨） | B. 手元と道具 | C. 前橋の夜・仕事帰り |
|---|---|---|---|
| 被写体 | 営業前後の店内。椅子1脚、畳んだタオル、消しかけの照明、窓の外の暗さ。人は写らないか、井上さんの後ろ姿だけ | シェービングの泡と刷毛、蒸しタオル、オイルの瓶、ヘッドスパの手元。寄りの写真 | 店の看板と駐車場の夜、小相木町の道、車のテールランプ、23時の時計 |
| 伝わること | 「ここは静かに整えて帰る場所」。女性客や会話の圧が無い、男性だけの空間（※「個室」とは書かない。個室は無い） | 「ちゃんと手で整えてもらえる」。理容室であることが一目で分かる | 「仕事帰りに寄れる」。火・金23時までが写真で伝わる |
| 撮影の負担 | 低。営業前後に店内でスマホ1台。天候・人の都合に左右されない | 中。片手で撮るか三脚が要る。施術中は撮れない（お客様が写る） | 高。夜の屋外、天候次第、写り込みの配慮。ネタが尽きやすい |
| 色調 | 低彩度・暗め・暖色（電球色）。黒つぶれを残す | 暖色寄りだが明るめ。白（泡・タオル）が主役 | 寒色の夜に暖色の看板。コントラスト強め |
| 弱点 | 「何の店か」が1枚では伝わりにくい → 文字1フレーズと B の写真を3〜4枚に1枚混ぜて補う | 寄りばかりだと「技術自慢」に見え、警戒感側に倒れる | サロンの中身が伝わらない。前橋以外の人には響かない |

**推奨: A を主軸、B を4枚に1枚**。理由は3つ。(1) 井上さん一人（スタッフ無し）で営業前後に撮り続けられる。(2) 既に
Discord「#今日の店」の写真が `owner_notes.image_urls` に貯まる仕組みがあり、素材の供給が止まらない。(3) 「高級を言わずに見せる」
という方針に、静けさと余白が一番合う。C は季節イベント（年末・夏の夜）に単発で使う。

### 共通の型（どの案でも固定）

- **比率 4:5（1080×1350）で固定**。フィードで最も大きく表示され、Instagram API の許容範囲（4:5〜1.91:1）の端にあたる。1:1 は使わない
- **余白**: 写真を全面に敷き、文字は下から 8%・左から 8% の位置に左寄せ。上 1/3 は文字を置かない（アプリのUIと重なる）
- **文字は1フレーズ**（15文字以内）。書体はサイトと同じ **Shippori Mincho**（`app/layout.tsx` で使用中）。白・不透明度 85%・サイズは画像幅の 4.5%。
  ロゴは入れない（入れるなら右上に小さな "umbrella" のみ）。フレーズの例: 「月に一度、自分を整える。」「仕事帰りに、23時まで。」「何も話さなくていい時間。」
- **キャプション**: 3〜5行。1行目はフレーズの続き、2〜4行目は「なぜ必要か」を Threads と同じ声（サロン公式・共感型・説教しない）で、
  最後は「ご予約・ご相談はプロフィールのLINEから」。URLは書かない（キャプション内は押せない）。ハッシュタグは5個以内で
  `scripts/threads/tags.md` の候補と「#前橋」「#前橋理容室」から選ぶ。禁止語も同じ表（「メンズエステ」「個室」「薄毛改善」など）
- **頻度: 週2〜3**。投稿時刻は **火・金 21:00**（仕事帰りの時間帯＝23時まで営業している実感と重なる）と **日 10:00**。ストーリーズは当面やらない
- **禁止**: お客様の顔・ビフォーアフター・統計の数字・価格（確定3種以外）・電話番号・「今だけ」「限定」。設備や実績はサイト資料
  （`lib/fallback-data.ts` / `supabase/seed.sql`）に無いものを写真にも文字にも足さない

### Threads と内容を揃える方針

同じ日に、同じテーマを「別の形」で出す。

- **基本**: 前日の Threads 勝者（`threads_topics.priority=true`、`threads_trials.is_winner`）のテーマを、翌日の Instagram 1枚にする。
  フレーズは勝った投稿の `hook`、キャプションは勝った本文を短く言い換える。反応が確認できたテーマだけが Instagram に出る
- **例外**: 井上さんのメモ由来（`threads_topics.source='owner'`）で写真つきのものは、Threads と同じ日に出してよい（鮮度が価値）
- 勝者が出ない日が続くときは無理に出さない（週2本を下回ってよい）。`/threads-run blog` の「勝者が居ない日は書かない」と同じ考え方

---

## 2. 画像の作り方（A 実写＋テンプレ を主、B 生成AI は当面使わない）

### A. 井上さんの実写 ＋ テンプレートで文字入れ → JPEG

- 素材: `owner_notes.image_urls`（Discord「#今日の店」→ `scripts/threads/owner_notes.py fetch` が Supabase Storage `site-images/owner-notes/` に再ホスト済み）。
  足りなければ、井上さんに「営業前後に店内を3枚」を週1でリマインドに足す（`owner_notes.py remind` の `QUESTION_POOL` に写真の問いを1つ加える程度）
- 文字入れの道具は2択。**Pillow を推奨**（このPCに導入済み。Python 3.13 で `PIL` が import できることを確認。Playwright は Python/Node とも未導入）

| | Pillow（推奨） | HTML テンプレ ＋ Playwright |
|---|---|---|
| 再現性 | 高い。座標と書体を数値で固定 | 高い。CSS で指定 |
| 導入 | 済み。Shippori Mincho の TTF（Google Fonts, OFL）を `scripts/instagram/fonts/` に置くだけ | Chromium のダウンロード（約150MB）と `playwright install` が要る |
| 表現力 | グラデーション・影・縦書きは自前実装 | CSS で何でも。縦書きも `writing-mode` で済む |
| 向き | 「写真＋1フレーズ」の固定フォーマット | 文字量が多い・レイアウトを頻繁に変える場合 |

- 出力: 1080×1350・sRGB・JPEG 品質 88（1枚 300〜600KB。上限 8MB に余裕）。写真は中央トリミングで 4:5 に合わせ、下 40% に黒の
  グラデーション（不透明度 0→45%）を敷いてから文字を乗せる（低彩度・暗めの色調に揃う副作用もある）
- 保存先: `site-images/instagram/YYYYMMDD-<slug>.jpg`（公開バケット。`owner_notes._upload_image` と同じ service role での直接 PUT）。
  Instagram API は「公開URLから cURL で取得」するので、この公開URLがそのまま使える

### B. Gemini API の画像生成（公式ページで確認した事実）

| 確認項目 | 事実（2026-10-16 取得） | 出典 |
|---|---|---|
| 無料枠で画像生成できるか | **できない**。料金表の Free Tier 列は、画像モデル（`gemini-nano-banana-2.1` / `gemini-3.1-flash-lite-image` / `gemini-3.1-flash-image` / `gemini-3-pro-image` / `gemini-2.5-flash-image`）すべて「Not available」。テキストモデル（Gemini 2.5 Flash 等）だけ「Free of charge」 | https://ai.google.dev/gemini-api/docs/pricing |
| 必要な課金段階 | Tier 1。「Set up and link an active billing account」が条件。無料→有料は AI Studio で請求先を設定して移行する。レート制限の公開ページには無料枠の表が無く、実際の上限は AI Studio の画面で見る | https://ai.google.dev/gemini-api/docs/rate-limits |
| 1枚あたりの料金（Standard） | `gemini-nano-banana-2.1`: $0.0336（1K）/ $0.0504（2K）／ `gemini-3.1-flash-lite-image`: $0.0336（1Kのみ）／ `gemini-3-pro-image`: $0.134（1K/2K）。Batch なら半額。1ドル150円なら **1枚約5円**（Lite/2.1）。週3枚×候補3案でも月200円未満 | 同 pricing |
| モデルの現状 | `gemini-2.5-flash-image` は非推奨で **2026-10-02 に提供終了**（もう使えない）。Imagen は「shut down and no longer available in the Gemini API」。現行の推奨は Nano Banana 2.1 | https://ai.google.dev/gemini-api/docs/image-generation ／ https://ai.google.dev/gemini-api/docs/imagen |
| 生成画像の性質 | 「All generated images include a SynthID watermark」（不可視の電子透かし）。比率は 4:5 を含む10種、解像度 1K/2K/4K | 同 image-generation |
| 無料枠の条件 | 「Content used to improve our products」（無料枠の入力・出力は Google の製品改善に使われる）。有料は使われない | 同 pricing |

**懸念（世界観に対して）**
1. **店舗の事実を捏造する**: 生成した「店内」には存在しない個室・設備・広さが写る。AGENTS.md の「店舗の事実を捏造しない」に写真で抵触する。
   実在の店に見える絵は、文章で「個室」と書くのと同じ
2. **AI感が警戒感を強める**: ターゲットは「営業・化粧品を買わされそう」と疑っている層。均質にきれいな AI 画像は広告に見え、
   今の「文字入り画像の広告風」投稿と同じ印象に戻る。A の実写が持つ「本当にある店の、本当の静けさ」が最大の資産
3. **AI ラベル**: SynthID は不可視だが、Meta は AI 生成の信号を検出して「AI情報」ラベルを付ける方針を公表している。SynthID 付きの画像が
   ラベル対象になるかは未確認。ラベルが付けば 2 の懸念が確定する

**結論**: 当面は **A のみ**。B は使うとしても「写真が無い週の、抽象的な背景（紙・布・光のテクスチャ）」に限り、
店・人・道具・街は生成しない。使う場合は課金リンクが前提で、1枚約5円。実写の補正（明るさ・トリミング）は Pillow で足りる。

---

## 3. 投稿の経路（Instagram API の要件。公式で確認）

| 要件 | 事実 | 出典 |
|---|---|---|
| アカウント種別 | **プロアカウント（ビジネス or クリエイター）**が必要。「An Instagram professional account can be for a business or creator」 | https://developers.facebook.com/docs/instagram-platform/overview |
| Facebook ページ | **「Instagram API with Instagram Login」なら不要**。「This API setup does not require a Facebook Page to be linked」。Facebook Login 版はページ必須 | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login |
| 権限 | Instagram Login 版: `instagram_business_basic` ＋ `instagram_business_content_publish`（計測に `instagram_business_manage_insights`）。Facebook Login 版: `instagram_basic` ＋ `instagram_content_publish` ＋ `pages_read_engagement` | https://developers.facebook.com/docs/instagram-platform/content-publishing |
| App Review | **自分の店のアカウントだけなら不要**。Standard Access は「アプリで役割を付与されている人だけが使うアプリ」向けで、ビジネス/消費者アプリの全権限に自動承認。Advanced Access（他人のアカウントを扱う）だけ App Review とビジネス認証が要る。Instagram の文書も「Standard Access if your app serves Instagram professional accounts you own or manage」 | https://developers.facebook.com/docs/graph-api/overview/access-levels ／ https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login |
| 画像の渡し方 | **公開URL**。「We will cURL the image using the URL that you specify so the image must be on a public server」。仕様: JPEG のみ・8MB以下・比率 4:5〜1.91:1・幅 320〜1440px・sRGB | https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/ ／ 同 content-publishing |
| 投稿手順 | 2段階。`POST /<IG_ID>/media`（image_url, caption）→ `POST /<IG_ID>/media_publish`（creation_id）。状態は `GET /<CONTAINER_ID>?fields=status_code` を1分おき最大5分 | 同 content-publishing |
| 上限 | **24時間（移動窓）で API 投稿 100件**。同じページのカルーセル節は 50件と書いており不整合。実値は `GET /<IG_ID>/content_publishing_limit` で確認。週3本なら無関係 | 同 content-publishing |
| トークン | 長期トークンは **60日**。`GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token` で延長（24時間以上経過・未失効が条件）。「Tokens that have not been refreshed in 60 days will expire and can no longer be refreshed」 | 同 business-login |
| 計測 API | `instagram_business_manage_insights`。「Some metrics are not available on Instagram accounts with fewer than 100 followers」。**現在23人**なので当面はアプリの画面で手作業 | https://developers.facebook.com/docs/instagram-platform/insights/ |

### Threads と同じ Meta アプリで足りるか

- Meta の仕様: 1つのアプリに**互換性のあるユースケースなら複数追加できる**（「You can add multiple use cases to a single app, provided they are compatible with each other」。後から追加も可、削除は不可）。
  https://developers.facebook.com/docs/development/create-an-app/
- ただし「Threads API」ユースケースと「Instagram」ユースケースが互換かは文書に無い。**判定は App Dashboard で、既存の Threads アプリに
  ユースケースを追加しようとして Instagram がグレーアウトしていないかを見るだけ**（5分）。
- 互換でなくても困らない。Instagram 用に Meta アプリをもう1つ作る（無料・審査不要）。トークンと ID は別環境変数
  （`INSTAGRAM_USER_ID` / `INSTAGRAM_ACCESS_TOKEN`）にするので、コード側はどちらでも同じ
- Threads アプリは「2つのアプリIDとシークレット」を持つ（Threads 用と Meta 用）。Instagram に使うのは Meta 側の ID（公式 get-started の記述）

### 段階案（推奨）

| 段階 | いつ | やること | 人の作業 |
|---|---|---|---|
| 0 準備 | 今週 | IG をビジネスアカウントに。プロフィール名から「メンズエステ」を外す（Threads と同じ問題）。**リンクを UTM 付きのサイトURLに差し替え**（§5）。世界観を決め、Shippori Mincho の TTF を置く | 井上さん: アカウント設定 15分 |
| 1 半自動（手動投稿） | 2〜4週 | スクリプトが「画像＋キャプション」を作り、Discord に承認依頼（画像はそのまま表示される）。承認後、**井上さんがスマホで保存して Instagram アプリから投稿**。投稿したら Discord のボタンで「投稿済み」 | 1本 3分 × 週2〜3 |
| 2 API 自動投稿 | 段階1で週2本が4週続いたら | Instagram Login で長期トークン取得 → `instagram_api.py post-due` を火・金 21:00／日 10:00 にタスク登録。承認済みだけ投稿。4週ごとに refresh-token | 承認のボタンだけ |
| 3 計測の自動化 | フォロワー100人超、または段階2が安定したら | `instagram_api.py account-daily` で reach / profile_views / website_clicks / follower_count を `channel_metrics(instagram)` へ。Threads の `account-daily` と同じ形 | なし |

段階1を飛ばさない理由: 世界観が本当に続けられるか（写真が供給されるか）は、API より先に分かる。投稿した実物を見て
文字位置や色調を直す期間でもある。

---

## 4. 承認と DB（既存の content_drafts ＋ Discord ボタンに乗せる）

既存の仕組み: `content_drafts(channel_type, content_text, status, trial_id, post_id, discord_*)` に行を入れ、Discord のボタン
（`approve:<id>` / `reject:<id>`）か `/admin/approvals` で `status` を変える。ブログは `post_id`、Threads は `trial_id` で台帳に反映する
（`app/api/discord/interactions/route.ts`・`app/admin/actions/drafts.ts`）。

### 変更案（マイグレーションは未作成。列案だけ）

1. `content_drafts.channel_type` の check 制約に `'instagram'` を追加（現在 `threads|blog|gbp`）
2. 新テーブル `instagram_posts`（Threads の `threads_trials` と同じ役割の台帳）

| 列 | 型 | 意味 |
|---|---|---|
| id | bigint identity | |
| scheduled_for | timestamptz | 予定時刻（火・金21:00／日10:00） |
| topic_id | bigint → threads_topics | 元のテーマ（Threads 勝者と揃える） |
| trial_id | bigint → threads_trials | 元の勝者投稿（無ければ null） |
| owner_note_id | bigint → owner_notes | 写真の出所 |
| phrase | text | 画像に入れる1フレーズ（15文字以内。DB で長さ制約） |
| caption | text | キャプション本文（ハッシュタグ込み。2,200字以内） |
| image_url | text | 文字入れ後の公開URL（`site-images/instagram/...jpg`） |
| source_image_url | text | 元写真のURL |
| image_source | text | `owner_photo` / `template_only` / `ai_background`（check） |
| status | text | `draft` / `pending_approval` / `approved` / `posted` / `failed` / `skipped`（check） |
| ig_media_id, permalink, posted_at | text, text, timestamptz | 投稿後に埋める（手動投稿のときは permalink だけ人が貼ってもよい） |
| predicted_note | text | 「なぜこの写真とフレーズか」（振り返り用。Threads の predicted_note と同じ思想） |
| created_at | timestamptz | |

3. `content_drafts.instagram_post_id bigint references instagram_posts(id)` を追加。承認処理の分岐を1つ足す:
   `updated.instagram_post_id` があれば `instagram_posts.status` を `approved`（却下なら `skipped`）にする。段階2では `post-due` が `approved` だけ投稿する
4. 画面側: `lib/admin/board.ts` の `ChannelType` と `CHANNEL_LABEL` に `instagram`、`app/admin/approvals/page.tsx` の `CHANNEL_NOTE` に
   「承認後、画像を保存して Instagram アプリから投稿してください（段階1）」。画像は `image_url` を `<img>` で見せる
5. Discord: 承認依頼メッセージに `embeds: [{ image: { url } }]` を付けて画像をそのまま表示。送り先は新設の `DISCORD_CHANNEL_INSTAGRAM`
   （未設定なら `DISCORD_CHANNEL_THREADS` → `DISCORD_CHANNEL_NOTICE` の順。`threads_notify.py` の流儀と同じ）。
   段階1では「投稿済み」ボタン（`posted:<id>`）を1つ足し、route.ts で `instagram_posts.status='posted'` にする
6. 禁止表現チェックは `scripts/threads/check_article.py --text` を phrase と caption の両方に通す（新しいチェッカーは作らない）

毎日の流れ（段階1）: 06:30 の `blog` 工程のあとに `instagram` 工程を1つ足す → 勝者（または井上さん写真）から `instagram_posts` を draft で1件作る →
画像生成 → `pending_approval` ＋ Discord 承認依頼 → 井上さんが投稿 → 「投稿済み」。勝者も写真も無い日は何も作らない。

---

## 5. 測り方（何を「新規集客」の指標にするか）

### 指標の定義（上から順に重い）

1. **Instagram 経由の LINE クリック数**（最重要。サイトの最重要KPI `line_click` と同じもの）
2. Instagram 経由のサイト訪問数（セッション）と、訪問あたりの LINE クリック率
3. 初回カウンセリングで「何で知りましたか」→ Instagram と答えた新規客の人数（HPB と同じく月1で手入力。`channel_metrics(instagram, new_customers)`）
4. 参考: プロフィールのリンクタップ（Instagram インサイト）、リーチ、フォロワー増減

### GA4 で追えるか（コードを見た結果）

- `line_click` は `components/analytics/LineCtaLink.tsx` が page / section / cta_type 付きで送っている。GA4 Data API では
  イベントにセッション単位の `sessionSource` / `sessionDefaultChannelGroup` を組み合わせられるので、**「Instagram から来たセッションの line_click」は取れる**
- ただし今のコードは流入元を保存していない。`lib/admin/ga4.ts` は `sessionDefaultChannelGroup` 別のセッション数だけ（Organic Social に Threads と
  Instagram が混ざる）。`scripts/site/ga4-daily.mjs` → `site_metrics_daily` は「日×ページ」だけ
- GA4 の既定チャネルは「ソースがソーシャルサイトの一覧に一致」か「メディアが social 等」で Organic Social になる
  （https://support.google.com/analytics/answer/9756891 ）。Instagram アプリ内ブラウザからの流入はソースが `l.instagram.com` や `instagram.com` になり、
  一覧に入っていれば Organic Social、入っていなければ Referral に落ちる。**どちらにしても Threads（`l.threads.com` 等）と区別するには UTM が確実**

### 必要な手当て（小さい。実装時にやる）

1. **プロフィールのリンクを `https://<サイト>/?utm_source=instagram&utm_medium=social&utm_campaign=profile` にする**。
   これで `sessionSource=instagram`、チャネルは Organic Social。Threads のプロフィールリンクも `utm_source=threads` に揃えると両方が分かれる
   （現在の IG リンク `umbrella-no9.net/mens` は別ドメインなので、これを変えない限り GA4 では何も見えない）
2. `scripts/site/ga4-daily.mjs` にレポートを2本足す: `date × sessionSource` の sessions と、同じ軸で `line_click` の eventCount。
   `site_metrics_daily` には年齢帯と同じ流儀で `page='(src:instagram)'` / `'(src:threads)'` として保存する（**スキーマ変更なし**）。
   `scripts/site/daily.py rollup_months` で月合計を `channel_metrics(instagram, sessions / line_click)` に入れる
3. `/admin/kpi` の集客KPIハブに「Instagram」列（sessions・line_click・new_customers・followers）。`lib/admin/ga4.ts` にも
   `sessionSource` 別の line_click を1レポート足す
4. 投稿の個別の反応（いいね・保存・リーチ）は段階1では見ない。見るのは週次の「IG経由セッション」と「IG経由 line_click」だけ。
   数が少ないうち（前後合計で LINE クリック10件未満）は勝ち負けを付けない。サイト改善ループの原則と同じ

### 判断の目安

8週間（段階1の4週＋段階2の4週）で、IG 経由の LINE クリックが**月に数件でも継続して出る**なら続行し API 化と計測自動化に進む。
ゼロが続くなら、世界観ではなくプロフィール文とリンク（導線）を先に疑う。フォロワー数は判断材料にしない。

---

## 6. 守ること（既存ルールの Instagram への当てはめ）

- 医療的断定・煽り・限定表現・電話番号・確定外の価格・ホットペッパー・「個室」は、画像の文字・キャプション・ハッシュタグ・プロフィール文の**全部**で禁止
- お客様が写る写真は使わない（後ろ姿でも本人の了承が無いものは不可）。ビフォーアフターは出さない
- 実売上・掲載料などの数字は使わない（AGENTS.md の KPI 基盤と同じ扱い）
- 生成AIを使った画像は `image_source='ai_background'` を必ず残し、店・人・道具・街を描かせない

---

## 7. 決めてほしいこと（比較表）

| 決めること | 案 | 推奨 | 理由 |
|---|---|---|---|
| 世界観 | A 閉店後の静けさ ／ B 手元と道具 ／ C 前橋の夜 | **A（B を4枚に1枚）** | 一人で営業前後に撮り続けられる。既に写真が貯まる仕組みがある。高級を言わずに見せられる |
| 画像の作り方 | A 実写＋Pillow ／ A' 実写＋Playwright ／ B Gemini 生成 | **A（Pillow）** | 導入済み・再現性が高い・AI感が出ない。Gemini は無料枠が無く（Tier 1＝課金リンク必須、1枚約5円）、店の事実を捏造する危険がある |
| 投稿経路 | 段階1 手動投稿から ／ いきなり API | **段階1から** | 続けられるかを先に確かめる。API は Instagram Login 版なら Facebook ページ不要・審査不要で、後からでも1日で足せる |
| Meta アプリ | Threads と同じアプリに追加 ／ 別アプリ | **ダッシュボードで互換なら同じ、ダメなら別** | どちらでもコードは同じ。確認は5分 |
| 計測 | UTM＋GA4 の流入元 ／ Instagram インサイトのみ | **UTM＋GA4** | LINE クリックまで追えるのは GA4 だけ。インサイトはフォロワー100人未満で一部取れない |
| 頻度・時刻 | 週2〜3（火・金21:00／日10:00） ／ 毎日 | **週2〜3** | 勝者が出た日だけ出す。毎日は素材が尽きて世界観が崩れる |

---

## 付録: 確認できなかったこと（実装前に見る）

- Threads アプリに Instagram ユースケースを追加できるか（App Dashboard で確認）
- Instagram Login 版の長期トークンの**初回取得**が、開発者本人（アプリの役割あり）なら Live モード不要で通るか（Threads と同じ手順のはずだが未実測）
- SynthID 付き画像に Meta が「AI情報」ラベルを付けるか（B を使うときだけ関係する）
- API 投稿上限の 100 と 50 の不整合（`content_publishing_limit` で実値を見る。週3本なら影響なし）
- GA4 のソーシャルサイト一覧に `l.instagram.com` が含まれるか（UTM を付ければ関係なくなる）

関連ファイル: `scripts/threads/GUIDE.md`（Threads の運用。Instagram も同じ型で足す）／ `scripts/threads/owner_notes.py`（写真の供給）／
`scripts/threads/threads_api.py`（`publish_text` の IMAGE 分岐が Instagram の2段階投稿とほぼ同形）／ `lib/admin/board.ts`・`app/admin/approvals/page.tsx`（承認画面）／
`lib/admin/ga4.ts`・`scripts/site/ga4-daily.mjs`・`scripts/site/daily.py`（計測）
