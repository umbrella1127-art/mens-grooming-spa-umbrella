import Link from "next/link";
import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getSettings } from "@/lib/cms";
import { MENU_GROUPS, MENU_NOTE } from "@/lib/menu-list";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "メニュー・料金",
    description:
      "カット・シェービング・ヘッドスパ・フェイシャル・育毛・カラー・パーマまで、MEN'S GROOMING SPA umbrellaのメニューと料金の一覧です。前橋の男性専用グルーミングサロン。",
    path: "/menu",
  });
}

export default async function MenuPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <PageHero
        en="Menu"
        title="メニュー・料金"
        lead={
          "ヘッドスパを中心に、髪・頭皮・肌・身体まで。\n今の自分に必要なケアを、組み合わせてお選びいただけます。"
        }
        imageUrl={images.head_spa_hero?.url}
        imageAlt={images.head_spa_hero?.alt}
      />

      {/* グループごとの目次 */}
      <section className="border-b border-beige py-8">
        <Container>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {MENU_GROUPS.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="border-b border-brown pb-0.5 text-xs tracking-wider text-brown transition-opacity hover:opacity-70"
              >
                {group.title}
              </a>
            ))}
          </div>
        </Container>
      </section>

      {MENU_GROUPS.map((group, i) => (
        <section
          key={group.id}
          id={group.id}
          className={`scroll-mt-20 py-16 md:py-24 ${
            i % 2 === 1 ? "bg-paper-dark" : ""
          }`}
        >
          <Container>
            <SectionHeading en={group.en}>{group.title}</SectionHeading>
            <FadeIn>
              {group.lead && (
                <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
                  {group.lead}
                </p>
              )}
              <ul className="mx-auto max-w-3xl">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex flex-col gap-1 border-b border-beige py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <div className="sm:flex-1">
                      <p className="text-sm leading-relaxed text-ink">
                        {item.name}
                      </p>
                      {item.note && (
                        <p className="mt-1 text-xs leading-relaxed text-greige">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 sm:text-right">
                      {item.originalPrice && (
                        <p className="text-xs text-greige line-through">
                          通常価格 {item.originalPrice}
                        </p>
                      )}
                      <p className="font-serif-jp text-lg text-brown">
                        {item.price}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {group.detail && (
                <div className="mt-8 text-center">
                  <Link
                    href={group.detail.href}
                    className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
                  >
                    {group.detail.label}
                  </Link>
                </div>
              )}
            </FadeIn>
          </Container>
        </section>
      ))}

      <section className="pb-16 md:pb-24">
        <Container>
          <p className="mx-auto max-w-2xl whitespace-pre-line text-center text-xs leading-loose text-greige">
            {MENU_NOTE}
          </p>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="どれを選べばいいか、迷ったら。"
        body="ご希望やお悩みをLINEでお送りください。いちばん合うコースをご提案します。"
        section="menu_bottom"
      />
    </>
  );
}
