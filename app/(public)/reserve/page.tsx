import LineCtaLink from "@/components/analytics/LineCtaLink";
import CtaSection from "@/components/sections/CtaSection";
import FlowSteps from "@/components/sections/FlowSteps";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "ご予約について",
    description:
      "ご予約・ご相談は公式LINEから。希望メニューと日時の候補をお送りいただければ、空き状況を確認してご連絡します。完全予約制の男性専用サロン。",
    path: "/reserve",
  });
}

const RESERVE_FLOW = [
  {
    title: "公式LINEを友だち追加",
    body: "下のボタンからLINEを開いて、友だち追加してください。",
  },
  {
    title: "希望を送る",
    body: "希望メニュー（決まっていなければ「相談したい」でOK）と、ご希望の日時候補をお送りください。",
  },
  {
    title: "空き状況のご連絡",
    body: "空き状況を確認して、LINEでご連絡します。この時点で予約確定です。",
  },
  {
    title: "ご来店",
    body: "当日は手ぶらでどうぞ。無料駐車場19台をご利用いただけます。",
  },
];

export default async function ReservePage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        en="Reservation"
        title="ご予約について"
        lead={
          "ご予約・ご相談は、公式LINEにまとめています。\n電話は不要です。空き時間に、ゆっくり送ってください。"
        }
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="How to">ご予約の流れ</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl">
              <FlowSteps steps={RESERVE_FLOW} />
            </div>
            <div className="mt-12 text-center">
              <LineCtaLink
                href={settings.line_url}
                ctaType="line_inline"
                section="reserve_flow"
                className="inline-block rounded-sm bg-ink px-10 py-4 text-sm tracking-wider text-paper transition-opacity hover:opacity-85"
              >
                {settings.cta_primary_label}
              </LineCtaLink>
              <p className="mt-4 text-xs text-greige">{settings.cta_sub_label}</p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Note">ご予約にあたって</SectionHeading>
          <FadeIn>
            <ul className="mx-auto max-w-2xl space-y-3 text-sm leading-loose text-charcoal-light">
              <li>・当店は完全予約制です。一人ひとりの時間をしっかり確保するため、予約枠を限定しています。</li>
              <li>・メニューが決まっていなくても大丈夫です。「どれを選べばいいか分からない」とお送りください。</li>
              <li>・日程変更・キャンセルもLINEからご連絡ください。</li>
            </ul>
          </FadeIn>
        </Container>
      </section>

      <CtaSection settings={settings} section="reserve_bottom" />
    </>
  );
}
