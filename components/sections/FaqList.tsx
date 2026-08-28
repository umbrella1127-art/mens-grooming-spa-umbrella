import type { Faq } from "@/lib/types";

/** ネイティブ details/summary によるFAQ（JS不要・軽量） */
export default function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-beige border-y border-beige">
      {faqs.map((faq) => (
        <details key={faq.id} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif-jp text-base text-ink [&::-webkit-details-marker]:hidden">
            <span>
              <span className="mr-3 text-brown">Q.</span>
              {faq.question}
            </span>
            <span className="mt-1 shrink-0 text-greige transition-transform group-open:rotate-45">
              ＋
            </span>
          </summary>
          <p className="mt-3 pl-7 text-sm text-charcoal-light">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
