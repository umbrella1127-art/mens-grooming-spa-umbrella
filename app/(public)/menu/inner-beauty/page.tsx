import Link from "next/link";
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
    title: "インナービューティー",
    description:
      "外側だけではなく、内側からも自分を整える。食事相談・ファスティング相談など、身体の内側からのケアを相談できます。前橋の男性専用サロン。",
    path: "/menu/inner-beauty",
  });
}

const CONSULT_ITEMS = [
  {
    title: "食事相談",
    body: "毎日の食事を、無理のない範囲でどう整えるか。続けられる形で一緒に考えます。",
  },
  {
    title: "ファスティング相談",
    body: "ファスティングカウンセラーの資格を持つオーナーが、正しい進め方をご案内します。",
  },
  {
    title: "インナービューティー相談",
    body: "疲れやすさ、身体の重さ、肌の調子。内側からのアプローチを一緒に探します。",
  },
];

export default async function InnerBeautyPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <PageHero
        en="Inner Beauty"
        title="インナービューティー"
        lead={
          "外側だけ整えても、十分ではない。\n身体の内側からのケアを相談できるのが、このサロンの特徴です。"
        }
        imageUrl={images.inner_beauty_hero?.url}
        imageAlt={images.inner_beauty_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Story">
            オーナー自身が、体験者です
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                オーナーの井上は、インナービューティーを取り入れて79.5kgから63kgへ体型が変わりました。
                変わったのは体型だけではありません。肌の調子、疲れにくさ、そして気持ちの前向きさまで。
              </p>
              <p>
                人は年齢を重ねます。だからこそ、外側の美容と内側からのケアの両方が大切だと考えています。
                この体験があるから、机上の知識ではない相談ができます。
              </p>
              <p>
                <Link href="/about" className="border-b border-brown pb-0.5 text-brown">
                  井上のストーリーを詳しく見る
                </Link>
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Consultation">相談できること</SectionHeading>
          <FadeIn>
            <div className="grid gap-5 md:grid-cols-3">
              {CONSULT_ITEMS.map((item) => (
                <div key={item.title} className="rounded-sm border border-beige bg-paper p-6">
                  <p className="mb-2 font-serif-jp text-base text-ink">
                    {item.title}
                  </p>
                  <p className="text-sm leading-loose text-charcoal-light">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-loose text-greige">
              ご希望の方にはエステプロラボ社の商品もご案内していますが、販売が目的ではありません。
              まずは相談から。合わないと感じたら断っていただいて大丈夫です。
            </p>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="内側のことも、気軽に相談を。"
        body="ヘッドスパやカットのついでに聞いてみる、でも大丈夫です。"
        section="inner_beauty_bottom"
        menu="inner_beauty"
      />
    </>
  );
}
