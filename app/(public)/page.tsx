import Image from "next/image";
import Link from "next/link";
import LineCtaLink from "@/components/analytics/LineCtaLink";
import CtaSection from "@/components/sections/CtaSection";
import FaqList from "@/components/sections/FaqList";
import MenuCard from "@/components/sections/MenuCard";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getFaqs, getImages, getMenus, getSettings } from "@/lib/cms";
import { buildMetadata, JsonLd, localBusinessJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    description:
      "群馬県前橋市の男性専用グルーミングサロン。カット・シェービング・ヘッドスパ・頭皮診断・フェイシャル・育毛まで、美容に詳しくなくても相談できる場所。月に一度、自分を整える。",
    path: "/",
  });
}

const CONCERNS = [
  "ヘッドスパに興味はあるけれど、受けたことがない",
  "肌のケアをプロにしてもらったことがない",
  "美容室がどうも苦手だ",
  "女性のお客様が多い空間だと落ち着かない",
  "最近、疲れが抜けない",
  "髪や頭皮のことが気になり始めた",
];

const OTHER_CARE = [
  { href: "/menu/facial", title: "フェイシャル", body: "肌を測って、整える" },
  { href: "/menu/shaving", title: "シェービング", body: "身だしなみを整える" },
  { href: "/menu/hair-growth", title: "育毛", body: "頭皮と向き合う集中ケア" },
  {
    href: "/menu/inner-beauty",
    title: "インナービューティー",
    body: "内側から整える相談",
  },
  { href: "/menu/slimming", title: "メンズ痩身", body: "身体を整える（完全予約制）" },
  { href: "/menu/head-spa", title: "耳つぼセラピー", body: "組み合わせる追加ケア" },
];

