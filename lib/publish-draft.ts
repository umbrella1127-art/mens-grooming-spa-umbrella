// 下書きの承認時に、紐づくブログ記事をそのまま公開する処理。
// Discordのボタンからも管理画面の承認ページからも同じ結果になるよう、
// ここに一本化している。
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * まだ下書きの記事だけを公開する。すでに公開済みなら何もしない。
 * 公開できたときだけ true を返す。
 */
export async function publishLinkedPost(
  supabase: SupabaseClient,
  postId: string,
): Promise<{ published: boolean; slug?: string; title?: string }> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("posts")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", postId)
    .eq("status", "draft")
    .select("slug, title")
    .maybeSingle();

  if (!data) return { published: false };
  return { published: true, slug: data.slug, title: data.title };
}
