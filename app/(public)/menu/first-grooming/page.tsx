import Link from "next/link";
import CampaignPriceCard from "@/components/sections/CampaignPriceCard";
import CtaSection from "@/components/sections/CtaSection";
import FlowSteps from "@/components/sections/FlowSteps";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getMenusByCategory, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "初回グルーミングコース",
    description:
      "カット・シェービング・ヘッドスパがひとつになった、初めての方のためのグルーミングコース。カウンセリングとマイクロスコープでの頭皮診断込み。前橋の男性専用サロン。",
    path: "/menu/first-grooming",
  });
}

/** 通常価格はCMSで管理していないため、キャンペーン価格表示用にここでスロットごと保持する */
const ORIGINAL_PRICE_BY_SLUG: Record<string, string> = {
  "first-ume": "¥11,000",
  "first-take": "¥14,300",
  "first-matsu": "¥15,400～",
};

const FLOW = [
  { title: "カウンセリング" },
  { title: "マイクロスコープ診断" },
  { title: "カット" },
  { title: "シェービング" },
  { title: "ヘッドスパ" },
  { title: "肩マッサージ" },
  { title: "頭皮確認" },
  { title: "アフターカウンセリング" },
];

export default async function FirstGroomingPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenusByCategory("first_grooming"),
    getImages(),
  ]);

  return (
    <>
      <PageHero
        en="First Grooming"
        title="初回グルーミングコース"
        lead={
          "初めての方のための、じっくり向き合うグルーミング体験。\nカウンセリングとマイクロスコープでの頭皮診断から始まり、カット・シェービング・ヘッドスパまで、一度に整えます。"
        }
        imageUrl={images.first_visit_hero?.url}
        imageAlt={images.first_visit_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="First Grooming">
            初めてのumbrellaを、3つの整え方から。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto mb-10 max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                身だしなみを整えたい。
                <br />
                溜まった疲れを深く休ませたい。
                <br />
                疲れて見える顔までケアしたい。
              </p>
              <p>今の自分に合うコースをお選びください。</p>
              <p>
                下記は、初めての方にもおすすめしているカット込みのセットコースです。
                もちろん、カットなしでもご利用いただけます。
              </p>
              <p>umbrellaは、ヘッドスパを中心としたサロンです。</p>
              <p>
                「ヘッドスパだけで予約するのは申し訳ない」と、気を遣う必要は
                ありません。ヘッドスパだけ、フェイシャルだけのご来店も、
                心から歓迎しています。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {menus.map((menu) => (
                <CampaignPriceCard
                  key={menu.slug}
                  name={menu.name}
                  duration={menu.duration_min ? `約${menu.duration_min}分` : ""}
                  description={menu.description ?? ""}
                  originalPrice={ORIGINAL_PRICE_BY_SLUG[menu.slug] ?? ""}
                  campaignPrice={`¥${menu.price_yen?.toLocaleString() ?? ""}${
                    menu.price_note?.startsWith("〜") ? "～" : ""
                  }`}
                  recommended={menu.is_recommended}
                />
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              どれを選べばよいか迷った方には、ヘッドスパとフェイシャルを一度に
              体験できる「TOTAL CARE」をおすすめしています。
              <br />
              髪・頭・顔までまとめて整える、umbrellaの価値を最も実感していただける
              コースです。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Flow">当日の流れ</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl">
              <FlowSteps steps={FLOW} />
            </div>
            <p className="mt-8 text-center text-xs text-greige">
              詳しくは
              <Link href="/first-visit" className="mx-1 border-b border-greige">
                初めての方へ
              </Link>
              をご覧ください。
            </p>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="どのコースにするか、迷ったら。"
        body="LINEで「初めてです」とお送りください。ご希望を伺って、いちばん合うコースをご提案します。"
        section="first_grooming_bottom"
        menu="first_grooming"
      />
    </>
  );
}
