import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "メンズ痩身",
    description:
      "男性も、身体を整えるケアを。エステ設備を利用した男性向け痩身ケアを完全予約制でご提供。食事・インナービューティー相談と組み合わせて。前橋の男性専用サロン。",
    path: "/menu/slimming",
  });
}

export default async function SlimmingPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <PageHero
        en="Body Care"
        title="メンズ痩身"
        lead={
          "髪・頭皮・肌だけでなく、身体も。\n男性の美容とメンテナンスを、まとめて相談できる場所として。"
        }
        imageUrl={images.slimming_hero?.url}
        imageAlt={images.slimming_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="About">
            完全予約制の、身体のケア
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                隣接するエステサロンの設備を利用した、男性向けの痩身ケアです。
                他のお客様と顔を合わせにくい完全予約制でご提供しています。
              </p>
              <p>
                痩身の施術だけで完結するものではなく、食事相談・インナービューティー相談と
                組み合わせることで、無理なく身体を整えていくことを大切にしています。
              </p>
              <p className="text-xs text-greige">
                内容・料金はカウンセリングの際にご案内します。まずはLINEでご相談ください。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="身体のことも、相談してみる。"
        body="「痩身に興味がある」とLINEでお送りください。詳細をご案内します。"
        section="slimming_bottom"
        menu="slimming"
      />
    </>
  );
}
