import {
  Activity,
  Droplet,
  Droplets,
  Sparkles,
  Zap,
} from "lucide-react";
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
      "「最近、髪が細くなった気がする」その感覚を、放置しない。頭皮診断で現状を確認しながら進める、集中頭皮ケア。前橋の男性専用サロン。",
    path: "/menu/hair-growth",
  });
}

const FLOW = [
  { title: "カウンセリング", body: "髪と頭皮の気になることをお伺いします。" },
  { title: "頭皮診断", body: "頭皮の色・髪の太さ・密度をモニターで一緒に確認します。" },
  { title: "育毛施術", body: "ハイドレーションウォーターを使用した頭皮ケアを行います。" },
  { title: "頭皮確認", body: "施術後の頭皮を再度確認します。" },
  { title: "アフターカウンセリング", body: "ご自宅でのケアと今後のペースをご提案します。" },
];

const FIVE_ELEMENTS = [
  { step: "01", title: "洗う", body: "毛穴を清潔に", icon: Droplets },
  { step: "02", title: "潤す", body: "頭皮を保湿", icon: Droplet },
  { step: "03", title: "整える", body: "毛根まわりをケア", icon: Sparkles },
  { step: "04", title: "巡らせる", body: "頭皮をマッサージ", icon: Activity },
  { step: "05", title: "補う", body: "材料とエネルギー", icon: Zap },
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

      {/* Five Elements */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Five Elements" tone="light">
            育毛を、塗るだけで終わらせない。
          </SectionHeading>
          <FadeIn>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {FIVE_ELEMENTS.map((el) => (
                <div
                  key={el.step}
                  className="rounded-sm bg-charcoal p-5 text-center"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-beige/40">
                    <el.icon
                      className="h-4 w-4 text-beige"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mb-1 font-serif-jp text-base text-paper">
                    {el.title}
                  </p>
                  <p className="text-xs text-beige">{el.body}</p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-14 max-w-2xl space-y-4 text-sm leading-loose text-beige">
              <h3 className="mb-2 font-serif-jp text-lg text-paper">
                5つを、ひとつの流れとして。
              </h3>
              <p>
                このコースで大切にしているのは、最後に使用するスカルプローションだけではありません。
              </p>
              <p>
                まず頭皮を清潔にし、うるおいを与え、髪をつくる毛根まわりをケアする。
                さらにマッサージで巡りを促してから、髪に必要なものを補います。
              </p>
              <p>
                5つの工程は、それぞれが独立しているのではなく、次のケアにつなげるための一つの流れです。
              </p>
              <p>
                今見えている髪だけをケアするのではなく、これからの髪を支える頭皮環境から整えていく。
              </p>
              <p>
                育毛剤を塗るだけで終わらないことが、この育毛コースの特徴です。
              </p>
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
              プログラムの詳細はLINEでご案内しています。
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
