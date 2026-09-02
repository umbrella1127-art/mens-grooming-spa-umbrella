import CtaSection from "@/components/sections/CtaSection";
import MenuCard from "@/components/sections/MenuCard";
import PageHero from "@/components/sections/PageHero";
import RelatedLinkCard from "@/components/sections/RelatedLinkCard";
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
      "男性も、肌をプロに任せていい。肌測定・ハーブピーリング・美容機器で肌を整えるフェイシャルケア。前橋の男性専用サロン。",
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
  { title: "肌測定", body: "水分・油分を数値でチェック。" },
  { title: "ハーブピーリング", body: "毛穴・ニキビ跡に、古い角質からアプローチ。" },
  { title: "美容機器ケア", body: "「アネモネ」「Dr.Arrivo Ghost」を使い分け。" },
  { title: "オイルマッサージ", body: "指の腹と手のひらの温度で、表情筋をほぐす。" },
  { title: "美容液・パック", body: "ヒト幹細胞培養液・美容原液で仕上げ。" },
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
          </FadeIn>
        </Container>
      </section>

      <section className="bg-ink py-14 text-center md:py-20">
        <Container>
          <FadeIn>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-paper">
              1回で劇的に変わるものではありません。
              <br />
              月に一度、肌を整える習慣に。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Care">フェイシャルの内容</SectionHeading>
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CARE_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-sm border border-beige bg-paper-dark p-5"
                >
                  <p className="mb-1 font-serif-jp text-sm text-ink">
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed text-charcoal-light">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            {/* 動画枠: フェイシャル施術動画が用意でき次第ここに挿入する */}
          </FadeIn>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <FadeIn>
            <RelatedLinkCard
              href="/menu/shaving"
              imageUrl={images.shaving_hero?.url}
              imageAlt={images.shaving_hero?.alt}
              eyebrow="関連メニュー"
              title="シェービング"
              description="顔の産毛が気になる方は、こちらもどうぞ。"
            />
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Menu">メニュー</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-xl">
              {menus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-loose text-charcoal-light">
              グルーミングコースに含まれるフェイシャルは、その日の肌の状態に合わせて内容を組み合わせます。
              フェイシャル単品でご利用の場合は、2種類のフェイシャルからお選びいただけます（詳細はLINEでご案内します）。
            </p>
            <div className="mx-auto mt-6 max-w-xl rounded-sm border border-beige bg-paper p-6 text-center">
              <p className="mb-1 font-serif-jp text-base text-ink">
                ハーブピーリングの追加
              </p>
              <p className="text-sm leading-relaxed text-charcoal-light">
                毛穴やニキビ跡が気になる方には、古い角質からアプローチするハーブピーリングをプラスできます。
              </p>
              <p className="mt-3 text-sm text-greige">料金はLINEでご相談ください</p>
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
