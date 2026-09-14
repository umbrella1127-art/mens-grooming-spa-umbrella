import Link from "next/link";
import { Card, Empty } from "@/components/admin/board";
import { getSearchConsoleData } from "@/lib/admin/searchconsole";

export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 7, label: "7日" },
  { days: 28, label: "28日" },
  { days: 90, label: "90日" },
] as const;

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = PERIODS.some((p) => String(p.days) === params.days)
    ? Number(params.days)
    : 28;
  const sc = await getSearchConsoleData(days);

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">SEO</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          検索パフォーマンス
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[12.5px] text-charcoal-light">
            {sc.available
              ? `${sc.rangeStart} 〜 ${sc.rangeEnd}（Search Console、確定まで2〜3日ラグあり）`
              : "検索順位・検索語句・クリック数(Google Search Console)"}
          </p>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <Link
                key={p.days}
                href={`/admin/seo?days=${p.days}`}
                className={`rounded-sm px-2 py-0.5 text-[11.5px] tracking-wide transition-colors ${
                  days === p.days
                    ? "bg-brown text-paper"
                    : "border border-beige text-charcoal-light hover:bg-paper-dark"
                }`}
              >
                過去{p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!sc.available ? (
        <Card eyebrow="STATUS" title="未接続">
          <Empty>
            {sc.reason ?? "Search Consoleに接続できませんでした。"}
            {" "}Search Consoleの「設定 → ユーザーと権限」にga4-report@…のサービスアカウントを追加してください。
          </Empty>
        </Card>
      ) : (
        <>
          <Card eyebrow="SUMMARY" title="サマリー">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[10.5px] tracking-wide text-greige">クリック数</p>
                <p className="font-serif-jp text-[18px] tabular-nums text-ink">
                  {sc.totalClicks}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] tracking-wide text-greige">表示回数</p>
                <p className="font-serif-jp text-[18px] tabular-nums text-ink">
                  {sc.totalImpressions}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] tracking-wide text-greige">CTR</p>
                <p className="font-serif-jp text-[18px] tabular-nums text-ink">
                  {(sc.avgCtr * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10.5px] tracking-wide text-greige">平均掲載順位</p>
                <p className="font-serif-jp text-[18px] tabular-nums text-ink">
                  {sc.avgPosition.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>

          <Card eyebrow="QUERIES" title="検索語句(上位20件)">
            {sc.queries.length === 0 ? (
              <Empty>データがありません。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">検索語句</th>
                      <th className="py-2 pr-3 font-semibold">クリック</th>
                      <th className="py-2 pr-3 font-semibold">表示回数</th>
                      <th className="py-2 pr-3 font-semibold">CTR</th>
                      <th className="py-2 pr-3 font-semibold">順位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sc.queries.map((q) => (
                      <tr key={q.query} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{q.query}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{q.clicks}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{q.impressions}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">
                          {(q.ctr * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">
                          {q.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card eyebrow="PAGES" title="ページ別(上位15件)">
            {sc.pages.length === 0 ? (
              <Empty>データがありません。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">ページ</th>
                      <th className="py-2 pr-3 font-semibold">クリック</th>
                      <th className="py-2 pr-3 font-semibold">表示回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sc.pages.map((p) => (
                      <tr key={p.page} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{p.page}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{p.clicks}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{p.impressions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
