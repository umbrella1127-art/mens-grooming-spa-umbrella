// PCの外側からの見張り（Vercel Cron が毎日呼ぶ）。
// ローカルの監視（scripts/monitor/watchdog.py）はPCが止まると一緒に止まるため、
// 「記録が途絶えていること」自体をクラウドから検知してDiscordに知らせる。異常が無い日は何も送らない。
// 認証: Vercel Cron が付ける `Authorization: Bearer ${CRON_SECRET}`。
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { sendDiscordMessage } from "@/lib/discord";

export const dynamic = "force-dynamic";

const HOUR = 3_600_000;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  const now = Date.now();
  const problems: string[] = [];

  // 1. 定期実行の記録が途絶えていないか（どのルーチンでも、直近30時間に1件も無ければPCが止まっている）
  const { data: lastRun } = await db
    .from("agent_runs")
    .select("ran_at")
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const runAge = lastRun ? (now - new Date(lastRun.ran_at).getTime()) / HOUR : null;
  if (runAge === null || runAge > 30) {
    problems.push(
      `定期実行の記録が${runAge === null ? "1件もありません" : `${Math.round(runAge)}時間途絶えています`}（PCの停止・スリープ、またはタスクの起動失敗の疑い）`,
    );
  }

  // 2. GA4の取り込みが古くないか
  const { data: ga } = await db
    .from("site_metrics_daily")
    .select("day")
    .order("day", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ga) {
    const gap = (now - new Date(`${ga.day}T00:00:00+09:00`).getTime()) / (24 * HOUR);
    if (gap > 4) problems.push(`GA4の取り込みが${Math.floor(gap)}日分遅れています（最新 ${ga.day}）`);
  }

  // 3. 人の確認待ちが残っていないか
  const { data: open } = await db
    .from("pipeline_issues")
    .select("title, evidence")
    .eq("channel", "system")
    .eq("status", "open")
    .eq("evidence->>needs_human", "true")
    .limit(5);
  for (const i of open ?? []) problems.push(`未解決（要確認）: ${i.title}`);

  const channel = process.env.DISCORD_CHANNEL_THREADS_CARE || process.env.DISCORD_CHANNEL_NOTICE;
  if (problems.length > 0 && channel && process.env.DISCORD_BOT_TOKEN) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await sendDiscordMessage(channel, {
      content: `🛰️ クラウド側の見張り\n${problems.map((p) => `・${p}`).join("\n")}\n${base}/admin/errors`.slice(0, 1900),
    });
  }
  return NextResponse.json({ ok: true, problems });
}
