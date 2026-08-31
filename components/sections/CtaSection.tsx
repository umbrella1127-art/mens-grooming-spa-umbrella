import LineCtaLink from "@/components/analytics/LineCtaLink";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import type { Settings } from "@/lib/types";

/** 各ページ末尾などに置く共通CTA帯。煽らず、静かに誘導する。 */
export default function CtaSection({
  settings,
  heading = "まずは、相談だけでも。",
  body = "何を選べばいいか分からなくても大丈夫です。ご希望やお悩みをLINEでお送りください。",
  section = "cta_section",
  menu,
}: {
  settings: Settings;
  heading?: string;
  body?: string;
  section?: string;
  menu?: string;
}) {
  return (
    <section className="bg-charcoal py-16 text-paper md:py-20">
      <Container className="text-center">
        <FadeIn>
          <h2 className="mb-4 whitespace-pre-line text-xl md:text-2xl">
            {heading}
          </h2>
          <p className="mx-auto mb-8 max-w-xl whitespace-pre-line text-sm text-beige">
            {body}
          </p>
          <LineCtaLink
            href={settings.line_url}
            ctaType="line_inline"
            section={section}
            menu={menu}
            className="inline-block rounded-sm bg-paper px-10 py-4 text-sm tracking-wider text-ink transition-opacity hover:opacity-85"
          >
            {settings.cta_primary_label}
          </LineCtaLink>
          <p className="mt-4 text-xs text-greige">{settings.cta_sub_label}</p>
        </FadeIn>
      </Container>
    </section>
  );
}
