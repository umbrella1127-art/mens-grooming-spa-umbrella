# MEN'S GROOMING SPA umbrella — サイト＋改善基盤

群馬県前橋市の男性専用サロンのWebサイト。ターゲットは35〜50代の「美容に詳しくない普通の男性」。ブランドメッセージは「月に一度、自分を整える。」

## 技術構成

- Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS v4（`app/globals.css` の `@theme` でトークン定義）
- Supabase: Postgres（CMSデータ）/ Auth（管理者1名）/ Storage（`site-images` バケット）
- ホスティング: Vercel。環境変数は `.env.local.example` 参照
- Supabase未設定でも `lib/fallback-data.ts` でサイトは動く（seed.sqlと内容を同期させること）

## アーキテクチャの要点

- 公開ページは**フル静的**。データ取得は必ず `lib/cms.ts`（`unstable_cache` + タグ）経由。公開側で `cookies()` や `lib/supabase/server.ts` を使わない（動的化してしまう）
- 管理画面 `/admin` は Server Actions（`app/admin/actions/`）で保存し `revalidateTag(tag, "max")` で即反映。Next 16 なので revalidateTag は第2引数必須
- `/admin` の認証は `proxy.ts`（旧middleware）→ `lib/supabase/middleware.ts`
- 全LINE CTAは `components/analytics/LineCtaLink.tsx` 経由（GA4 `line_click` イベント、最重要KPI）。素の `<a href={line_url}>` を作らない
- 画像はスロット式（`images` テーブル）。アップロードはクライアント→Storage直接、URL更新のみServer Action

## コンテンツ上の絶対ルール

- **未確定の価格をコードやseedに書かない**。`price_status: 'fixed'|'tbd'|'hidden'` で制御し、表示は `PriceLabel` に一元化。確定済みは 月9,900円/浄12,870円/育毛1回17,600円 のみ
- **医療的断定表現の禁止**: 「治る」「改善する」「必ず」「若返る」など。育毛・ヘッドスパ・フェイシャル・インナービューティーすべてで
- **煽り禁止**: 「今だけ」「残り○名」等の偽の希少性、過度な値引き訴求、高級すぎる演出、「選ばれた男性だけ」的な表現
- 電話番号は非掲載（JSON-LDにも入れない）。CTAはLINEのみ。Hot Pepperは載せない
- KIRASUI「全国1%」等の実績表現は根拠資料の確認前に使わない

## 検証

- `npx tsc --noEmit` → `npm run build`。ビルド出力で公開ページが全て `○ (Static)` であることを確認
- 開発サーバーは `.claude/launch.json` の `dev`（port 3000）
