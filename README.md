# MEN'S GROOMING SPA umbrella — 公式サイト

群馬県前橋市の男性専用グルーミングサロンのWebサイト＋CMS＋計測基盤。

- 公開サイト: 全17ページ（TOP・初めての方へ・各メニュー・ギフト・井上について・MEMBERSHIP・FAQ・BLOG・ACCESS・予約案内）
- 管理画面 `/admin`: キャッチコピー・CTA・LINE URL・営業時間・メニュー価格・FAQ・ブログ・写真をオーナー自身が編集可能。保存すると数秒でサイトに反映
- 計測: GA4（最重要KPI = LINEクリック `line_click`）

## 開発

```bash
npm install
npm run dev
```

Supabase未設定でも `lib/fallback-data.ts` の内容でサイトは表示されます（管理画面はログイン不可）。

## セットアップ手順（本番公開まで）

### 1. Supabase

1. https://supabase.com で新規プロジェクト作成（リージョン: Tokyo）
2. SQL Editor で `supabase/migrations/0001_init.sql` → `supabase/seed.sql` の順に実行
3. Authentication → Sign In / Up → 「Allow new users to sign up」を**オフ**
4. Authentication → Users → 「Add user」でオーナーのメールアドレス＋パスワードを作成（Auto Confirm）
5. Project Settings → API から URL と anon key を取得し `.env.local` に設定（`.env.local.example` 参照）

### 2. 画像の本番投入

開発初期は `public/images/`（既存サイトから流用）を参照。本番では管理画面の「写真」から
アップロードすると Supabase Storage に切り替わります。

### 3. GA4

1. https://analytics.google.com でプロパティ作成 → 測定ID（G-XXXX）を `NEXT_PUBLIC_GA_ID` に設定
2. GA4 管理 → データの表示 → カスタム定義 で以下をイベントスコープのカスタムディメンションとして登録:
   `page` / `section` / `cta_type` / `menu` / `position`
3. 管理 → イベント → `line_click` を**キーイベント**に設定
4. 動作確認は GA4 の DebugView（開発中はブラウザ拡張 Google Analytics Debugger を使用）

### 4. Vercel デプロイ

1. GitHub リポジトリへ push → Vercel で Import
2. 環境変数（Production / Preview 両方）: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_SITE_URL`
3. まず `*.vercel.app` の確認用URLで検収

### 5. 独自ドメイン（umbrella1127.com のサブドメイン）

1. Vercel → プロジェクト → Settings → Domains → `mens.umbrella1127.com` を追加
2. ドメインのDNS設定に CNAME レコードを追加: `mens` → `cname.vercel-dns.com`
3. `NEXT_PUBLIC_SITE_URL` を `https://mens.umbrella1127.com` に更新して再デプロイ

### 6. Search Console

1. https://search.google.com/search-console で `mens.umbrella1127.com` をURLプレフィックスで登録
2. サイトマップ `https://mens.umbrella1127.com/sitemap.xml` を送信

## 運用メモ

- **Supabase無料枠は7日間非アクティブで一時停止**します。サイト表示はキャッシュで動き続けますが、管理画面が使えなくなるため、停止したらダッシュボードから再開してください
- 価格が未確定のメニューは管理画面で「価格未定」表示のままにしてください（仮価格を入れない方針）
- 表現ルール（医療的断定・煽りの禁止など）は `AGENTS.md` を参照

## オーナーから受領待ちの情報

- 公式LINEのURL（現在プレースホルダー。管理画面 → サイト設定 → LINE から変更）
- 未確定価格: 初回グルーミング竹・松 / 育毛3ヶ月・6ヶ月 / 年間会員 / ギフト / 耳つぼ / サボテンノーズ
- 耳つぼセラピー資格の正式名称（`/about` の資格一覧を修正）
- KIRASUI・ヘッドスパのエビデンス資料（表現の裏付け用）
