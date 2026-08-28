import Image from "next/image";
import Container from "@/components/ui/Container";

/** 下層ページ共通のヒーロー。落ち着いた暗めのトーンで統一。 */
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
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      {imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/60 to-ink/85" />
        </>
      )}
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
