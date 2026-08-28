"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cms";
import { requireAdmin } from "./helpers";

/**
 * 画像スロットのURL更新。アップロード自体はクライアントから
 * Supabase Storage へ直接行い（Server Actionの1MB制限回避）、
 * このアクションでDBのURLだけ差し替える。
 */
export async function updateImageSlot(input: {
  slot_key: string;
  url: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("images")
    .update({
      url: input.url,
      ...(input.alt !== undefined ? { alt: input.alt } : {}),
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .eq("slot_key", input.slot_key);
  if (error) throw new Error(`保存に失敗しました (${error.message})`);

  revalidateTag(CACHE_TAGS.images, "max");
  revalidatePath("/", "layout");
  return { ok: true };
}
