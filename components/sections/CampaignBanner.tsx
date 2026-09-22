import Image from "next/image";
import LineCtaLink from "@/components/analytics/LineCtaLink";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import { CAMPAIGN_BANNER } from "@/lib/campaign";
import type { ImageSlot, Settings } from "@/lib/types";

/** 期間限定・新規限定キャンペーンの告知バナー。表示可否は呼び出し側で isCampaignActive() を見て判断する。 */
export default function CampaignBanner({
  settings,
  image,
}: {
  settings: Settings;
  image?: ImageSlot;
}) {
  const c = CAMPAIGN_BANNER;

  return (
    <section className="border-y border-beige bg-paper-dark py-12 md:py-16">
      <Container>
        <FadeIn>
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            {image && (
              <div className="order-1 md:order-2">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={640}
                  height={480}
                  className="rounded-sm object-cover"
                />
              </div>
            )}
            <div className="order-2 md:order-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-brown px-3 py-1 text-[11px] tracking-wider text-paper">
                  {c.periodLabel}
                </span>
                <span className="rounded-sm border border-brown px-3 py-1 text-[11px] tracking-wider text-brown">
                  {c.badgeLabel}
                </span>
              </div>
              <p className="mb-2 text-xs tracking-[0.2em] text-brown">
                {c.eyebrow}
              </p>
              <h2 className="mb-4 whitespace-pre-line text-xl leading-relaxed text-ink md:text-2xl">
                {c.heading}
              </h2>
              <p className="mb-2 text-sm leading-loose text-charcoal-light">
                {c.body}
              </p>
              <p className="mb-6 text-xs text-greige">{c.note}</p>

              <div className="mb-6 border-t border-beige pt-5">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-brown">
                  {c.menuLabel}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-xs text-greige line-through">
                    通常価格 {c.originalPrice}
                  </span>
                  <span className="font-serif-jp text-2xl text-brown md:text-3xl">
                    {c.campaignPrice}
                    <span className="ml-1 text-xs">（税込）</span>
                  </span>
                </div>
                <p className="mt-2 text-xs text-greige">
                  {c.duration} ／ {c.audience}
                </p>
              </div>

              <LineCtaLink
                href={settings.line_url}
                ctaType="line_campaign"
                section="campaign_banner"
                className="inline-block rounded-sm bg-ink px-10 py-4 text-sm tracking-wider text-paper transition-opacity hover:opacity-85"
              >
                LINEで予約する
              </LineCtaLink>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
