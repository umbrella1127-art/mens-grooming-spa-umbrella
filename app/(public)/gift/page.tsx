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
      "贈るのは、金額ではなく、自分を整える時間。ヘッドスパ＋シェービング＋フェイシャルのギフト体験。奥様からご主人へ、お子様からお父様へ。前橋の男性専用サロン。",
    path: "/gift",
  });
}

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
            贈るのは、金額ではなく、自分を整える時間。
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-10 max-w-2xl text-center font-serif-jp text-base leading-loose text-brown">
              大切な方へ、体験を贈る。
              <br />
              umbrellaのギフト。
            </p>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                毎日頑張っているご主人へ。
                <br />
                父の日や誕生日に、お父さんへ。
                <br />
                お世話になった大切な方へ。
              </p>
              <p>
                ヘッドスパ＋シェービング＋フェイシャルを組み合わせた、
                男性のためのご褒美時間をそのまま贈れます。
              </p>
              <p>
                温かなタオルに包まれ、頭から顔までゆっくり整える。
                普段は自分からヘッドスパやフェイシャルへ行かない男性にも、
                喜んでいただける体験です。
              </p>
              <p>ギフトの内容は、ご希望に合わせてご相談いただけます。</p>
            </div>
            <p className="mt-8 text-center text-xs text-greige">
              贈る相手やご予算、目的などをLINEでお送りください。
              <br />
              ご希望を伺いながら、贈り方をご案内します。
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
