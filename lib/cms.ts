// CMSデータ取得層。すべて unstable_cache でタグ付きキャッシュし、
// 管理画面の Server Action から revalidateTag() で即時反映する。
// Supabase 未設定時は fallback-data を返す（開発初期・障害時の保険）。
import { unstable_cache } from "next/cache";
import {
  fallbackFaqs,
  fallbackImages,
  fallbackMenus,
  fallbackPosts,
  fallbackSettings,
} from "./fallback-data";
import { getPublicClient, supabaseConfigured } from "./supabase/public";
import type { Faq, ImageSlot, Menu, Post, SettingRow, Settings } from "./types";

export const CACHE_TAGS = {
  settings: "settings",
  menus: "menus",
  faqs: "faqs",
  posts: "posts",
  images: "images",
} as const;

export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    if (!supabaseConfigured()) return fallbackSettings;
    const { data, error } = await getPublicClient()
      .from("site_settings")
      .select("key, value");
    if (error || !data) return fallbackSettings;
    const settings: Settings = { ...fallbackSettings };
    for (const row of data as Pick<SettingRow, "key" | "value">[]) {
      settings[row.key] = row.value?.text ?? JSON.stringify(row.value);
    }
    return settings;
  },
  ["settings"],
  { tags: [CACHE_TAGS.settings] },
);

export const getMenus = unstable_cache(
  async (): Promise<Menu[]> => {
    if (!supabaseConfigured()) return fallbackMenus;
    const { data, error } = await getPublicClient()
      .from("menus")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error || !data) return fallbackMenus;
    return data as Menu[];
  },
  ["menus"],
  { tags: [CACHE_TAGS.menus] },
);

export async function getMenusByCategory(category: Menu["category"]) {
  const menus = await getMenus();
  return menus.filter((m) => m.category === category);
}

export const getFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    if (!supabaseConfigured()) return fallbackFaqs;
    const { data, error } = await getPublicClient()
      .from("faqs")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error || !data) return fallbackFaqs;
    return data as Faq[];
  },
  ["faqs"],
  { tags: [CACHE_TAGS.faqs] },
);

export const getImages = unstable_cache(
  async (): Promise<Record<string, ImageSlot>> => {
    let rows: ImageSlot[] = fallbackImages;
    if (supabaseConfigured()) {
      const { data, error } = await getPublicClient().from("images").select("*");
      if (!error && data && data.length > 0) rows = data as ImageSlot[];
    }
    return Object.fromEntries(rows.map((r) => [r.slot_key, r]));
  },
  ["images"],
  { tags: [CACHE_TAGS.images] },
);

export const getPublishedPosts = unstable_cache(
  async (): Promise<Post[]> => {
    if (!supabaseConfigured()) return fallbackPosts;
    const { data, error } = await getPublicClient()
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return fallbackPosts;
    return data as Post[];
  },
  ["posts"],
  { tags: [CACHE_TAGS.posts] },
);

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
