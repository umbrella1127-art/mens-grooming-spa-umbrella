import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "MEMBERSHIP",
    description:
      "「毎月ここで整える」と決めた方のための年間メンバーシップ（準備中）。カット・シェービング・ヘッドスパを年間12回。前橋の男性専用サロン。",
    path: "/membership",
  });
}

export default async function MembershipPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        en="Membership"
        title="MEMBERSHIP"
        lead={
          "月に一度、自分を整える。\nそれを習慣にすると決めた方のための会員制度です。"
        }
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Concept">
            何度か通って、気に入ったら。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>
                年間メンバーシップは、カット＋シェービング＋ヘッドスパを年間12回、
                毎月のメンテナンスとしてご利用いただける制度です。
              </p>
              <p>
                初回から会員になっていただく必要はまったくありません。
                何度か通っていただいて、「ここに毎月任せたい」と思えたら。
                そのときに、ご案内させてください。
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-paper-dark px-4 py-1.5 text-xs tracking-[0.2em] text-brown">
                COMING SOON
              </span>
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="まずは、一度体験から。"
        body="初回グルーミングコースからお試しください。"
        section="membership_bottom"
      />
    </>
  );
}
