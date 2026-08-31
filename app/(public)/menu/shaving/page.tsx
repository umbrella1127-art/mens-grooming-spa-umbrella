import Image from "next/image";
import CtaSection from "@/components/sections/CtaSection";
import MenuCard from "@/components/sections/MenuCard";
import PageHero from "@/components/sections/PageHero";
import RelatedLinkCard from "@/components/sections/RelatedLinkCard";
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
      "理容師免許を持つスタッフだけができる、男性の身だしなみを整えるグルーミングとしてのシェービング。鼻毛ワックス「サボテンノーズ」もオプションでご用意。前橋の男性専用サロン。",
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
          "顔の産毛を整えると、清潔感は驚くほど変わります。\n自分では手が届かない仕上がりを、プロの手で。"
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
                どれだけ良いスーツを着ていても、顔に産毛が目立っていては台無しです。
                産毛を整えるだけで肌のトーンが明るく見え、第一印象がはっきりと変わります。
              </p>
              <p>
                実はこのシェービング、理容師免許を持つスタッフだけができる技術です。
                一般的なエステサロンでは扱うことができません。
              </p>
              <p>
                定期的に産毛を整えておくことは、フェイシャルの仕上がりを引き出す土台にもなると言われています。
                カット＋ヘッドスパの各コースにも含まれているので、
                月に一度の来店で、髪も顔もまとめて整えて帰ることができます。
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-xl">
              {shaving && <MenuCard menu={shaving} />}
            </div>
          </FadeIn>
        </Container>
      </section>

      {cactus && (
        <section className="bg-paper-dark py-16 md:py-24">
          <Container>
            <SectionHeading en="Cactus Nose">
              サボテンノーズ（鼻毛ワックス）
            </SectionHeading>
            <FadeIn>
              <div className="grid items-center gap-8 md:grid-cols-2">
                {images.cactus_hero && (
                  <div className="relative aspect-[3/1] overflow-hidden rounded-sm md:aspect-square">
                    <Image
                      src={images.cactus_hero.url}
                      alt={images.cactus_hero.alt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="mb-4 text-sm leading-loose text-charcoal-light">
                    人前に立つ機会が多い方に人気のオプションです。商談や面接、デートの前など、
                    「今日はしっかり整えておきたい」という日にどうぞ。
                    シェービングやフェイシャルと組み合わせてご利用いただけます。
                  </p>
                  <MenuCard menu={cactus} />
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>
      )}

      <section className="py-12 md:py-16">
        <Container>
          <FadeIn>
            <RelatedLinkCard
              href="/menu/facial"
              imageUrl={images.facial_hero?.url}
              imageAlt={images.facial_hero?.alt}
              eyebrow="関連メニュー"
              title="フェイシャル"
              description="肌のことも、まとめて整えたい方へ。"
            />
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
