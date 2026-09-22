import Link from "next/link";
import { Badge, Card, Empty } from "@/components/admin/board";
import ChannelFindings from "@/components/admin/ChannelFindings";
import GbpTrend from "@/components/admin/GbpTrend";
import { getChannelFindings } from "@/lib/admin/findings";
import { getGbpData } from "@/lib/admin/gbp";
import { getHpbData } from "@/lib/admin/hpb";
import { getThreadsData } from "@/lib/admin/threads";

const SEVERITY_TONE = {
  critical: "bad",
  warning: "warn",
  info: "info",
  good: "ok",
} as const;

export default async function KpiPage() {
  const [hpb, threads, gbp, channelFindings] = await Promise.all([
    getHpbData(),
    getThreadsData(),
    getGbpData(),
    getChannelFindings(["ga4", "gbp", "seo"]),
  ]);
  const gbpLatest = gbp.months.find((m) => m.values.interactions != null);
  const latestByStore = new Map<string, (typeof hpb.monthlyKpi)[number]>();
  for (const row of hpb.monthlyKpi) {
    if (!latestByStore.has(row.store)) latestByStore.set(row.store, row);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">KPI</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          集客KPIハブ
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          最重要KPIはLINEクリック(line_click)。GA4・GBP・SEOの分析結果、Threads、HPB(ホットペッパービューティー)の新規獲得実績をここでまとめて確認できます。
        </p>
      </div>

      <ChannelFindings
        findings={channelFindings}
        title="GA4・GBP・SEOの分析結果(未確認の所見)"
        showChannel
      />

      <Card
        eyebrow="GBP"
        title="Googleビジネスプロフィール"
        aside={
          <Link href="/admin/gbp" className="underline underline-offset-4">
            入力・詳細 →
          </Link>
        }
      >
        {!gbpLatest ? (
          <Empty>
            まだ入力がありません。<Link href="/admin/gbp" className="text-brown underline underline-offset-4">GBPタブ</Link>から月次の数字を入力してください。
          </Empty>
        ) : (
          <div className="space-y-4">
            <GbpTrend months={gbp.months} />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-4">
              <dt className="text-greige">ルート検索({gbpLatest.month})</dt>
              <dd className="tabular-nums text-charcoal">{gbpLatest.values.direction_requests ?? "—"}</dd>
              <dt className="text-greige">サイトクリック</dt>
              <dd className="tabular-nums text-charcoal">{gbpLatest.values.website_clicks ?? "—"}</dd>
              <dt className="text-greige">通話</dt>
              <dd className="tabular-nums text-charcoal">{gbpLatest.values.calls ?? "—"}</dd>
              <dt className="text-greige">予約</dt>
              <dd className="tabular-nums text-charcoal">{gbpLatest.values.bookings ?? "—"}</dd>
            </dl>
          </div>
        )}
      </Card>

      <Card eyebrow="LINE / SEO" title="LINE誘導(GA4)・検索(Search Console)">
        <Empty>
          LINEクリック(line_click)などの実績は<Link href="/admin/ga4" className="text-brown underline underline-offset-4">GA4タブ</Link>、検索語句・掲載順位は<Link href="/admin/seo" className="text-brown underline underline-offset-4">SEOタブ</Link>で確認できます(どちらもGoogleから自動取得)。
        </Empty>
      </Card>

      <Card
        eyebrow="THREADS"
        title="Threads検証 → 公式ブログ"
        aside={
          <Link href="/admin/kpi/threads" className="underline underline-offset-4">
            詳細を見る →
          </Link>
        }
      >
        {!threads.available ? (
          <Empty>
            Threads基盤のテーブルが読み取れません。Supabaseでマイグレーション 0029・0030 を実行してください。
          </Empty>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-4">
            <dt className="text-greige">未テストの種ネタ</dt>
            <dd className="tabular-nums text-charcoal">{threads.stock}件</dd>
            <dt className="text-greige">記事化待ちの勝者</dt>
            <dd className="tabular-nums text-charcoal">{threads.winnersWaiting}件</dd>
            <dt className="text-greige">承認待ちの記事</dt>
            <dd className="tabular-nums text-charcoal">{threads.pendingBlogDrafts}件</dd>
            <dt className="text-greige">未解決の異常</dt>
            <dd className="tabular-nums text-charcoal">
              {threads.issues.length}件
              {threads.issues.some((i) => i.severity === "critical") && (
                <Badge tone="bad">重要あり</Badge>
              )}
            </dd>
          </dl>
        )}
      </Card>

      <Card
        eyebrow="HPB"
        title="ホットペッパービューティー 新規獲得"
        aside={
          <Link href="/admin/kpi/hpb" className="underline underline-offset-4">
            詳細を見る →
          </Link>
        }
      >
        {!hpb.available ? (
          <Empty>
            集客KPI基盤のテーブルが読み取れません。Supabaseでマイグレーション 0027 を実行してください。
          </Empty>
        ) : hpb.stores.length === 0 ? (
          <Empty>
            店舗が未登録です。`scripts/hpb/config.json` を設定して `python scripts/hpb/db_migrate.py`
            を実行してください(詳細は `scripts/hpb/GUIDE.md`)。
          </Empty>
        ) : latestByStore.size === 0 ? (
          <Empty>
            まだ実績データがありません。Salon Report PDFを取り込むと(`/hpb-run`)ここに表示されます。
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                  <th className="py-2 pr-3 font-semibold">店舗</th>
                  <th className="py-2 pr-3 font-semibold">月号</th>
                  <th className="py-2 pr-3 font-semibold">新規獲得数</th>
                  <th className="py-2 pr-3 font-semibold">新規獲得単価(CPA)</th>
                </tr>
              </thead>
              <tbody>
                {hpb.stores.map((s) => {
                  const row = latestByStore.get(s.code);
                  return (
                    <tr key={s.code} className="border-b border-beige/60 last:border-b-0">
                      <td className="py-2.5 pr-3 align-top">{s.name}</td>
                      <td className="py-2.5 pr-3 align-top tabular-nums">
                        {row?.month ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 align-top tabular-nums">
                        {row?.customersNew ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 align-top tabular-nums">
                        {row?.cpaYen ? `¥${row.cpaYen.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {hpb.available && hpb.findings.length > 0 && (
        <Card eyebrow="FINDINGS" title="未確認の所見">
          <ul className="space-y-2">
            {hpb.findings.slice(0, 5).map((f) => (
              <li key={f.id} className="flex flex-wrap items-baseline gap-2">
                <Badge tone={SEVERITY_TONE[f.severity]}>{f.month}</Badge>
                <span className="text-[12.5px] text-charcoal">{f.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
