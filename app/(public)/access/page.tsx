import Image from "next/image";
import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getSettings } from "@/lib/cms";
import { buildMetadata, JsonLd, localBusinessJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "アクセス・営業時間",
    description:
      "群馬県前橋市小相木町388-1。無料駐車場19台完備でお車でのご来店が便利です。平日12:00〜21:00、土日祝10:00〜19:00。完全予約制の男性専用サロン。",
    path: "/access",
  });
}

export default async function AccessPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <JsonLd data={localBusinessJsonLd(settings)} />
      <PageHero
        en="Access"
        title="アクセス・営業時間"
        lead={`${settings.address}\n${settings.parking}`}
        imageUrl={images.access_entrance?.url}
        imageAlt={images.access_entrance?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid gap-10 md:grid-cols-2">
            <FadeIn>
              <SectionHeading en="Information" align="left">
                店舗情報
              </SectionHeading>
              <dl className="space-y-5 text-sm">
                <div>
                  <dt className="mb-1 text-xs tracking-wider text-brown">店名</dt>
                  <dd className="text-charcoal">{settings.shop_name}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs tracking-wider text-brown">住所</dt>
                  <dd className="text-charcoal">{settings.address}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs tracking-wider text-brown">
                    営業時間
                  </dt>
                  <dd className="text-charcoal">
                    平日 {settings.business_hours_weekday}
                    <br />
                    土日祝 {settings.business_hours_weekend}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs tracking-wider text-brown">
                    定休日
                  </dt>
                  <dd className="text-charcoal">
                    {settings.closed_days}・完全予約制
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs tracking-wider text-brown">
                    駐車場
                  </dt>
                  <dd className="text-charcoal">{settings.parking}</dd>
                </div>
              </dl>
              <p className="mt-6 text-xs leading-loose text-greige">
                {settings.hours_note}
              </p>
              <p className="mt-2 text-xs leading-loose text-greige">
                {settings.access_note}
              </p>
            </FadeIn>
            <FadeIn delay={150}>
              {images.access_entrance ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm md:h-full md:aspect-auto">
                  <Image
                    src={images.access_entrance.url}
                    alt={images.access_entrance.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <p className="mt-3 text-center text-xs text-greige">
                この看板が目印です。
              </p>
            </FadeIn>
          </div>
        </Container>
      </section>

      <section className="pb-16 md:pb-24">
        <Container>
          <FadeIn>
            <div className="h-80 overflow-hidden rounded-sm">
              <iframe
                title="MEN'S GROOMING SPA umbrella の地図"
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address + " umbrella")}&output=embed`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection settings={settings} section="access_bottom" />
    </>
  );
}
