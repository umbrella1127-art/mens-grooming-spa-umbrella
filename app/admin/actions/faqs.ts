"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cms";
import { requireAdmin } from "./helpers";

function faqFields(formData: FormData) {
  return {
    question: formData.get("question") as string,
    answer: formData.get("answer") as string,
    category: ((formData.get("category") as string) || "").trim() || null,
    sort_order: Number(formData.get("sort_order") || 0),
    is_published: formData.get("is_published") === "on",
  };
}

async function refresh() {
  revalidateTag(CACHE_TAGS.faqs, "max");
  revalidatePath("/", "layout");
  redirect("/admin/faqs?saved=1");
}

export async function createFaq(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("faqs").insert(faqFields(formData));
  if (error) throw new Error(`追加に失敗しました (${error.message})`);
  await refresh();
}

export async function updateFaq(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("faqs")
    .update(faqFields(formData))
    .eq("id", formData.get("id") as string);
  if (error) throw new Error(`保存に失敗しました (${error.message})`);
  await refresh();
}

export async function deleteFaq(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("faqs")
    .delete()
    .eq("id", formData.get("id") as string);
  if (error) throw new Error(`削除に失敗しました (${error.message})`);
  await refresh();
}
