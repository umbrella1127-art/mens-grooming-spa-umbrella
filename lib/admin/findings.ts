// HPB以外のチャネル(GA4 / GBP / SEO)の所見。findings テーブルを channel で絞って読む。
// 分析セッションやエージェントが scripts/hpb/db_put.py --finding --channel <ch> で書き込む。
import { getServerClient } from "@/lib/supabase/server";

export type FindingChannel = "ga4" | "gbp" | "seo";

export const CHANNEL_LABEL: Record<FindingChannel, string> = {
  ga4: "GA4",
  gbp: "GBP",
  seo: "SEO",
};

export interface ChannelFinding {
  id: number;
  channel: FindingChannel;
  month: string;
  severity: "critical" | "warning" | "info" | "good";
  title: string;
  detail: string;
  createdAt: string;
}

export async function getChannelFindings(
  channels: FindingChannel[],
  limit = 20,
): Promise<ChannelFinding[]> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("findings")
    .select("id, channel, month, severity, title, detail, created_at")
    .in("channel", channels)
    .is("acked_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  const order = { critical: 0, warning: 1, info: 2, good: 3 } as const;
  return (data ?? [])
    .map((f) => ({
      id: f.id,
      channel: f.channel as FindingChannel,
      month: f.month,
      severity: f.severity as ChannelFinding["severity"],
      title: f.title,
      detail: f.detail,
      createdAt: f.created_at,
    }))
    .sort((a, b) => order[a.severity] - order[b.severity]);
}
