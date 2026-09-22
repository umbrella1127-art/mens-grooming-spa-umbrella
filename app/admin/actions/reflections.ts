"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./helpers";

/** オーナーが改善案を「採用」「見送り」にする。どちらも理由を残す（消さない）。 */
export async function resolveProposal(formData: FormData) {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(id)) throw new Error("改善案IDが不正です");
  if (!["accepted", "rejected"].includes(status)) throw new Error("状態の指定が不正です");
  if (!note) throw new Error("採用・見送りの理由をひとこと書いてください");

  const { error } = await supabase
    .from("improvement_proposals")
    .update({
      status,
      resolve_note: note,
      resolved_by: "owner",
      resolved_at: status === "rejected" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(`更新に失敗しました (${error.message})`);

  revalidatePath("/admin/kpi/threads");
  revalidatePath("/admin/kpi/hpb");
}
