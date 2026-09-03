import type { Metadata } from "next";
import type { Faq, Post, Settings } from "./types";

export const SITE_NAME = "MEN'S GROOMING SPA umbrella";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mensspa.umbrella1127.com";

const TITLE_SUFFIX = `｜${SITE_NAME}｜前橋 メンズサロン`;

export function buildMetadata({
  title,
  description,
  path,
  ogImage,
}: {
  title?: string;
  description: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const fullTitle = title ? `${title}${TITLE_SUFFIX}` : `${SITE_NAME}｜前橋の男性専用グルーミングサロン`;
  const url = `${SITE_URL}${path}`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "website",
      images: [ogImage ?? "/ogp-default.png"],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** HairSalon の JSON-LD。電話番号は方針により掲載しない。 */
export function localBusinessJsonLd(settings: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: SITE_NAME,
    description:
      "群馬県前橋市の男性専用グルーミングサロン。カット・シェービング・ヘッドスパ・頭皮診断・フェイシャル・育毛まで、男性の美容とメンテナンスをまとめて相談できます。",
    url: SITE_URL,
    image: `${SITE_URL}/ogp-default.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "群馬県",
      addressLocality: "前橋市",
      streetAddress: "小相木町388-1",
    },
    geo: { "@type": "GeoCoordinates", latitude: 36.3833, longitude: 139.0364 },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "12:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "10:00",
        closes: "19:00",
      },
    ],
    priceRange: "¥¥",
    sameAs: settings.line_url ? [settings.line_url] : [],
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
