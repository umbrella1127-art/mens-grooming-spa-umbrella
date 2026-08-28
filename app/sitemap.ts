import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/cms";
import { SITE_URL } from "@/lib/seo";

const STATIC_PATHS = [
  "",
  "/first-visit",
  "/menu/first-grooming",
  "/menu/head-spa",
  "/menu/facial",
  "/menu/shaving",
  "/menu/hair-growth",
  "/menu/inner-beauty",
  "/menu/slimming",
  "/gift",
  "/about",
  "/membership",
  "/faq",
  "/blog",
  "/access",
  "/reserve",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
