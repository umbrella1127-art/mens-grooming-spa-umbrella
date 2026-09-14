// Google Search Console(検索パフォーマンス)データ取得。
// GA4と同じサービスアカウント(ga4-report@...)を使い回す。
// Search Console側で「設定 → ユーザーと権限」にこのサービスアカウントのメールを追加しておくこと。
import { GoogleAuth } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

function getAuth() {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (json) {
    return new GoogleAuth({ credentials: JSON.parse(json), scopes: SCOPES });
  }
  return new GoogleAuth({ scopes: SCOPES });
}

export interface ScQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface ScPageRow {
  page: string;
  clicks: number;
  impressions: number;
}

export interface ScData {
  available: boolean;
  reason: string | null;
  rangeStart: string;
  rangeEnd: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  queries: ScQueryRow[];
  pages: ScPageRow[];
}

interface SearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

async function queryAnalytics(
  client: Awaited<ReturnType<GoogleAuth["getClient"]>>,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<SearchAnalyticsRow[]> {
  const res = await client.request<{ rows?: SearchAnalyticsRow[] }>({
    url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    method: "POST",
    data: body,
  });
  return res.data.rows ?? [];
}

export async function getSearchConsoleData(days = 28): Promise<ScData> {
  const empty: ScData = {
    available: false,
    reason: null,
    rangeStart: "",
    rangeEnd: "",
    totalClicks: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgPosition: 0,
    queries: [],
    pages: [],
  };

  const siteUrl =
    process.env.SEARCH_CONSOLE_SITE_URL ??
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/`
      : null);
  if (!siteUrl) {
    return { ...empty, reason: "SEARCH_CONSOLE_SITE_URL が設定されていません。" };
  }

  // Search Consoleのデータは確定まで2〜3日ほどラグがある
  const end = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 3) * 86_400_000)
    .toISOString()
    .slice(0, 10);

  try {
    const auth = getAuth();
    const client = await auth.getClient();

    const [summaryRows, queryRows, pageRows] = await Promise.all([
      queryAnalytics(client, siteUrl, { startDate: start, endDate: end }),
      queryAnalytics(client, siteUrl, {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit: 20,
      }),
      queryAnalytics(client, siteUrl, {
        startDate: start,
        endDate: end,
        dimensions: ["page"],
        rowLimit: 15,
      }),
    ]);

    const summary = summaryRows[0];

    return {
      available: true,
      reason: null,
      rangeStart: start,
      rangeEnd: end,
      totalClicks: summary?.clicks ?? 0,
      totalImpressions: summary?.impressions ?? 0,
      avgCtr: summary?.ctr ?? 0,
      avgPosition: summary?.position ?? 0,
      queries: queryRows.map((r) => ({
        query: r.keys?.[0] ?? "(不明)",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      })),
      pages: pageRows.map((r) => ({
        page: r.keys?.[0] ?? "(不明)",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
      })),
    };
  } catch (err) {
    return {
      ...empty,
      reason:
        err instanceof Error
          ? `Search Console APIの呼び出しに失敗しました（${err.message}）`
          : "Search Console APIの呼び出しに失敗しました。",
    };
  }
}
