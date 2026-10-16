"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cms";
import { editDiscordMessage } from "@/lib/discord";
import { publishLinkedPost } from "@/lib/publish-draft";
import { getServiceClient } from "@/lib/supabase/service";
import { describeTrialSync, syncLinkedTrial } from "@/lib/sync-linked-trial";
import { requireAdmin } from "./helpers";

const LABEL: Record<string, string> = {
  approved: "✅ 承認済み（管理画面から）",
  rejected: "❌ 却下（管理画面から）",
};

/**
 * 管理画面から下書きの可否を決める。Discord側のボタンと同じ結果になるよう、
 * 元のDiscordメッセージも編集してボタンを外す（どちらから操作しても表示が揃う）。
 * 二重操作を防ぐため pending のときだけ更新する。
 */
async function decide(formData: FormData, status: "approved" | "rejected") {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;

  const { data: updated, error } = await supabase
    .from("content_drafts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("content_text, discord_channel_id, discord_message_id, post_id, trial_id")
    .maybeSingle();

  if (error) throw new Error(`更新に失敗しました (${error.message})`);

  // ブログ記事に紐づく下書きは、承認された時点でそのまま公開する
  if (status === "approved" && updated?.post_id) {
    const result = await publishLinkedPost(supabase, updated.post_id);
    if (result.published) {
      revalidateTag(CACHE_TAGS.posts, "max");
      revalidatePath("/", "layout");
    }
  }

  // Threadsの投稿案（井上さんのメモ由来）は、承認/却下を台帳に反映する（lib/sync-linked-trial.ts に一本化）。
  // threads_trials は管理者のセッションでは更新できない（RLSが select のみ）ので service_role で書く
  let trialNote = "";
  if (updated?.trial_id) {
    const result = await syncLinkedTrial(getServiceClient(), updated.trial_id, status);
    trialNote = describeTrialSync(result);
    if (!result.synced) {
      throw new Error(`Threads投稿の予定に反映できませんでした (${result.reason})`);
    }
  }

  if (updated?.discord_channel_id && updated?.discord_message_id) {
    // Discordが落ちていても管理画面の操作自体は成立させる
    try {
      await editDiscordMessage(
        updated.discord_channel_id,
        updated.discord_message_id,
        {
          content: `${LABEL[status]}${trialNote}\n\n${updated.content_text}`,
          components: [],
        },
      );
    } catch {
      // 通知の失敗は握りつぶす（DBの状態が正）
    }
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  redirect("/admin/approvals?done=1");
}

export async function approveDraft(formData: FormData) {
  await decide(formData, "approved");
}

export async function rejectDraft(formData: FormData) {
  await decide(formData, "rejected");
}
