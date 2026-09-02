import Image from "next/image";
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

const HERBPEEL_CONCERNS = [
  "額や鼻まわりのテカリが気になる",
  "毛穴の黒ずみや皮脂汚れが目立つ",
  "肌がざらつき、ごわついている",
  "顔色がくすみ、疲れて見える",
  "脂っぽいのに、洗顔後はつっぱる",
  "肌を整えたいけれど、何をすればよいか分からない",
];

const HERBPEEL_BENEFITS = [
  {
    title: "余分な皮脂や古い角質を洗浄",
    body: "ベタつきが気になる肌を、清潔な状態へ整えます。",
  },
  {
    title: "毛穴まわりの汚れをケア",
    body: "皮脂や古い角質を取り除き、すっきりした印象へ導きます。",
  },
  {
    title: "ざらつき・ごわつきをなめらかに",
    body: "肌表面を整え、つるんとした手触りへ。",
  },
  {
    title: "古い角質によるくすみをケア",
    body: "疲れて見える肌を、明るく清潔感のある印象へ整えます。",
  },
  {
    title: "水分を補い、キメの整った肌へ",
    body: "角質ケア後の肌にうるおいを与え、すこやかに保ちます。",
  },
];

const HERBPEEL_PHOTOS = [
  {
    label: "頬",
    before: "facial_herbpeel_before" as const,
    after: "facial_herbpeel_after" as const,
  },
  {
    label: "顎",
    before: "facial_herbpeel_before2" as const,
    after: "facial_herbpeel_after2" as const,
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
          </FadeIn>
        </Container>
      </section>

      {/* ハーブピーリング */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Herb Peeling">
            テカリも、毛穴も、疲れて見える肌も。
            <br />
            月に一度、顔まで整える。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                毎日洗顔しているのに、午後になると顔がベタつく。
                毛穴やざらつきが目立ち、最近は疲れていない日まで疲れて見える。
              </p>
              <p>
                そんな大人の男性肌を、ハーブピーリングで清潔感のある、
                なめらかな印象へ整えます。
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-sm rounded-sm border border-beige bg-paper p-8 text-center">
              <p className="mb-4 font-serif-jp text-2xl text-ink md:text-3xl">
                ハーブピーリング
              </p>
              <p className="text-xs text-greige line-through">
                通常価格 ¥12,100
              </p>
              <p className="mt-1 text-xs tracking-wider text-greige">
                キャンペーン価格
              </p>
              <p className="font-serif-jp text-3xl text-brown md:text-4xl">
                ¥8,800<span className="ml-1 text-xs">（税込）</span>
              </p>
            </div>

            {(images[HERBPEEL_PHOTOS[0].before] ||
              images[HERBPEEL_PHOTOS[1].before]) && (
              <div className="mx-auto mt-10 max-w-2xl space-y-8">
                {HERBPEEL_PHOTOS.map((pair) => {
                  const before = images[pair.before];
                  const after = images[pair.after];
                  if (!before || !after) return null;
                  return (
                    <div key={pair.label}>
                      <p className="mb-2 text-center text-xs tracking-wider text-greige">
                        {pair.label}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                            <Image
                              src={before.url}
                              alt={before.alt}
                              fill
                              sizes="(min-width: 640px) 320px, 50vw"
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-1.5 text-center text-[11px] tracking-wider text-greige">
                            BEFORE
                          </p>
                        </div>
                        <div>
                          <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                            <Image
                              src={after.url}
                              alt={after.alt}
                              fill
                              sizes="(min-width: 640px) 320px, 50vw"
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-1.5 text-center text-[11px] tracking-wider text-greige">
                            AFTER
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <p className="mx-auto max-w-2xl text-center text-xs leading-loose text-greige">
                  ※これは実際に施術を受けたお客様の記録の一例です。効果を保証するものではなく、結果には個人差があります。
                </p>
              </div>
            )}
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Signs">
            こんな肌の変化、感じていませんか？
          </SectionHeading>
          <FadeIn>
            <ul className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
              {HERBPEEL_CONCERNS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 rounded-sm bg-paper px-5 py-4 text-sm"
                >
                  <span className="mt-0.5 text-brown">✓</span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              ひとつでも当てはまったら、肌にも定期的なメンテナンスが必要かもしれません。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Why">
            男性の肌は、脂っぽいだけではありません。
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              男性の肌は皮脂が多く、テカリや毛穴汚れが目立ちやすい一方で、
              年齢とともに水分が失われやすくなります。
              さらに、毎日のシェービングや紫外線、睡眠不足などが重なることで、
              ざらつきやごわつき、疲れた印象につながります。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Approach">
            ハーブピーリングでできること
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
              {HERBPEEL_BENEFITS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-sm border border-beige bg-paper p-5"
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
          </FadeIn>
        </Container>
      </section>

      <section className="bg-ink py-16 text-center text-paper md:py-24">
        <Container>
          <FadeIn>
            <p className="mx-auto mb-6 max-w-2xl font-serif-jp text-xl leading-relaxed md:text-2xl">
              目指すのは、自然な清潔感。
            </p>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-beige">
              <p>
                作り込んだ美しさではなく、近くで見られたときに感じる清潔感。
                ハーブピーリングは、毛穴・テカリ・ざらつきをケアし、
                若々しく整った印象を目指す男性のための肌メンテナンスです。
              </p>
              <p>疲れた頭は、ヘッドスパで。疲れて見える肌は、ハーブピーリングで。</p>
              <p>
                美容に詳しくなくても大丈夫です。月に一度、自分を整える時間に、
                顔のメンテナンスも加えてみてください。
              </p>
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-xs leading-loose text-greige">
              ※強い赤みや炎症、傷、肌荒れなどがある場合は、肌の状態を確認したうえで施術を見合わせることがあります。
            </p>
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
