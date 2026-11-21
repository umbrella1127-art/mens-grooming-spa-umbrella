// Search Console の検索語・ページ別の表示/クリックを一覧する（読み取り専用）。
//   node --env-file=.env.local scripts/site/sc-queries.mjs [--days=90] [--limit=100]
// 認証は lib/admin/searchconsole.ts と同じ（GA4_SERVICE_ACCOUNT_JSON、サイトは SEARCH_CONSOLE_SITE_URL か NEXT_PUBLIC_SITE_URL）。
import { GoogleAuth } from "google-auth-library";

const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split("=")[1] : d;
};
const days = Number(arg("days", 90));
const limit = Number(arg("limit", 100));

const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
const auth = new GoogleAuth({
  ...(json ? { credentials: JSON.parse(json) } : {}),
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});
const client = await auth.getClient();
const siteUrl =
  process.env.SEARCH_CONSOLE_SITE_URL ??
  (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/` : null);
if (!siteUrl) throw new Error("SEARCH_CONSOLE_SITE_URL / NEXT_PUBLIC_SITE_URL が未設定です");

const end = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
const start = new Date(Date.now() - (days + 3) * 86_400_000).toISOString().slice(0, 10);

async function q(body) {
  const res = await client.request({
    url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    method: "POST",
    data: { startDate: start, endDate: end, ...body },
  });
  return res.data.rows ?? [];
}

const fmt = (r) =>
  `${String(r.clicks).padStart(4)} clk ${String(r.impressions).padStart(6)} imp  pos ${r.position.toFixed(1).padStart(5)}  ${r.keys.join(" | ")}`;

console.log(`期間 ${start}〜${end}  サイト ${siteUrl.replace(/\/\/.*@/, "//")}`);
const total = (await q({}))[0];
console.log(`合計: クリック ${total?.clicks ?? 0} / 表示 ${total?.impressions ?? 0} / 平均順位 ${(total?.position ?? 0).toFixed(1)}`);
console.log("\n[検索語（表示の多い順）]");
for (const r of await q({ dimensions: ["query"], rowLimit: limit })) console.log(fmt(r));
console.log("\n[ページ別]");
for (const r of await q({ dimensions: ["page"], rowLimit: 30 })) console.log(fmt(r));
