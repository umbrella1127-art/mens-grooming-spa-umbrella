// GA4 Data APIから集客KPIハブ/GA4タブ向けにデータを取得する。
// 認証情報はローカルでは GOOGLE_APPLICATION_CREDENTIALS(鍵ファイルのパス)、
// Vercel等ファイルを置けない環境では GA4_SERVICE_ACCOUNT_JSON(鍵JSONそのもの)を使う。
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function getClient() {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (json) {
    return new BetaAnalyticsDataClient({ credentials: JSON.parse(json) });
  }
  return new BetaAnalyticsDataClient();
}

export interface Ga4Channel {
  channel: string;
  sessions: number;
  activeUsers: number;
}

export interface Ga4LandingPage {
  page: string;
  sessions: number;
}

export interface Ga4LineClick {
  page: string;
  count: number;
}

export interface Ga4CtaType {
  ctaType: string;
  count: number;
}

export interface Ga4Data {
  available: boolean;
  reason: string | null;
  rangeStart: string;
  rangeEnd: string;
  channels: Ga4Channel[];
  landingPages: Ga4LandingPage[];
  lineClicksByPage: Ga4LineClick[];
  lineClicksByCtaType: Ga4CtaType[] | null;
}

function rowsOf(res: {
  rows?: { dimensionValues?: ({ value?: string | null } | null)[] | null; metricValues?: ({ value?: string | null } | null)[] | null }[] | null;
}) {
  return res.rows ?? [];
}

export async function getGa4Data(days = 30): Promise<Ga4Data> {
  const empty: Ga4Data = {
    available: false,
    reason: null,
    rangeStart: "",
    rangeEnd: "",
    channels: [],
    landingPages: [],
    lineClicksByPage: [],
    lineClicksByCtaType: null,
  };

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return { ...empty, reason: "GA4_PROPERTY_ID が設定されていません。" };
  }

  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const dateRanges = [{ startDate: start, endDate: end }];
  const property = `properties/${propertyId}`;

  try {
    const client = getClient();

    const [channelRes] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const [landingRes] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "landingPage" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 15,
    });

    const [lineRes] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: { fieldName: "eventName", stringFilter: { value: "line_click" } },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 20,
    });

    let lineClicksByCtaType: Ga4CtaType[] | null = null;
    try {
      const [ctaRes] = await client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "customEvent:cta_type" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: { fieldName: "eventName", stringFilter: { value: "line_click" } },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      });
      lineClicksByCtaType = rowsOf(ctaRes).map((r) => ({
        ctaType: r.dimensionValues?.[0]?.value ?? "(未設定)",
        count: Number(r.metricValues?.[0]?.value ?? 0),
      }));
    } catch {
      lineClicksByCtaType = null;
    }

    return {
      available: true,
      reason: null,
      rangeStart: start,
      rangeEnd: end,
      channels: rowsOf(channelRes).map((r) => ({
        channel: r.dimensionValues?.[0]?.value ?? "(不明)",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
        activeUsers: Number(r.metricValues?.[1]?.value ?? 0),
      })),
      landingPages: rowsOf(landingRes).map((r) => ({
        page: r.dimensionValues?.[0]?.value ?? "(不明)",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
      })),
      lineClicksByPage: rowsOf(lineRes).map((r) => ({
        page: r.dimensionValues?.[0]?.value ?? "(不明)",
        count: Number(r.metricValues?.[0]?.value ?? 0),
      })),
      lineClicksByCtaType,
    };
  } catch (err) {
    return {
      ...empty,
      reason:
        err instanceof Error
          ? `GA4 APIの呼び出しに失敗しました（${err.message}）`
          : "GA4 APIの呼び出しに失敗しました。",
    };
  }
}
