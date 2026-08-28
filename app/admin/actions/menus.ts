"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cms";
import { requireAdmin } from "./helpers";

export async function updateMenu(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const priceRaw = (formData.get("price_yen") as string)?.trim();

  const { error } = await supabase
    .from("menus")
    .update({
      name: formData.get("name") as string,
      description: ((formData.get("description") as string) || "").trim() || null,
      duration_min: (formData.get("duration_min") as string)?.trim()
        ? Number(formData.get("duration_min"))
        : null,
      price_yen: priceRaw ? Number(priceRaw) : null,
      price_status: formData.get("price_status") as string,
      price_note: ((formData.get("price_note") as string) || "").trim() || null,
      is_published: formData.get("is_published") === "on",
      is_recommended: formData.get("is_recommended") === "on",
      sort_order: Number(formData.get("sort_order") || 0),
    })
    .eq("id", id);
  if (error) throw new Error(`保存に失敗しました (${error.message})`);

  revalidateTag(CACHE_TAGS.menus, "max");
  revalidatePath("/", "layout");
  redirect("/admin/menus?saved=1");
}
