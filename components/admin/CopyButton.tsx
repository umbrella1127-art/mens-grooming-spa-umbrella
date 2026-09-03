"use client";

import { useState } from "react";

/** GBPなど手動で貼り付けて使う文章を、1クリックでコピーできるようにする。 */
export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-sm border border-beige px-3 py-1.5 text-[11.5px] tracking-wide text-charcoal transition-colors hover:bg-paper-dark"
    >
      {copied ? "コピーしました" : "本文をコピー"}
    </button>
  );
}
