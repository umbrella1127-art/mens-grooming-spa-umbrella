import Link from "next/link";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Card, Empty } from "@/components/admin/board";
import { getServerClient } from "@/lib/supabase/server";

// 分析チーム（ga4-analyst）が毎週月曜に書く週次レポート。analysis_reports（channel='ga4'）を読む。
export const dynamic = "force-dynamic";

interface Report {
  id: number;
  month: string; // 週の識別子 例: 2026-W46
  title: string;
  headline: string | null;
  summary_md: string | null;
  sections: { heading: string; body_md: string }[];
  kpi: Record<string, string | number>;
  created_at: string;
}

const MD_CLASS =
  "prose-custom text-[13px] leading-relaxed text-charcoal [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[15px] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_table]:w-full [&_table]:text-left [&_th]:pr-4 [&_td]:pr-4";

function ymd(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function Ga4ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("analysis_reports")
    .select("id, month, title, headline, summary_md, sections, kpi, created_at")
    .eq("channel", "ga4")
    .order("created_at", { ascending: false })
    .limit(20);
  const reports = (data ?? []) as Report[];
  const report = reports.find((r) => r.month === p) ?? reports[0];

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">
          <Link href="/admin/ga4" className="hover:underline">
            GA4
          </Link>{" "}
          / REPORT
        </p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          {report ? report.title : "GA4 週次レポート"}
        </h1>
        {report?.headline && <p className="mt-1 text-[13px] text-charcoal">{report.headline}</p>}
        {report && (
          <p className="mt-1 text-[11px] text-greige">作成: {ymd(report.created_at)}（分析チーム）</p>
        )}
      </div>

      {!report ? (
        <Card eyebrow="STATUS" title="まだレポートがありません">
          <Empty>毎週月曜 9:15 に分析チームが作成します。</Empty>
        </Card>
      ) : (
        <>
          {report.summary_md && (
            <Card eyebrow="SUMMARY" title="結論">
              <div className={MD_CLASS}>
                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {report.summary_md}
                </Markdown>
              </div>
            </Card>
          )}
          {report.sections.map((s, i) => (
            <Card key={i} eyebrow="SECTION" title={s.heading}>
              <div className={MD_CLASS}>
                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {s.body_md}
                </Markdown>
              </div>
            </Card>
          ))}
          {reports.length > 1 && (
            <Card eyebrow="HISTORY" title="過去のレポート">
              <ul className="space-y-1 text-[12.5px]">
                {reports.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/ga4/report?p=${r.month}`} className="text-brown hover:underline">
                      {r.month}
                    </Link>{" "}
                    <span className="text-charcoal-light">{r.headline ?? r.title}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
