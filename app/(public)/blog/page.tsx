import Image from "next/image";
import Link from "next/link";
import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import { getPublishedPosts, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "BLOG",
    description:
      "35歳からの髪・頭皮・肌・身体のことを、専門的になりすぎず分かりやすく。前橋の男性専用グルーミングサロンのブログ。",
    path: "/blog",
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function BlogPage() {
  const [settings, posts] = await Promise.all([
    getSettings(),
    getPublishedPosts(),
  ]);

  return (
    <>
      <PageHero
        en="Blog"
        title="BLOG"
        lead={"35歳からの髪・頭皮・肌・身体のこと。\n専門的になりすぎず、分かりやすくお伝えします。"}
      />

      <section className="py-16 md:py-24">
        <Container>
          {posts.length === 0 ? (
            <p className="py-10 text-center text-sm text-greige">
              記事は準備中です。もうしばらくお待ちください。
            </p>
          ) : (
            <FadeIn>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group"
                  >
                    <div className="relative mb-4 aspect-[3/2] overflow-hidden rounded-sm bg-paper-dark">
                      {post.cover_image_url && (
                        <Image
                          src={post.cover_image_url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mb-1 text-xs tracking-wider text-greige">
                      {formatDate(post.published_at)}
                    </p>
                    <h2 className="mb-2 font-serif-jp text-base text-ink group-hover:text-brown">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="line-clamp-2 text-sm text-charcoal-light">
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </FadeIn>
          )}
        </Container>
      </section>

      <CtaSection settings={settings} section="blog_bottom" />
    </>
  );
}
