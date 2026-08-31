import Image from "next/image";
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

const CASES = [
  {
    label: "33歳男性",
    days: "39日間",
    stat: "-9.5kg",
    detail: "体重 89.6kg→80.1kg／体脂肪率 26.7%→19.7%／ウエスト -5.0cm",
    imageSlot: "slimming_case1" as const,
  },
  {
    label: "42歳男性",
    days: "27日間",
    stat: "-8.5kg",
    detail: "体重 86.0kg→77.5kg／BMI 29.4→26.5／ウエスト -8.5cm",
    imageSlot: "slimming_case2" as const,
  },
];

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

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Results">施術記録の一例</SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              実際に施術を受けたお客様の、3Dボディスキャンによる記録です。
            </p>
            <div className="grid gap-8 sm:grid-cols-2">
              {CASES.map((c) => {
                const img = images[c.imageSlot];
                return (
                  <div
                    key={c.label}
                    className="overflow-hidden rounded-sm border border-beige bg-paper"
                  >
                    {img && (
                      <div className="relative aspect-[5/5] w-full bg-white">
                        <Image
                          src={img.url}
                          alt={img.alt}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="p-6 text-center">
                      <p className="mb-3 text-xs tracking-wider text-greige">
                        {c.label}
                      </p>
                      <p className="mb-2 font-serif-jp text-3xl text-ink md:text-4xl">
                        {c.days}で {c.stat}
                      </p>
                      <p className="text-xs leading-relaxed text-charcoal-light">
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-loose text-greige">
              ※これは実際に施術を受けたお客様の記録です。食事・運動指導と合わせた結果であり、
              効果を保証するものではありません。結果には個人差があります。
            </p>
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
