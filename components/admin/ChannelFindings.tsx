import { ackFinding } from "@/app/admin/actions/findings";
import { Badge, Card, Empty } from "@/components/admin/board";
import { CHANNEL_LABEL, type ChannelFinding } from "@/lib/admin/findings";

const SEVERITY = {
  critical: { tone: "bad", label: "要対応" },
  warning: { tone: "warn", label: "注意" },
  info: { tone: "info", label: "所見" },
  good: { tone: "ok", label: "良い兆し" },
} as const;

/** GA4 / GBP / SEO の所見一覧。「確認済み」を押すと一覧から外れる。 */
export default function ChannelFindings({
  findings,
  title = "分析結果(未確認の所見)",
  showChannel = false,
}: {
  findings: ChannelFinding[];
  title?: string;
  showChannel?: boolean;
}) {
  return (
    <Card eyebrow="FINDINGS" title={title}>
      {findings.length === 0 ? (
        <Empty>未確認の所見はありません。</Empty>
      ) : (
        <ul className="divide-y divide-beige/60">
          {findings.map((f) => (
            <li key={f.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <Badge tone={SEVERITY[f.severity].tone}>{SEVERITY[f.severity].label}</Badge>
                {showChannel && <Badge>{CHANNEL_LABEL[f.channel]}</Badge>}
                <span className="text-[13px] text-ink">{f.title}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-charcoal-light">
                {f.detail}
              </p>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-greige">
                <span className="tabular-nums">{f.month}</span>
                <form action={ackFinding}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="underline underline-offset-4 hover:text-charcoal"
                  >
                    確認済みにする
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
