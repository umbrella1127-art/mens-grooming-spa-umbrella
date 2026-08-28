import { GoogleAnalytics } from "@next/third-parties/google";
import ScrollTracker from "@/components/analytics/ScrollTracker";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileLineBar from "@/components/layout/MobileLineBar";
import { getSettings } from "@/lib/cms";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      <Header
        lineUrl={settings.line_url}
        ctaLabel={settings.cta_primary_label}
      />
      {/* モバイル固定バーの高さぶん下部に余白を確保 */}
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <Footer settings={settings} />
      <MobileLineBar settings={settings} />
      <ScrollTracker />
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
