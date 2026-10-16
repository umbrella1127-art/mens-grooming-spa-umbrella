// 下書き（content_drafts）の承認／却下を、紐づく Threads 投稿案（threads_trials）に反映する処理。
// Discordのボタンからも管理画面の承認ページからも同じ結果になるよう、ここに一本化している。
//
// 承認 = status を 'draft' に戻す（予定の時刻に post-due が自動投稿する状態）。ここでは投稿しない。
// 却下 = status を 'skipped' にする（投稿されない）。
//
// threads_trials は authenticated ロールに update のRLSポリシーが無い（select のみ）ため、
// 呼び出し側は必ず service_role クライアント（lib/supabase/service.ts）を渡すこと。
// 管理画面のセッションクライアントで呼ぶと 0件更新で黙って失敗する。
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrialSyncResult =
  | { synced: true; trialDate: string; slot: number; status: "draft" | "skipped" }
  | { synced: false; reason: string };

export async function syncLinkedTrial(
  service: SupabaseClient,
  trialId: number,
  decision: "approved" | "rejected",
): Promise<TrialSyncResult> {
  const status = decision === "approved" ? "draft" : "skipped";
  const { data, error } = await service
    .from("threads_trials")
    .update({ status })
    .eq("id", trialId)
    .eq("status", "pending_approval")
    .select("trial_date, slot")
    .maybeSingle();

  if (error) return { synced: false, reason: error.message };
  if (!data) {
    // すでに pending_approval でない（二重操作・手で直した・投稿済みなど）
    const { data: current } = await service
      .from("threads_trials")
      .select("status")
      .eq("id", trialId)
      .maybeSingle();
    return {
      synced: false,
      reason: current ? `現在の状態は ${current.status}` : "threads_trials に該当なし",
    };
  }
  return { synced: true, trialDate: data.trial_date, slot: data.slot, status };
}

/** Discordの元メッセージに足す1行。反映できなかったときも必ず見えるようにする（黙って止まるのを防ぐ） */
export function describeTrialSync(result: TrialSyncResult): string {
  if (!result.synced) {
    return `\n\n⚠️ Threads投稿の予定には反映できませんでした（${result.reason}）。/admin/kpi/threads を確認してください。`;
  }
  const [, m, d] = result.trialDate.split("-");
  const when = `${Number(m)}/${Number(d)} ${result.slot}本目`;
  return result.status === "draft"
    ? `\n\nThreads投稿を予定に戻しました（${when}）。予定の時刻に自動で投稿されます。`
    : `\n\nThreads投稿（${when}）は投稿しません。`;
}
