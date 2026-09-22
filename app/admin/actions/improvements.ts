"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./helpers";

/**
 * 自律改善の変更を承認・却下する。ここでは状態を付けるだけで、ファイルの反映は
 * ローカルPCの定期実行（scripts/improve/improve.py tick、毎朝5:00と見張りのあと）が行う。
 */
export async function decideImprovement(formData: FormData) {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(id)) throw new Error("変更IDが不正です");
  if (!["approved", "rejected"].includes(decision)) throw new Error("指定が不正です");
  if (decision === "rejected" && !note) throw new Error("却下するときは理由をひとこと書いてください");

  const { data, error } = await supabase
    .from("improvement_changes")
    .update({ status: decision, decided_by: "owner", note: note || null })
    .eq("id", id)
    .eq("status", "awaiting_approval")
    .select("proposal_id");
  if (error) throw new Error(`更新に失敗しました (${error.message})`);

  const proposalId = data?.[0]?.proposal_id;
  if (decision === "rejected" && proposalId) {
    await supabase
      .from("improvement_proposals")
      .update({
        status: "rejected",
        resolved_by: "owner",
        resolve_note: `変更 #${id} を却下: ${note}`,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
  }

  revalidatePath("/admin/activity");
}
