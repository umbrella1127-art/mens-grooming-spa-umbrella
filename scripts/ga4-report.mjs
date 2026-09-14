// GA4 Data API から集客レポートを取得するローカル運用スクリプト。
// 公開サイト(app/)には含めない。実行: npm run ga4:report -- --days=30
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { existsSync } from "node:fs";
import path from "node:path";

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    }),
  );
  const days = Number(args.days ?? 30);
  const end = args.end ?? new Date().toISOString().slice(0, 10);
  const start =
    args.start ??
    new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { start, end };
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`環境変数 ${name} が未設定です。.env.local を確認してください。`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const propertyId = requireEnv("GA4_PROPERTY_ID");
  const keyFile =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    path.join(process.cwd(), "secrets", "ga4-service-account.json");
  if (!existsSync(keyFile)) {
    console.error(
      `サービスアカウントキーが見つかりません: ${keyFile}\nGOOGLE_APPLICATION_CREDENTIALS を .env.local に設定するか、secrets/ga4-service-account.json に配置してください。`,
    );
    process.exit(1);
  }

  const client = new BetaAnalyticsDataClient({ keyFilename: keyFile });
  const property = `properties/${propertyId}`;
  const { start, end } = parseArgs();
  const dateRanges = [{ startDate: start, endDate: end }];

  console.log(`期間: ${start} 〜 ${end}\n`);

  const [channelReport] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  console.log("■ チャネル別セッション");
  printRows(channelReport);

  const [landingReport] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 15,
  });
  console.log("\n■ ランディングページ別セッション(上位15件)");
  printRows(landingReport);

  const [lineClickReport] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: { value: "line_click" },
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 20,
  });
  console.log("\n■ line_click イベント発生ページ");
  if (lineClickReport.rows?.length) {
    printRows(lineClickReport);
  } else {
    console.log("(データなし。期間内にline_clickイベントが記録されていない可能性があります)");
  }

  try {
    const [ctaTypeReport] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "customEvent:cta_type" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { value: "line_click" },
        },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    });
    console.log("\n■ line_click の cta_type 別内訳");
    printRows(ctaTypeReport);
  } catch (err) {
    console.log(
      "\n■ cta_type 別内訳: 取得できませんでした(GA4管理画面でcta_typeをカスタムディメンション登録すると取得できます)",
    );
  }
}

function printRows(report) {
  const dims = report.dimensionHeaders?.map((h) => h.name) ?? [];
  const mets = report.metricHeaders?.map((h) => h.name) ?? [];
  if (!report.rows?.length) {
    console.log("(データなし)");
    return;
  }
  for (const row of report.rows) {
    const dimVals = row.dimensionValues.map((v) => v.value).join(" / ");
    const metVals = row.metricValues
      .map((v, i) => `${mets[i]}=${v.value}`)
      .join(", ");
    console.log(`${dimVals}: ${metVals}`);
  }
}

main().catch((err) => {
  console.error("GA4レポート取得に失敗しました:", err.message ?? err);
  process.exit(1);
});
