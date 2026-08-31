import Link from "next/link";
import CampaignPriceCard from "@/components/sections/CampaignPriceCard";
import CtaSection from "@/components/sections/CtaSection";
import FlowSteps from "@/components/sections/FlowSteps";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getSettings } from "@/lib/cms";
import {
  FIRST_GROOMING_COURSES,
  FIRST_GROOMING_LEAD,
  FIRST_GROOMING_NOTE,
} from "@/lib/first-grooming";
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
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

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
              {FIRST_GROOMING_LEAD.map((text) => (
                <p key={text} className="whitespace-pre-line">
                  {text}
                </p>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {FIRST_GROOMING_COURSES.map(({ key, ...course }) => (
                <CampaignPriceCard key={key} {...course} />
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl whitespace-pre-line text-center text-sm leading-loose text-charcoal-light">
              {FIRST_GROOMING_NOTE}
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
