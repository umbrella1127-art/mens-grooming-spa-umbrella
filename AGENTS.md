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
- **店舗の事実を捏造しない**。特に「個室」「完全個室」は誤り（個室はない）。正しくは「男性専用のスペース」「男性だけの空間」。設備・実績・受賞歴なども、確認できないものは書かない
- KIRASUI「全国1%」等の実績表現は根拠資料の確認前に使わない

## 検証

- `npx tsc --noEmit` → `npm run build`。ビルド出力で公開ページが全て `○ (Static)` であることを確認
- 開発サーバーは `.claude/launch.json` の `dev`（port 3000）

## 集客KPI基盤（HPB / GBP / SEO / GA4 を横断する改善サイクル）

サロン集客を「様々な切り口で増やす」ための分析基盤。最初のチャネルはホットペッパービューティー（HPB）。
運用ルール・分析原則は [scripts/hpb/GUIDE.md](scripts/hpb/GUIDE.md) を参照（HPB関連のエージェントは必ず読む）。

- **データ**: Supabase Postgres（`supabase/migrations/0027_kpi_analysis.sql`）。HPB固有の実績は `hpb_*`、
  所見・戦略・戦略案・実ページ観察・分析手法・実行記録・レポートは `channel` 列付きの共通テーブル
  （`findings` / `strategies` / `strategy_options` / `page_observations` / `analysis_methods` / `analysis_runs` /
  `agent_tasks` / `analysis_reports` / `notifications`）。GBP/SEO/GA4 の月次指標は `channel_metrics`
- **取り込み・書き込み**: `scripts/hpb/*.py`（Python 3 + pdfplumber + psycopg）。`.env.local` の
  `HPB_DATABASE_URL`（Session pooler URI）で直接接続する。PDF解析が必要なので**ローカルPCで実行**する
- **エージェント**: `.claude/agents/hpb-*.md`（13体）と `.claude/skills/hpb-*`（`/hpb-run` 等）。
  全員が `python scripts/hpb/context.py` で読み、`db_put.py` / `query.py --write` で書く。
  `query.py` の更新系はKPI基盤のテーブルにしか効かない（CMSテーブルは書き換えられない）
- **画面**: `/admin/kpi`（集客KPIハブ）と `/admin/kpi/hpb`（HPB詳細・月次レポート）が描画する。
  レポートはHTMLファイルではなく `analysis_reports`（Markdown＋JSON）として保存する
- **通知**: `scripts/hpb/notify.py` がサイトと同じ Discord Bot で要約＋レポートURLを送る（`DISCORD_CHANNEL_KPI`）
- **秘密情報**: `scripts/hpb/config.json`（店舗コード・掲載プラン月額。テンプレートは `config.example.json`）と
  `data/`（Salon Report PDF・history.json）は untracked
- ここで扱う実売上・掲載料などの数値は **公開サイト側のコード・seed・文言に絶対に転記しない**
  （サイトの未確定価格ルールとは別管理）

## 振り返り（4層）— 全エージェント共通

担当は作業の最後、完了報告の直前に1回 `scripts/reflect/reflect.py add` で振り返りを書く（手順: `.claude/skills/run-reflection/SKILL.md`）。
①成果 ②やったこと＋自己診断 は `run_reflections`、③仕組みの改善案（kind=system）と ④事業の改善案（kind=business）は
`improvement_proposals` に分けて入る（`0032_run_reflections.sql`）。③は点検担当（threads-caretaker）が毎朝、
④は知識整理（threads-librarian・週1）と戦略担当（hpb-strategist・月1）が読んで仕分ける。管理画面は `/admin/kpi/threads`・`/admin/kpi/hpb`。

## サイト改善ループ（公開サイト自体を良くする）

サイトの変更を「実験」として登録し、変更前後の同じ日数を比べて判定する。最重要KPIは line_click（訪問あたりの率で比較）。

- **毎日 04:30**: `scripts/site/run-daily.ps1` → `scripts/site/daily.py`（Windowsタスク `mensumbrella-site-daily`、登録は `scripts/site/register-task.ps1`）。
  GA4（`scripts/site/ga4-daily.mjs`）→ `site_metrics_daily`（日×ページ）と `channel_metrics`(ga4, 月合計) に保存し、期間の終わった実験を判定してDiscordへ通知
- **登録**: `/admin/ga4` の「サイト改善の実験」フォーム（`experiments` テーブル、`0031_site_experiments.sql`）。何を変えた・なぜ・どうなるはず・ページ・指標がないとDBが拒否する
- 数が少ない（LINEクリック前後合計10件未満など）ときは勝ち負けを付けず期間を延長（最長28日）。採用／元に戻すの判断と作業は人が行う（自動で戻さない）

## Threads検証 → 公式ブログ化パイプライン

30〜50代男性の悩みをリサーチし、Threadsに1日3投稿 → 最も反応が良かった1本のテーマだけを翌日ブログ記事にする。
記事は `posts`（draft, source=ai）に入り、Discord承認（`content_drafts`）で公開する。**自動公開はしない**。
運用・接続手順は [scripts/threads/GUIDE.md](scripts/threads/GUIDE.md)、エージェントは `.claude/agents/threads-*.md`、
実行は `/threads-run`。書く前に必ず `.claude/skills/threads-blog-rules/SKILL.md` を読む。
DBは `0029_threads_pipeline.sql`（`threads_topics` / `threads_trials`）と `0030_threads_ops.sql`（`pipeline_issues` ほか）。書き込みは `scripts/threads/tdb.py` 経由のみ。
担当は6名（統括・リサーチ・検証・執筆・点検・知識整理）。人格は `.claude/agents/`、手順は `.claude/skills/threads-*`、名簿は `agent_roster`。
答え合わせは T+1（翌朝）と T+7（1週間後）の2点で、`threads_trial_snapshots` に残し、前の7日間の平均と比べて判定する
（`scripts/threads/judge.py`、`0033_threads_t7.sql`）。下書きは `predicted_metric`・`predicted_vs_baseline` が無いとDBが拒否する。
知識（`knowledge` source=threads）は3つのルールで運用する（`0034_knowledge_rules.sql`）: 型は保留で始まり、根拠（`knowledge_evidence`）の支持が3件以上かつ反証より多いときだけ採用できる／自動で書いた知識は削除できず、退役させて理由を残す／全担当が最初に `tdb.py --knowledge` を読む。
管理画面は `/admin/kpi/threads`。点検（自分自身を直すループ）は `scripts/threads/health.py` → `pipeline_issues`、学びは `knowledge`（source=threads）。
