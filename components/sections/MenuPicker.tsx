// /menu の先頭に置く「選び方」。長い一覧の前に、目的から4つに絞って示す。
// コースの内容・価格は lib/first-grooming.ts と lib/menu-list.ts を情報源にし、ここでは新しい価格を書かない。
import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { FIRST_GROOMING_COURSES } from "@/lib/first-grooming";
import { MENU_PICK_TERMS, MENU_PICK_TERMS_NOTE } from "@/lib/menu-list";

const course = (key: string) => FIRST_GROOMING_COURSES.find((c) => c.key === key)!;

interface Pick {
  concern: string;
  name: string;
  includes: string[];
  price: string;
  href: string;
  recommended?: boolean;
}

const PICKS: Pick[] = [
  {
    concern: "初めて。まずは身だしなみを整えたい",
    name: `${course("grooming").nameEn}（${course("grooming").nameJa}）`,
    includes: ["カット", "シェービング", "ヘッドスパ35分"],
    price: course("grooming").campaignPrice,
    href: "#set",
  },
  {
    concern: "疲れを、ゆっくり休ませたい",
    name: `${course("deep-rest").nameEn}（${course("deep-rest").nameJa}）`,
    includes: ["カット", "シェービング", "ヘッドスパ50分"],
    price: course("deep-rest").campaignPrice,
    href: "#set",
  },
  {
    concern: "疲れて見える顔まで整えたい",
    name: `${course("total-care").nameEn}（${course("total-care").nameJa}）`,
    includes: ["カット", "シェービング", "ヘッドスパ35分", "フェイシャル"],
    price: course("total-care").campaignPrice,
    href: "#set",
    recommended: true,
  },
  {
    concern: "髪は切らない。頭や肌だけ整えたい",
    name: "カットなしのコース",
    includes: ["ヘッドスパだけ", "フェイシャルだけ", "組み合わせも可"],
    price: "¥7,700〜",
    href: "#no-cut",
  },
];

export default function MenuPicker() {
  return (
    <section className="border-b border-beige py-14 md:py-20">
      <Container>
        <SectionHeading en="How to Choose">どれを選べばいい？</SectionHeading>
        <FadeIn>
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
            迷ったら、いちばん近いものを選んでください。
            <br className="hidden sm:inline" />
            カードを押すと、下の一覧の該当する場所へ移動します。
          </p>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {PICKS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className={`relative block rounded-sm border p-5 transition-colors hover:bg-paper-dark ${
                  p.recommended ? "border-brown bg-paper" : "border-beige bg-paper"
                }`}
              >
                {p.recommended && (
                  <span className="absolute -top-2.5 left-4 rounded-sm bg-brown px-2 py-0.5 text-[10px] tracking-wider text-paper">
                    おすすめ
                  </span>
                )}
                <p className="font-serif-jp text-[15px] leading-relaxed text-ink">{p.concern}</p>
                <p className="mt-3 text-xs tracking-wider text-brown">{p.name}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {p.includes.map((inc) => (
                    <li
                      key={inc}
                      className="rounded-sm border border-beige px-2 py-0.5 text-[11px] leading-tight text-charcoal-light"
                    >
                      {inc}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-serif-jp text-lg text-brown">
                  {p.price}
                  <span className="ml-1 text-[11px] text-greige">税込</span>
                </p>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-sm border border-beige bg-paper-dark px-5 py-5">
            <p className="text-sm text-ink">「月」「浄」は、ヘッドスパの内容の名前です</p>
            <dl className="mt-3 space-y-2 text-xs leading-relaxed text-charcoal-light">
              {MENU_PICK_TERMS.map((t) => (
                <div key={t.term} className="flex gap-3">
                  <dt className="w-24 shrink-0 whitespace-nowrap text-brown">{t.term}</dt>
                  <dd>{t.body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-greige">{MENU_PICK_TERMS_NOTE}</p>
            <p className="mt-2 text-xs">
              <Link href="/menu/head-spa" className="border-b border-brown pb-0.5 text-brown hover:opacity-70">
                ヘッドスパの内容と、睡眠のデータを見る
              </Link>
            </p>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
