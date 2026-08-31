import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** 関連ページへの画像付き誘導バナー */
export default function RelatedLinkCard({
  href,
  imageUrl,
  imageAlt,
  eyebrow,
  title,
  description,
}: {
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group mx-auto flex max-w-2xl items-center gap-5 overflow-hidden rounded-sm border border-beige bg-paper transition-colors hover:border-brown"
    >
      {imageUrl && (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-32">
          <Image
            src={imageUrl}
            alt={imageAlt ?? ""}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 items-center justify-between gap-3 py-4 pr-5">
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs tracking-wider text-brown">{eyebrow}</p>
          )}
          <p className="mb-1 font-serif-jp text-base text-ink">{title}</p>
          <p className="text-xs text-charcoal-light">{description}</p>
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-greige transition-transform group-hover:translate-x-1 group-hover:text-brown"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
