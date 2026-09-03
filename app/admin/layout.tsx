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
    <div className="min-h-screen bg-[#f6f7fb] text-neutral-900">
      <div className="bg-linear-to-r from-[#1e2a52] to-[#4a3a8c] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2.5">
          <Link href="/admin" className="text-[14px] font-bold tracking-wide">
            umbrella
          </Link>
          <span className="text-[11px] text-white/70">サロン運営 管理ポータル</span>
          <span className="ml-auto text-[11px] tabular-nums text-white/70">
            {today()}
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5">
          <AdminNav />
          <a
            href="/"
            target="_blank"
            className="ml-auto text-[12.5px] text-[#5b6cff] hover:underline"
          >
            サイトを見る ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  );
}
