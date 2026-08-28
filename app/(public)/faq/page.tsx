import CtaSection from "@/components/sections/CtaSection";
import FaqList from "@/components/sections/FaqList";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import { getFaqs, getSettings } from "@/lib/cms";
import { buildMetadata, faqJsonLd, JsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "よくある質問",
    description:
      "初めての方からよくいただく質問をまとめました。美容に詳しくなくても大丈夫です。前橋の男性専用グルーミングサロン。",
    path: "/faq",
  });
}

export default async function FaqPage() {
  const [settings, faqs] = await Promise.all([getSettings(), getFaqs()]);

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHero
        en="Q&A"
        title="よくある質問"
        lead="ここにない質問は、LINEでお気軽にお尋ねください。"
      />

      <section className="py-16 md:py-24">
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <FaqList faqs={faqs} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection settings={settings} section="faq_bottom" />
    </>
  );
}
