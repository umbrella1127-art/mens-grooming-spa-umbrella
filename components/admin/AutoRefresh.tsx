"use client";

// 画面を開いている間だけ、一定間隔でサーバーの最新データを読み直す（タブが裏にあるときは止める）。
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [on, seconds, router]);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="inline-flex items-center gap-1.5 rounded-sm border border-beige px-2 py-0.5 text-[11px] text-charcoal-light hover:bg-paper-dark"
      aria-pressed={on}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${on ? "bg-[#4b7a5b]" : "bg-greige"}`} />
      {on ? `自動更新中（${seconds}秒ごと）` : "自動更新を止めています"}
    </button>
  );
}
