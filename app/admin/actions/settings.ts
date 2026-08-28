"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cms";
import { requireAdmin } from "./helpers";

/**
 * サイト設定の保存。フォームの各フィールド名 = site_settings.key。
 * 保存後 revalidateTag で公開ページへ即反映（変更履歴はDBトリガーが記録）。
 */
export async function saveSettings(formData: FormData) {
  const supabase = await requireAdmin();

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$") || typeof value !== "string") continue;
    const { error } = await supabase
      .from("site_settings")
      .update({ value: { text: value } })
      .eq("key", key);
    if (error) throw new Error(`保存に失敗しました: ${key} (${error.message})`);
  }

  revalidateTag(CACHE_TAGS.settings, "max");
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
