import { Card } from "@/components/admin/board";
import { NG_WORDS, WIKI } from "@/lib/admin/wiki";

export default function WikiPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">WIKI</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          決まりごと
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          サイト・SNS・GBPに書くときの共通ルールです。自動生成の担当にも同じ内容を渡しています。
        </p>
      </div>

      <Card eyebrow="NG" title="使わない言葉">
        <div className="flex flex-wrap gap-2">
          {NG_WORDS.map((w) => (
            <span
              key={w}
              className="rounded-sm border border-[#e0c8bf] bg-[#f8eae6] px-2.5 py-1 text-[12px] text-[#8f3826]"
            >
              {w}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-greige">
          言い切りと煽りを避けるためのものです。似た言い回しも同じ扱いにしてください。
        </p>
      </Card>

      {WIKI.map((section) => (
        <Card key={section.title} eyebrow={section.eyebrow} title={section.title}>
          {section.lead && (
            <p className="mb-4 text-[12px] leading-relaxed text-charcoal-light">
              {section.lead}
            </p>
          )}
          <dl className="space-y-4">
            {section.items.map((item) => (
              <div
                key={item.term}
                className="border-l-2 border-beige pl-4 transition-colors hover:border-brown"
              >
                <dt className="text-[13px] text-ink">{item.term}</dt>
                <dd className="mt-1 text-[12.5px] leading-relaxed text-charcoal">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
}
