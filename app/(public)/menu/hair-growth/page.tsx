import CtaSection from "@/components/sections/CtaSection";
import FlowSteps from "@/components/sections/FlowSteps";
import MenuCard from "@/components/sections/MenuCard";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getMenusByCategory, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "育毛ケア",
    description:
      "「最近、髪が細くなった気がする」その感覚を、放置しない。頭皮診断で現状を確認しながら進める、KIRASUIを基本技術とした集中頭皮ケア。前橋の男性専用サロン。",
    path: "/menu/hair-growth",
  });
}

const FLOW = [
  { title: "カウンセリング", body: "髪と頭皮の気になることをお伺いします。" },
  { title: "頭皮診断", body: "頭皮の色・髪の太さ・密度をモニターで一緒に確認します。" },
  { title: "育毛施術", body: "KIRASUIを基本技術に、ハイドレーションウォーターを使用した頭皮ケアを行います。" },
  { title: "頭皮確認", body: "施術後の頭皮を再度確認します。" },
  { title: "アフターカウンセリング", body: "ご自宅でのケアと今後のペースをご提案します。" },
];

export default async function HairGrowthPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenusByCategory("hair_growth"),
    getImages(),
  ]);

  return (
    <>
      <PageHero
        en="Hair Growth Care"
        title="育毛ケア"
        lead={
          "「最近、髪が細くなった気がする」。\nその感覚を、そのままにしないための集中頭皮ケアです。"
        }
        imageUrl={images.hair_growth_hero?.url}
        imageAlt={images.hair_growth_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Approach">
            診断して、ケアして、また確認する
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                当店の育毛ケアは、頭皮診断から始まります。
                ご自身の頭皮を毎回モニターで確認しながら進めるので、
                「なんとなく続ける」ではなく、頭皮の状態と向き合いながらケアできます。
              </p>
              <p>
                通常のヘッドスパと工程は似ていますが、目的と使用する工程が異なる、
                育毛に特化したメニューです。おすすめの頻度は2週間に1回です。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Flow">施術の流れ</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl">
              <FlowSteps steps={FLOW} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Menu">メニュー・プログラム</SectionHeading>
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-3">
              {menus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-greige">
              プログラムの詳細・料金はLINEでご案内しています。
            </p>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="まずは、頭皮の状態を知ることから。"
        body="今の状態を見てから、続けるかどうか決めていただいて大丈夫です。"
        section="hair_growth_bottom"
        menu="hair_growth"
      />
    </>
  );
}
