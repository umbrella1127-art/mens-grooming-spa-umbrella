import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import CtaSection from "@/components/sections/CtaSection";
import Container from "@/components/ui/Container";
import { getPost, getPublishedPosts, getSettings } from "@/lib/cms";
import { articleJsonLd, buildMetadata, JsonLd } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? post.title,
    path: `/blog/${post.slug}`,
    ogImage: post.cover_image_url ?? undefined,
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [settings, post] = await Promise.all([getSettings(), getPost(slug)]);
  if (!post) notFound();

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <article className="py-14 md:py-20">
        <Container className="max-w-3xl">
          <p className="mb-3 text-xs tracking-wider text-greige">
            {formatDate(post.published_at)}
          </p>
          <h1 className="mb-8 text-2xl leading-relaxed text-ink md:text-3xl">
            {post.title}
          </h1>
          {post.cover_image_url && (
            <div className="relative mb-10 aspect-[2/1] overflow-hidden rounded-sm">
              <Image
                src={post.cover_image_url}
                alt=""
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="prose-custom text-sm leading-loose text-charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:border-l-2 [&_h2]:border-brown [&_h2]:pl-3 [&_h2]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_p]:mb-5 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-brown [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-beige [&_blockquote]:pl-4 [&_blockquote]:text-charcoal-light">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {post.body_markdown}
            </Markdown>
          </div>
          <div className="mt-12 border-t border-beige pt-6">
            <Link
              href="/blog"
              className="text-sm text-brown transition-opacity hover:opacity-70"
            >
              ← 記事一覧へ戻る
            </Link>
          </div>
        </Container>
      </article>

      <CtaSection
        settings={settings}
        heading="気になることがあれば、相談から。"
        body="記事の内容について聞いてみたい方も、LINEでお気軽にどうぞ。"
        section="blog_post_bottom"
      />
    </>
  );
}
