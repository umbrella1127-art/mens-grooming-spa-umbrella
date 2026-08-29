import Image from "next/image";
import Container from "@/components/ui/Container";

/**
 * 下層ページ共通のヒーロー。
 * 写真を主役にする：下端だけに影を落とし、上〜中央は鮮明に見せる。
 * 文字は下端の帯に乗せ、写真を暗く沈めない。
 */
export default function PageHero({
  en,
  title,
  lead,
  imageUrl,
  imageAlt = "",
}: {
  en?: string;
  title: string;
  lead?: string;
  imageUrl?: string;
  imageAlt?: string;
}) {
  if (!imageUrl) {
    return (
      <section className="relative overflow-hidden bg-ink text-paper">
        <Container className="relative py-20 md:py-28">
          {en && (
            <p className="mb-4 text-xs tracking-[0.35em] uppercase text-beige">
              {en}
            </p>
          )}
          <h1 className="mb-5 text-3xl md:text-4xl">{title}</h1>
          {lead && (
            <p className="max-w-2xl whitespace-pre-line text-sm text-beige md:text-base">
              {lead}
            </p>
          )}
        </Container>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[62svh] items-end overflow-hidden bg-ink text-paper md:min-h-[68svh]">
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
      {/* 下端だけに影。写真の上〜中央は鮮明なまま。 */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
      <Container className="relative pt-16 pb-10 md:pb-14">
        {en && (
          <p className="mb-4 text-xs tracking-[0.35em] uppercase text-beige">
            {en}
          </p>
        )}
        <h1 className="mb-5 text-3xl md:text-5xl">{title}</h1>
        {lead && (
          <p className="max-w-2xl whitespace-pre-line text-sm text-beige md:text-base">
            {lead}
          </p>
        )}
      </Container>
    </section>
  );
}
