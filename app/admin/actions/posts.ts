"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cms";
import { requireAdmin } from "./helpers";

function slugify(input: string) {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ぁ-んァ-ン一-龠ー]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || `post-${Date.now()}`;
}

export async function createPost(formData: FormData) {
  const supabase = await requireAdmin();
  const title = (formData.get("title") as string) || "無題の記事";
  const slugInput = ((formData.get("slug") as string) || "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(title);

  const { data, error } = await supabase
    .from("posts")
    .insert({ title, slug, body_markdown: "" })
    .select("id")
    .single();
  if (error) throw new Error(`作成に失敗しました (${error.message})`);
  redirect(`/admin/posts/${data.id}`);
}

export async function updatePost(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const publish = formData.get("$action") === "publish";
  const unpublish = formData.get("$action") === "unpublish";

  const { data: current, error: fetchError } = await supabase
    .from("posts")
    .select("status, published_at")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const status = publish ? "published" : unpublish ? "draft" : current.status;
  const published_at =
    publish && !current.published_at
      ? new Date().toISOString()
      : current.published_at;

  const { error } = await supabase
    .from("posts")
    .update({
      title: formData.get("title") as string,
      slug: slugify((formData.get("slug") as string) || ""),
      excerpt: ((formData.get("excerpt") as string) || "").trim() || null,
      body_markdown: (formData.get("body_markdown") as string) || "",
      meta_title: ((formData.get("meta_title") as string) || "").trim() || null,
      meta_description:
        ((formData.get("meta_description") as string) || "").trim() || null,
      cover_image_url:
        ((formData.get("cover_image_url") as string) || "").trim() || null,
      status,
      published_at,
    })
    .eq("id", id);
  if (error) throw new Error(`保存に失敗しました (${error.message})`);

  revalidateTag(CACHE_TAGS.posts, "max");
  revalidatePath("/", "layout");
  redirect(`/admin/posts/${id}?saved=1`);
}

export async function deletePost(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", formData.get("id") as string);
  if (error) throw new Error(`削除に失敗しました (${error.message})`);
  revalidateTag(CACHE_TAGS.posts, "max");
  revalidatePath("/", "layout");
  redirect("/admin/posts");
}
