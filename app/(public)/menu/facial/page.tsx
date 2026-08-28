import CtaSection from "@/components/sections/CtaSection";
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
    title: "メンズフェイシャル",
    description:
      "男性も、肌をプロに任せていい。肌の水分・油分を測定してから、オイルのハンドマッサージと美容機器で肌を整えるフェイシャルケア。前橋の男性専用サロン。",
    path: "/menu/facial",
  });
}

const CONCERNS = [
  "毛穴が気になる",
  "ニキビのあとが残っている",
  "年齢とともに肌質が変わってきた",
  "テカリ・脂っぽさが気になる",
];

const CARE_ITEMS = [
  {
    title: "肌測定",
    body: "簡易測定器で肌の水分・油分をチェック。今の肌を知るところから始めます。",
  },
  {
    title: "美容機器によるケア",
    body: "アネモネ、Dr.Arrivo Ghost を使用したフェイシャルケア。",
  },
  {
    title: "オイルのハンドマッサージ",
    body: "手のぬくもりで、顔まわりのこわばりをゆるめます。",
  },
  {
    title: "美容液・パック仕上げ",
    body: "ヒト幹細胞培養液・美容原液を使い、パックで仕上げます。",
  },
];

export default async function FacialPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenusByCategory("facial"),
    getImages(),
  ]);

  return (
    <>
      <PageHero
        en="Facial"
        title="フェイシャル"
        lead={
          "男性も、肌をプロに任せていい。\n「フェイシャルは女性のもの」と思っていた方にこそ、新しい選択肢です。"
        }
        imageUrl={images.facial_hero?.url}
        imageAlt={images.facial_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Concerns">こんな肌の変化に</SectionHeading>
          <FadeIn>
            <ul className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
              {CONCERNS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 rounded-sm bg-paper-dark px-5 py-4 text-sm"
                >
                  <span className="mt-0.5 text-brown">✓</span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              1回で劇的に変わるものではありません。継続して肌を整えていくケアとして、
              月に一度の習慣に組み込むことをおすすめしています。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Care">フェイシャルの内容</SectionHeading>
          <FadeIn>
            <div className="grid gap-5 sm:grid-cols-2">
              {CARE_ITEMS.map((item) => (
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
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Menu">メニュー</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-xl">
              {menus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="肌のことも、まとめて相談。"
        body="初回グルーミングにフェイシャルを組み合わせることもできます。LINEでご相談ください。"
        section="facial_bottom"
        menu="facial"
      />
    </>
  );
}
