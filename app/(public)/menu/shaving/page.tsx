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
      "理容師免許を持つプロが行う、理容室ならではのグルーミング。温かな蒸しタオルときめ細かな泡で、顔から首元まで丁寧に整えます。前橋の男性専用サロン。",
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
        title="顔まで整えて、男は仕上がる。"
        lead={
          "温かなタオルに包まれ、きめ細かな泡が肌にのる。\n目を閉じて、プロの手に身を預ける静かな時間。\n顔の産毛や首元まで整えたあと、鏡に映るのは、\n清潔感と少しの自信を取り戻した自分です。"
        }
        imageUrl={images.shaving_hero?.url}
        imageAlt={images.shaving_hero?.alt}
      />

      {/* シェービングの価値 */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Grooming">
            「剃る」のではなく、顔まで整える。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                一日の仕事を終え、理容椅子に深く身を預ける。
                温かな蒸しタオルで顔を包まれると、張りつめていた力がゆっくりと抜けていきます。
                やわらかな泡が肌に広がり、あとは目を閉じて、プロの手に任せるだけ。
              </p>
              <p>
                頬、もみあげの境目、顎の下、首筋。
                自分では見えにくく、手が届きにくいところまで丁寧に整えていきます。
              </p>
              <p>
                顔の産毛が整うと、肌は明るくなめらかに見え、顔全体がすっきりとした印象になります。
                派手に変わるわけではありません。
                それでも鏡を見た瞬間に、
                <br />
                「今日の自分は、少しいい」
                <br />
                そう感じられるはずです。
              </p>
              <p>
                髪型や服装だけでなく、顔まできちんと手入れされている。
                その小さな違いが、大人の男性の清潔感と、自然なかっこよさにつながります。
                理容師免許を持つプロが行う、理容室ならではのグルーミングです。
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-xl">
              {shaving && <MenuCard menu={shaving} />}
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* MEN'S GROOMING SPA umbrellaの価値 */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Total Grooming" tone="light">
            月に一度、髪も顔も疲れも整える。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-beige">
              <p>
                MEN&apos;S GROOMING SPA
                umbrellaには、髪型を整えるカット、日々の疲れをゆるめるヘッドスパ、顔まわりの清潔感を引き出すシェービング、年齢とともに変化する肌をケアするフェイシャルなど、男を整えるためのメニューが揃っています。
                すべてを一度に受ける必要はありません。
                その日の疲れや悩み、なりたい自分に合わせて、必要なメニューを選んでいただけます。
              </p>
              <p>
                髪を整えたい。
                <br />
                疲れをリセットしたい。
                <br />
                肌をきれいに見せたい。
                <br />
                今より、もう少しかっこよくなりたい。
              </p>
              <p>そんな男性が、自分自身を定期的に整え直せる場所です。</p>
              <p>
                仕事帰りに理容椅子へ座り、目を閉じる。
                施術が終わって鏡を見たとき、来店したときよりも少し気持ちが上向き、自然と背筋が伸びる。
              </p>
              <p>私たちが提供したいのは、見た目だけでなく、気持ちまで整う時間です。</p>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* サボテンノーズ */}
      {cactus && (
        <section className="bg-paper-dark py-16 md:py-24">
          <Container>
            <SectionHeading en="Cactus Nose">
              自分では気づきにくいところまで、抜かりなく。
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
                  <div className="mb-4 space-y-4 text-sm leading-loose text-charcoal-light">
                    <p>
                      顔全体が整うと、最後に気になるのが鼻まわりです。
                      鼻毛は自分では確認しにくく、ふとした角度や明るい場所で目立ってしまうことがあります。
                    </p>
                    <p>
                      大切な商談、会食、面接、デート。
                      <br />
                      「今日は、いつも以上にきちんと整えておきたい」
                      <br />
                      そんな日の仕上げにおすすめです。
                    </p>
                    <p>シェービングやフェイシャルと組み合わせてご利用いただけます。</p>
                  </div>
                  <MenuCard menu={cactus} />
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>
      )}

      {/* 関連メニュー */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Related Menu">
            シェービングのあと、肌まで整えたい方へ。
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              シェービングで顔まわりを整えたあとは、肌そのものをケアするフェイシャルもおすすめです。
              乾燥、テカリ、毛穴、年齢による肌の変化。
              自分では何をすればいいか分からない悩みも、まとめてご相談ください。
            </p>
            <RelatedLinkCard
              href="/menu/facial"
              imageUrl={images.facial_hero?.url}
              imageAlt={images.facial_hero?.alt}
              eyebrow="関連メニュー"
              title="フェイシャル"
              description="顔の身だしなみから、肌のメンテナンスまで。今より清潔感のある自分を目指したい男性のためのフェイシャルケアです。"
            />
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading={
          "最近、少し疲れて見える。\nそんな感覚だけでも大丈夫です。"
        }
        body={
          "「自分には何が必要なのか分からない」\n「大切な予定の前に、きちんと整えたい」\n「今より、もう少しかっこよくなりたい」\nご相談のきっかけは、それだけで十分です。\nお悩みやご希望をLINEでお送りください。\nあなたに合った整え方をご案内します。"
        }
        section="shaving_bottom"
        menu="shaving"
      />
    </>
  );
}
