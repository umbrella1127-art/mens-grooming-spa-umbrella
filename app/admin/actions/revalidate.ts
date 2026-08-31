"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cms";
import { requireAdmin } from "./helpers";

/**
 * SupabaseのSQL Editorなどで直接データを変更した場合に、
 * サイトのキャッシュを手動で即時更新するためのアクション。
 * 通常の管理画面フォームからの保存では自動的に呼ばれるため使う必要はない。
 */
export async function revalidateAll() {
  await requireAdmin();
  for (const tag of Object.values(CACHE_TAGS)) {
    revalidateTag(tag, "max");
  }
  revalidatePath("/", "layout");
  return { ok: true, at: new Date().toISOString() };
}
