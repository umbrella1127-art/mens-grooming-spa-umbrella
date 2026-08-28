import CtaSection from "@/components/sections/CtaSection";
import FlowSteps from "@/components/sections/FlowSteps";
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
    title: "メンズヘッドスパ",
    description:
      "前橋の男性専用サロンの本格ヘッドスパ。カウンセリング・頭皮診断・施術・肩までのケア・施術後の頭皮確認まで含めた、「気持ちいい」で終わらないヘッドスパです。頭浸浴付きの50分「浄」もご用意。",
    path: "/menu/head-spa",
  });
}

const SPA_FLOW = [
  { title: "カウンセリング", body: "今日の状態と気になることをお伺いします。" },
  { title: "頭皮確認", body: "施術前の頭皮をモニターで一緒に確認します。" },
  { title: "ヘッドスパ施術", body: "静かな空間で、じっくりと。" },
  { title: "肩までのケア", body: "頭だけでなく、首・肩のこわばりまで。" },
  { title: "頭皮の再確認", body: "施術後の頭皮を再度確認します。" },
  { title: "アフターカウンセリング", body: "ご自宅でのケアもご案内します。" },
];

const JO_FEATURES = [
  {
    title: "頭浸浴",
    body: "頭部を温かいお湯に浸す、50分コースだけの工程。じんわりと頭全体がゆるんでいきます。",
  },
  {
    title: "専用オイル",
    body: "50分コースでは専用オイルを使用し、頭皮をやわらかくほぐしていきます。",
  },
  {
    title: "長いマッサージ時間",
    body: "35分コースよりもマッサージの時間をたっぷり確保。深いリラックスへ。",
  },
  {
    title: "静かな空間",
    body: "少し暗めの照明と歌詞のない音楽。会話も不要。何もしなくていい時間です。",
  },
];

export default async function HeadSpaPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenus(),
    getImages(),
  ]);
  const spaMenus = menus.filter((m) => m.category === "head_spa");
  const mimitsubo = menus.find((m) => m.category === "mimitsubo");

  return (
    <>
      <PageHero
        en="Head Spa"
        title="ヘッドスパ"
        lead={
          "「気持ちよかった」で終わらせない。\nカウンセリングから頭皮確認まで含めた、本格的なヘッドスパです。"
        }
        imageUrl={images.head_spa_hero?.url}
        imageAlt={images.head_spa_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Menu">2つのヘッドスパ</SectionHeading>
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-2">
              {spaMenus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              「とにかく疲れている」「寝ても疲れが取れた感じがしない」という方には、
              月1回しっかりリセットできる50分の「浄」をおすすめしています。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-ink py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Jo — 50min" tone="light">
            50分「浄」で行うこと
          </SectionHeading>
          <FadeIn>
            <div className="grid gap-5 sm:grid-cols-2">
              {JO_FEATURES.map((f) => (
                <div key={f.title} className="rounded-sm bg-charcoal p-6">
                  <p className="mb-2 font-serif-jp text-base text-paper">
                    {f.title}
                  </p>
                  <p className="text-sm leading-loose text-beige">{f.body}</p>
                </div>
              ))}
            </div>
            {/* 動画枠: 施術動画が用意でき次第ここに挿入する */}
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Flow">ヘッドスパの流れ</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl">
              <FlowSteps steps={SPA_FLOW} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-charcoal py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Voice" tone="light">
            お客様の声
          </SectionHeading>
          <FadeIn>
            <figure className="mx-auto max-w-2xl rounded-sm bg-ink p-8 text-center">
              <blockquote className="mb-3 text-sm leading-loose text-beige">
                「普通の美容室のヘッドスパより、ずっと本格的でした。
                頭を触られているうちに、いつの間にか力が抜けていました。」
              </blockquote>
              <figcaption className="text-xs text-greige">40代・男性</figcaption>
            </figure>
          </FadeIn>
        </Container>
      </section>

      {mimitsubo && (
        <section className="py-16 md:py-24">
          <Container>
            <SectionHeading en="Option">追加ケア：耳つぼセラピー</SectionHeading>
            <FadeIn>
              <div className="mx-auto max-w-xl">
                <MenuCard menu={mimitsubo} />
                <p className="mt-6 text-center text-xs leading-loose text-greige">
                  リラクゼーション・コンディショニングのための追加ケアです。
                  ヘッドスパとの組み合わせでご利用いただけます。
                </p>
              </div>
            </FadeIn>
          </Container>
        </section>
      )}

      <CtaSection
        settings={settings}
        heading="月に一度、頭からリセットする。"
        body="初めての方も、LINEからお気軽にご相談ください。"
        section="head_spa_bottom"
        menu="head_spa"
      />
    </>
  );
}
