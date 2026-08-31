import Link from "next/link";
import CtaSection from "@/components/sections/CtaSection";
import FaqList from "@/components/sections/FaqList";
import FlowSteps from "@/components/sections/FlowSteps";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getFaqs, getImages, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "初めての方へ",
    description:
      "美容室が苦手でも、美容に詳しくなくても大丈夫。カウンセリングとマイクロスコープでの頭皮診断から始まります。前橋の男性専用グルーミングサロンの初回の流れをご案内します。",
    path: "/first-visit",
  });
}

const FIRST_FLOW = [
  { title: "カウンセリング", body: "今の状態や気になっていることを、ゆっくりお伺いします。うまく説明できなくても大丈夫です。" },
  { title: "マイクロスコープ診断", body: "専用のマイクロスコープでご自身の頭皮をモニターに映し、頭皮の色、髪の太さ、密度を一緒に見ていきます。" },
  { title: "カット", body: "扱いやすく、清潔感のあるスタイルへ。" },
  { title: "シェービング", body: "身だしなみを整えるグルーミングとしてのシェービング。" },
  { title: "ヘッドスパ", body: "静かな空間で、何もしなくていい時間を。" },
  { title: "肩マッサージ", body: "頭から肩まで、こわばりをほぐします。" },
  { title: "頭皮確認", body: "同じマイクロスコープで、施術後の頭皮をもう一度確認します。" },
  { title: "アフターカウンセリング", body: "今後のケアについて、押し売りなしでご提案します。" },
];

export default async function FirstVisitPage() {
  const [settings, faqs, images] = await Promise.all([
    getSettings(),
    getFaqs(),
    getImages(),
  ]);

  return (
    <>
      <PageHero
        en="First Visit"
        title="初めての方へ"
        lead={
          "美容に詳しくなくても、何を選べばよいか分からなくても大丈夫です。\n美容室が得意ではない男性にも、気負わずに来ていただける場所です。"
        }
        imageUrl={images.first_visit_hero?.url}
        imageAlt={images.first_visit_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Space">頑張る男が、静かに力を抜ける空間</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                落ち着いた照明、歌詞のない静かな音楽、さりげない香り。
                日常の騒がしさから少し離れ、深く休むための男性専用空間です。
              </p>
              <p>
                目を閉じ、身体の力を抜き、すべてをプロに任せる。
                髪や顔を整えながら、誰のためでもなく、自分のために過ごす
                「何もしなくていい時間」をお楽しみください。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Flow">初回の流れ</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl">
              <FlowSteps steps={FIRST_FLOW} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Scalp Check">
            「自分の頭皮を知る」体験
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                初回にはマイクロスコープでの頭皮診断が含まれます。専用のマイクロスコープで拡大した頭皮を、モニターでご自身の目でも確認していただきます。
              </p>
              <p>
                頭皮の色、髪の太さ、髪の密度。普段は見えない部分を知ることが、これからのケアの出発点になります。
                施術の前後で比較できる場合は、その変化も一緒に確認します。
              </p>
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/menu/first-grooming"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                初回グルーミングコースを見る
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Q&A">よくあるご質問</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <FaqList
                faqs={faqs.filter((f) => f.category === "初めての方")}
              />
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="何を選べばいいか分からなくても、大丈夫。"
        body="「どれを選べばいいか分からない」と、そのままLINEでお送りください。ご希望を伺ってご提案します。"
        section="first_visit_bottom"
      />
    </>
  );
}
