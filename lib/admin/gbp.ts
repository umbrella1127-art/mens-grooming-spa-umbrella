// Googleビジネスプロフィール(GBP)の実績データ。
// 自動取得APIが使えないため、管理画面からの手入力を channel_metrics(channel='gbp') に貯める。
import { getServerClient } from "@/lib/supabase/server";

export const GBP_METRICS = [
  { key: "profile_views", label: "プロフィール閲覧数" },
  { key: "interactions", label: "インタラクション数" },
  { key: "calls", label: "通話" },
  { key: "bookings", label: "予約" },
  { key: "direction_requests", label: "ルート検索" },
  { key: "website_clicks", label: "ウェブサイトクリック" },
] as const;

export type GbpMetricKey = (typeof GBP_METRICS)[number]["key"];

export interface GbpMonthRow {
  month: string;
  values: Partial<Record<GbpMetricKey, number>>;
}

export interface GbpData {
  available: boolean;
  storeCode: string | null;
  months: GbpMonthRow[];
}

export async function getGbpData(): Promise<GbpData> {
  const supabase = await getServerClient();

  const storesRes = await supabase
    .from("stores")
    .select("code")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (storesRes.error) {
    return { available: false, storeCode: null, months: [] };
  }
  const storeCode = storesRes.data?.code ?? null;
  if (!storeCode) {
    return { available: true, storeCode: null, months: [] };
  }

  const { data, error } = await supabase
    .from("channel_metrics")
    .select("month, metric, value")
    .eq("store", storeCode)
    .eq("channel", "gbp")
    .order("month", { ascending: false });

  if (error) {
    return { available: false, storeCode, months: [] };
  }

  const byMonth = new Map<string, GbpMonthRow>();
  for (const row of data ?? []) {
    if (!byMonth.has(row.month)) byMonth.set(row.month, { month: row.month, values: {} });
    byMonth.get(row.month)!.values[row.metric as GbpMetricKey] = row.value ?? undefined;
  }

  return {
    available: true,
    storeCode,
    months: Array.from(byMonth.values()).sort((a, b) => (a.month < b.month ? 1 : -1)),
  };
}
