import CtaSection from "@/components/sections/CtaSection";
import MenuCard from "@/components/sections/MenuCard";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getMenus, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "シェービング",
    description:
      "単なるヒゲ剃りではなく、男性の身だしなみを整えるグルーミングとしてのシェービング。鼻毛ワックス「サボテンノーズ」もオプションでご用意。前橋の男性専用サロン。",
    path: "/menu/shaving",
  });
}

export default async function ShavingPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenus(),
    getImages(),
  ]);
  const shaving = menus.find((m) => m.slug === "shaving");
  const cactus = menus.find((m) => m.slug === "cactus-nose");

  return (
    <>
      <PageHero
        en="Shaving"
        title="シェービング"
        lead={
          "顔の産毛とヒゲを整えると、清潔感は驚くほど変わります。\n自分では手が届かない仕上がりを、プロの手で。"
        }
        imageUrl={images.shaving_hero?.url}
        imageAlt={images.shaving_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Grooming">
            「剃る」ではなく、「整える」
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                当店のシェービングは、単なるヒゲ剃りではありません。
                顔全体の産毛、ヒゲのライン、眉まわりまで、男性の身だしなみを整えるグルーミングです。
              </p>
              <p>
                カット＋ヘッドスパの各コースに含まれているので、
                月に一度の来店で、髪も顔もまとめて整えて帰ることができます。
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
              {shaving && <MenuCard menu={shaving} />}
              {cactus && <MenuCard menu={cactus} />}
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        section="shaving_bottom"
        menu="shaving"
      />
    </>
  );
}
