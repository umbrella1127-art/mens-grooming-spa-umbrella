"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./helpers";

/** 所見を「確認済み」にして一覧から外す(削除はしない)。 */
export async function ackFinding(formData: FormData) {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("所見IDが不正です");

  const { error } = await supabase
    .from("findings")
    .update({ acked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`更新に失敗しました (${error.message})`);

  for (const path of ["/admin/kpi", "/admin/ga4", "/admin/gbp", "/admin/seo"]) {
    revalidatePath(path);
  }
}
