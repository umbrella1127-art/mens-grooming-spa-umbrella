import Link from "next/link";
import { getServerClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { createPost } from "../actions/posts";

export default async function AdminPostsPage() {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, status, published_at, updated_at")
    .order("updated_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">ブログ</h1>

      <form
        action={createPost}
        className="mb-8 flex gap-3 rounded-sm border border-beige bg-white p-5"
      >
        <input
          name="title"
          required
          placeholder="新しい記事のタイトル"
          className="flex-1 rounded border border-beige px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-ink px-6 py-2 text-sm text-white"
        >
          作成
        </button>
      </form>

      <div className="overflow-hidden rounded-sm border border-beige bg-white">
        {posts.length === 0 && (
          <p className="p-6 text-sm text-charcoal-light">記事はまだありません。</p>
        )}
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/admin/posts/${post.id}`}
            className="flex items-center justify-between border-b border-beige/60 px-5 py-4 last:border-b-0 hover:bg-paper-dark"
          >
            <div>
              <p className="text-sm font-medium">{post.title}</p>
              <p className="text-xs text-greige">/blog/{post.slug}</p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs ${
                post.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-paper-dark text-charcoal-light"
              }`}
            >
              {post.status === "published" ? "公開中" : "下書き"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
