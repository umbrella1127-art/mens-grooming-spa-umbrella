// GA4 Data API から「日 × ページ」の実績を取り、JSON配列で標準出力に出す。
// DBへの保存は scripts/site/daily.py が行う（Node側にDBドライバが無いため役割を分けている）。
//   node --env-file=.env.local scripts/site/ga4-daily.mjs --start=2026-09-01 --end=2026-09-21
// 出力: [{ "day": "2026-09-21", "page": "/", "metric": "sessions", "value": 3 }, ...]
//   page='(all)' はサイト全体。metric: sessions / page_views / engagement_sec / line_click
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function arg(name) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function client() {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  return json
    ? new BetaAnalyticsDataClient({ credentials: JSON.parse(json) })
    : new BetaAnalyticsDataClient();
}

const toDay = (yyyymmdd) =>
  `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

async function main() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4_PROPERTY_ID が未設定です（.env.local）");
  const start = arg("start");
  const end = arg("end");
  if (!start || !end) throw new Error("--start=YYYY-MM-DD --end=YYYY-MM-DD を指定してください");

  const c = client();
  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: start, endDate: end }];
  const lineFilter = {
    filter: { fieldName: "eventName", stringFilter: { value: "line_click" } },
  };
  const out = [];
  const push = (day, page, metric, value) =>
    out.push({ day: toDay(day), page, metric, value: Number(value ?? 0) });

  const [perPage] = await c.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "date" }, { name: "pagePath" }],
    metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "userEngagementDuration" }],
    limit: 100000,
  });
  for (const r of perPage.rows ?? []) {
    const [d, p] = r.dimensionValues.map((v) => v.value);
    const [s, pv, eng] = r.metricValues.map((v) => v.value);
    push(d, p, "sessions", s);
    push(d, p, "page_views", pv);
    push(d, p, "engagement_sec", eng);
  }

  const [linePerPage] = await c.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "date" }, { name: "pagePath" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: lineFilter,
    limit: 100000,
  });
  for (const r of linePerPage.rows ?? []) {
    const [d, p] = r.dimensionValues.map((v) => v.value);
    push(d, p, "line_click", r.metricValues[0].value);
  }

  const [site] = await c.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "userEngagementDuration" }],
  });
  for (const r of site.rows ?? []) {
    const d = r.dimensionValues[0].value;
    const [s, pv, eng] = r.metricValues.map((v) => v.value);
    push(d, "(all)", "sessions", s);
    push(d, "(all)", "page_views", pv);
    push(d, "(all)", "engagement_sec", eng);
  }

  const [siteLine] = await c.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "date" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: lineFilter,
  });
  for (const r of siteLine.rows ?? []) {
    push(r.dimensionValues[0].value, "(all)", "line_click", r.metricValues[0].value);
  }

  process.stdout.write(JSON.stringify(out));
}

main().catch((err) => {
  console.error(`GA4の取得に失敗しました: ${err.message ?? err}`);
  process.exit(1);
});
