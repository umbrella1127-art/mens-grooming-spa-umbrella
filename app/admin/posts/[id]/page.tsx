import Link from "next/link";
import { notFound } from "next/navigation";
import SavedBanner from "@/components/admin/SavedBanner";
import { getServerClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { deletePost, updatePost } from "../../actions/posts";

export default async function AdminPostEditPage({
  params,
  searchParams,
}: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const post = data as Post;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">記事の編集</h1>
        <Link href="/admin/posts" className="text-sm text-blue-600">
          ← 記事一覧へ
        </Link>
      </div>
      <SavedBanner show={saved === "1"} />

      <form
        action={updatePost}
        className="space-y-4 rounded-sm border border-beige bg-white p-6"
      >
        <input type="hidden" name="id" value={post.id} />
        <div>
          <label className="mb-1 block text-xs text-charcoal-light">
            タイトル
          </label>
          <input
            name="title"
            required
            defaultValue={post.title}
            className="w-full rounded border border-beige px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-charcoal-light">
              URL（半角英数字とハイフン）
            </label>
            <input
              name="slug"
              required
              defaultValue={post.slug}
              className="w-full rounded border border-beige px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-charcoal-light">
              カバー画像URL（任意）
            </label>
            <input
              name="cover_image_url"
              defaultValue={post.cover_image_url ?? ""}
              className="w-full rounded border border-beige px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-charcoal-light">
            概要（一覧・検索結果に表示）
          </label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={post.excerpt ?? ""}
            className="w-full rounded border border-beige px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-charcoal-light">
            本文（Markdown。## で見出し、- で箇条書き）
          </label>
          <textarea
            name="body_markdown"
            rows={20}
            defaultValue={post.body_markdown}
            className="w-full rounded border border-beige px-3 py-2 font-mono text-sm"
          />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-charcoal-light">
            SEO設定（任意）
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <input
              name="meta_title"
              placeholder="検索結果用タイトル"
              defaultValue={post.meta_title ?? ""}
              className="w-full rounded border border-beige px-3 py-2 text-sm"
            />
            <input
              name="meta_description"
              placeholder="検索結果用説明文"
              defaultValue={post.meta_description ?? ""}
              className="w-full rounded border border-beige px-3 py-2 text-sm"
            />
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-3 border-t border-beige/60 pt-5">
          <button
            type="submit"
            className="rounded border border-neutral-900 px-6 py-2 text-sm"
          >
            下書き保存
          </button>
          {post.status === "published" ? (
            <button
              type="submit"
              name="$action"
              value="unpublish"
              className="rounded bg-amber-600 px-6 py-2 text-sm text-white"
            >
              非公開に戻す
            </button>
          ) : (
            <button
              type="submit"
              name="$action"
              value="publish"
              className="rounded bg-green-700 px-6 py-2 text-sm text-white"
            >
              保存して公開
            </button>
          )}
          <span className="text-xs text-greige">
            現在: {post.status === "published" ? "公開中" : "下書き"}
          </span>
          {post.status === "published" && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              className="text-xs text-blue-600 hover:underline"
            >
              公開ページを見る ↗
            </a>
          )}
        </div>
      </form>

      <form action={deletePost} className="mt-4">
        <input type="hidden" name="id" value={post.id} />
        <button type="submit" className="text-xs text-red-500 hover:underline">
          この記事を削除
        </button>
      </form>
    </div>
  );
}
