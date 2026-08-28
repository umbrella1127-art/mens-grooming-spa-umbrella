import type { Metadata } from "next";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME}｜前橋の男性専用グルーミングサロン`,
  description:
    "群馬県前橋市の男性専用サロン。カット・シェービング・ヘッドスパ・頭皮診断・フェイシャル・育毛・インナービューティーまで、男性の美容とメンテナンスをまとめて相談できます。月に一度、自分を整える。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${shippori.variable} ${noto.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
