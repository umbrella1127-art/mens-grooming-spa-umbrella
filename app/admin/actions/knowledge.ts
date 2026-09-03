"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./helpers";

function fields(formData: FormData) {
  return {
    title: (formData.get("title") as string).trim(),
    body: ((formData.get("body") as string) || "").trim(),
    category: (formData.get("category") as string) || "その他",
    updated_at: new Date().toISOString(),
  };
}

async function refresh() {
  revalidatePath("/admin/knowledge");
  redirect("/admin/knowledge?saved=1");
}

export async function createKnowledge(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("knowledge").insert(fields(formData));
  if (error) throw new Error(`追加に失敗しました (${error.message})`);
  await refresh();
}

export async function updateKnowledge(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("knowledge")
    .update(fields(formData))
    .eq("id", formData.get("id") as string);
  if (error) throw new Error(`保存に失敗しました (${error.message})`);
  await refresh();
}

export async function deleteKnowledge(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("knowledge")
    .delete()
    .eq("id", formData.get("id") as string);
  if (error) throw new Error(`削除に失敗しました (${error.message})`);
  await refresh();
}