export default async function TopPage() {
  const [settings, menus, faqs, images] = await Promise.all([
    getSettings(),
    getMenus(),
    getFaqs(),
    getImages(),
  ]);

  const headSpaMenus = menus.filter((m) => m.category === "head_spa");
  const firstMenus = menus.filter((m) => m.category === "first_grooming");
  const topFaqs = faqs.slice(0, 3);

  return (
    <>
      <JsonLd data={localBusinessJsonLd(settings)} />

      {/* ① ファーストビュー + ② 35歳以降の変化（共感型コピー） */}
      <section className="relative flex min-h-[82svh] items-center overflow-hidden bg-ink text-paper">
        {images.hero_top && (
          <>
            <Image
              src={images.hero_top.url}
              alt={images.hero_top.alt}
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/60 to-ink/90" />
          </>
        )}
        <Container className="relative py-24">
          <FadeIn>
            <h1 className="mb-6 whitespace-pre-line text-3xl leading-relaxed md:text-5xl md:leading-relaxed">
              {settings.fv_copy_main}
            </h1>
            <p className="mb-10 max-w-xl text-sm text-beige md:text-base">
              {settings.fv_copy_sub}
            </p>
            <LineCtaLink
              href={settings.line_url}
              ctaType="line_hero"
              section="hero"
              className="inline-block rounded-sm bg-paper px-10 py-4 text-sm tracking-wider text-ink transition-opacity hover:opacity-85"
            >
              {settings.cta_primary_label}
            </LineCtaLink>
            <p className="mt-4 text-xs text-greige">{settings.cta_sub_label}</p>
          </FadeIn>
        </Container>
      </section>

      {/* ③ 共感 */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="For You">こんなこと、ありませんか？</SectionHeading>
          <FadeIn>
            <ul className="mx-auto grid max-w-3xl gap-3 md:grid-cols-2">
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
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              ひとつでも当てはまったら、ここはあなたのための場所です。
              <br />
              美容に詳しくなくても、何を頼めばいいか分からなくても、大丈夫です。
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ④ umbrellaとは */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2">
            <FadeIn>
              <SectionHeading en="About" align="left" tone="light">
                男性の美容とメンテナンスを、
                <br />
                まとめて相談できる場所。
              </SectionHeading>
              <p className="text-sm leading-loose text-beige">
                MEN&apos;S GROOMING SPA
                umbrellaは、群馬県前橋市の男性専用サロンです。
                カット、シェービング、ヘッドスパ、頭皮診断、フェイシャル、育毛、そして内側からのケアまで。
                美容室でも、エステでも、ヘッドスパ専門店でもない、
                「自分を整える場所」として、落ち着いたトーンの照明と静かな音楽の中で、
                何もしなくていい時間をお過ごしいただけます。
              </p>
            </FadeIn>
            <FadeIn delay={150}>
              {images.salon_interior && (
                <Image
                  src={images.salon_interior.url}
                  alt={images.salon_interior.alt}
                  width={720}
                  height={480}
                  className="rounded-sm object-cover"
                />
              )}
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* ⑤ ヘッドスパ（月・浄） */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Head Spa">
            主役は、ヘッドスパ。
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              カウンセリングから頭皮診断、施術、肩までのケア、施術後の頭皮確認まで。
              「気持ちよかった」で終わらない、本格的なヘッドスパです。
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {headSpaMenus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/menu/head-spa"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                ヘッドスパについて詳しく見る
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑥ 初回3コース */}
      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="First Visit">初めての方の3つのコース</SectionHeading>
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-3">
              {firstMenus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-greige">
              カウンセリングとマイクロスコープでの頭皮診断から始まります。
            </p>
            <div className="mt-6 text-center">
              <Link
                href="/menu/first-grooming"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                初回グルーミングについて詳しく見る
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑦ 井上さん + ⑧ ストーリー */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-5">
            <FadeIn className="md:col-span-2">
              {images.owner_portrait && (
                <Image
                  src={images.owner_portrait.url}
                  alt={images.owner_portrait.alt}
                  width={560}
                  height={700}
                  className="rounded-sm object-cover"
                />
              )}
            </FadeIn>
            <FadeIn delay={150} className="md:col-span-3">
              <SectionHeading en="Owner" align="left">
                「この人になら、相談できる」を大切に。
              </SectionHeading>
              <p className="mb-4 text-sm leading-loose text-charcoal-light">
                オーナーの井上は、ヘッドスパ・アーユルヴェーダ・ファスティング・脳疲労ケアなど、
                髪から身体の内側まで幅広い資格と経験を持っています。
              </p>
              <p className="mb-4 text-sm leading-loose text-charcoal-light">
                そして自身も、79.5kgから63kgへ。
                インナービューティーを取り入れた経験から、体型だけでなく肌も気持ちも変わることを実感しました。
                外側だけ整えても十分ではない——それが、このサロンの考え方の原点です。
              </p>
              <Link
                href="/about"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                井上について詳しく見る
              </Link>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* ⑨ 口コミ */}
      <section className="bg-charcoal py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Voice" tone="light">
            お客様の声
          </SectionHeading>
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-2">
              <figure className="rounded-sm bg-ink p-8">
                <blockquote className="mb-4 text-sm leading-loose text-beige">
                  「普通の美容室のヘッドスパとは全然違って、本格的でした。
                  終わったあと、頭も気持ちも軽くなった感じがします。」
                </blockquote>
                <figcaption className="text-xs text-greige">
                  40代・男性
                </figcaption>
              </figure>
              <figure className="rounded-sm bg-ink p-8">
                <blockquote className="mb-4 text-sm leading-loose text-beige">
                  「男性だけの静かな空間で、とてもリラックスできました。
                  夫の誕生日にすすめたら、それから毎月通っています。」
                </blockquote>
                <figcaption className="text-xs text-greige">
                  ご紹介のお客様
                </figcaption>
              </figure>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑩ その他のケア */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Care Menu">その他のケア</SectionHeading>
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {OTHER_CARE.map((care) => (
                <Link
                  key={care.title}
                  href={care.href}
                  className="group rounded-sm border border-beige bg-paper p-6 transition-colors hover:border-brown"
                >
                  <p className="mb-1 font-serif-jp text-base text-ink group-hover:text-brown">
                    {care.title}
                  </p>
                  <p className="text-xs text-greige">{care.body}</p>
                </Link>
              ))}
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑪ 初めてでも大丈夫 */}
      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Q&A">
            初めてでも、大丈夫です。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <FaqList faqs={topFaqs} />
              <div className="mt-8 text-center">
                <Link
                  href="/faq"
                  className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
                >
                  よくある質問をすべて見る
                </Link>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑫ 月1メンテナンス + ⑬ 完全予約制 */}
      <section className="bg-ink py-20 text-center text-paper md:py-28">
        <Container>
          <FadeIn>
            <p className="mb-6 font-serif-jp text-2xl leading-relaxed tracking-[0.1em] md:text-4xl">
              月に一度、自分を整える。
            </p>
            <p className="mx-auto max-w-xl text-sm leading-loose text-beige">
              仕事からも、スマホからも、少しだけ離れて。
              頭皮と髪と肌と身体を整えて、また次のひと月へ。
            </p>
            <p className="mt-8 text-xs tracking-wider text-greige">
              一人ひとりの時間をしっかり確保するため、完全予約制・予約枠を限定しています。
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ⑭ LINE CTA */}
      <CtaSection settings={settings} section="top_bottom" />
    </>
  );
}
