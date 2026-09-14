import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/admin/board";
import { getHpbReport } from "@/lib/admin/hpb";

export default async function HpbMonthReportPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const report = await getHpbReport(month);
  if (!report) notFound();

  const kpiEntries = Object.entries(report.kpi);

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">
          <Link href="/admin/kpi" className="hover:underline">
            KPI
          </Link>{" "}
          /{" "}
          <Link href="/admin/kpi/hpb" className="hover:underline">
            HPB
          </Link>{" "}
          / {report.month}
        </p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          {report.title}
        </h1>
        {report.headline && (
          <p className="mt-1 text-[13px] text-charcoal">{report.headline}</p>
        )}
      </div>

      {kpiEntries.length > 0 && (
        <Card eyebrow="KPI" title="この月号の数字">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpiEntries.map(([key, value]) => (
              <div key={key}>
                <p className="text-[10.5px] tracking-wide text-greige">{key}</p>
                <p className="font-serif-jp text-[18px] tabular-nums text-ink">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {report.summaryMd && (
        <Card eyebrow="SUMMARY" title="結論">
          <div className="prose-custom text-[13px] leading-relaxed text-charcoal [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[15px] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {report.summaryMd}
            </Markdown>
          </div>
        </Card>
      )}

      {report.sections.map((section, i) => (
        <Card key={i} eyebrow="SECTION" title={section.heading}>
          <div className="prose-custom text-[13px] leading-relaxed text-charcoal [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[15px] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_table]:w-full [&_table]:text-left">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {section.body_md}
            </Markdown>
          </div>
        </Card>
      ))}
    </div>
  );
}
