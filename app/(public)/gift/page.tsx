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
    title: "ギフト",
    description:
      "大切な男性に「整える時間」を贈る。ヘッドスパ・シェービング・フェイシャルのギフト体験。奥様からご主人へ、お子様からお父様へ。前橋の男性専用サロン。",
    path: "/gift",
  });
}

const GIFT_FOR = [
  { from: "奥様から", to: "いつも頑張っているご主人へ" },
  { from: "パートナーから", to: "大切な人へ" },
  { from: "お子様から", to: "お父さんへ、父の日や誕生日に" },
  { from: "あなたから", to: "お世話になっているあの人へ" },
];

export default async function GiftPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <PageHero
        en="Gift"
        title="ギフト"
        lead={settings.gift_lead_text}
        imageUrl={images.gift_hero?.url}
        imageAlt={images.gift_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Experience">
            金額ではなく、体験を贈る
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                umbrellaのギフトは、金券ではなく「体験」です。
                ヘッドスパ35分＋シェービング＋フェイシャルを組み合わせた、
                男性のためのご褒美時間をそのまま贈れます（カットは含みません）。
              </p>
              <p>
                自分ではなかなかヘッドスパやフェイシャルに行かない男性にこそ、
                贈り物として体験してもらいたい内容です。
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
              {GIFT_FOR.map((g) => (
                <div key={g.from} className="rounded-sm bg-paper-dark p-5">
                  <p className="mb-1 text-xs tracking-wider text-brown">
                    {g.from}
                  </p>
                  <p className="text-sm text-charcoal">{g.to}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-greige">
              {settings.gift_note}
            </p>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="ギフトについて、LINEで相談する"
        body="贈る相手やご予算に合わせてご案内します。お渡し方法もご相談ください。"
        section="gift_bottom"
        menu="gift"
      />
    </>
  );
}
