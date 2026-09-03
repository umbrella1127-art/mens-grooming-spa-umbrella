import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "管理画面｜MEN'S GROOMING SPA umbrella",
  robots: { index: false, follow: false },
};

function today() {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper-dark text-charcoal">
      <div className="bg-ink">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
          <Link href="/admin" className="font-serif-jp text-[15px] tracking-[0.14em] text-paper">
            MEN&apos;S umbrella
          </Link>
          <span className="text-[10px] tracking-[0.2em] text-greige">
            管理ポータル
          </span>
          <span className="ml-auto text-[11px] tabular-nums tracking-wide text-greige">
            {today()}
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-ink bg-charcoal">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2">
          <AdminNav />
          <a
            href="/"
            target="_blank"
            className="ml-auto text-[12px] tracking-wide text-greige hover:text-paper"
          >
            サイトを見る ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7">{children}</main>
    </div>
  );
}
