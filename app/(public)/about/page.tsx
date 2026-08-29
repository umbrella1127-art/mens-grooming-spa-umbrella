import Image from "next/image";
import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "井上について",
    description:
      "MEN'S GROOMING SPA umbrella オーナー井上孝志。ヘッドスパ・アーユルヴェーダ・ファスティングなどの資格と、自身の79.5kg→63kgの体験から、男性の美容をトータルで相談できる理由をお伝えします。",
    path: "/about",
  });
}

const QUALIFICATIONS = [
  "ヘッドスパニスト修了",
  "アーユルヴェーダ シローダーラ修了",
  "アーユルヴェーダフェイシャル修了",
  "ファスティングカウンセラー",
  "脳疲労アドバイザー",
  "耳つぼセラピープロ養成講座 修了（日本耳つぼセラピープロ協会®）",
];

export default async function AboutPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <PageHero
        en="Owner"
        title="井上について"
        lead={
          "「美容のことなら、とりあえず井上さんに相談してみよう」。\nそう言ってもらえる存在でありたいと思っています。"
        }
      />

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid items-start gap-10 md:grid-cols-5">
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
              <p className="mb-1 text-xs tracking-[0.25em] text-brown">OWNER</p>
              <h2 className="mb-6 text-2xl text-ink">井上 孝志</h2>
              <div className="space-y-4 text-sm leading-loose text-charcoal-light">
                <p>
                  30歳を過ぎた頃から、体力の低下と抜けない疲労に悩んでいました。
                  そこで出会ったのがインナービューティー。食事と身体の内側を整えることで、
                  体重は79.5kgから63kgへ。体型だけでなく、肌の調子も、疲れにくさも、
                  気持ちの前向きさまで変わりました。
                </p>
                <p>
                  この経験から確信したのは、「外側だけ整えても、十分ではない」ということ。
                  人は年齢を重ねます。だからこそ、髪・頭皮・肌といった外側のケアと、
                  食事・身体という内側のケアの両方を大切にしています。
                </p>
                <p>
                  美容によって、人は変われる。年齢を重ねることを、諦めなくていい。
                  かっこよくなりたいと思ったら、美容に詳しくなくても、来てほしい。
                  そんな場所として、このサロンをつくりました。
                </p>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Qualifications">
            トータルで相談できる理由
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              髪・頭皮・肌・身体・内側。それぞれの分野で学び、資格を取得してきました。
              だから、断片的ではなく、あなた全体を見てご提案できます。
            </p>
            <ul className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
              {QUALIFICATIONS.map((q) => (
                <li
                  key={q}
                  className="rounded-sm border border-beige bg-paper px-5 py-4 text-center text-sm text-charcoal"
                >
                  {q}
                </li>
              ))}
            </ul>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="はじめまして、から始めましょう。"
        body="どんな小さなことでも、LINEでご相談ください。"
        section="about_bottom"
      />
    </>
  );
}
