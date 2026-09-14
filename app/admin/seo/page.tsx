import { Card, Empty } from "@/components/admin/board";

export default function SeoPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">SEO</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          SEO
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          検索順位・検索語句と、各ページのタイトル/descriptionの整合を管理する場所
        </p>
      </div>

      <Card eyebrow="STATUS" title="準備中">
        <Empty>
          Search Consoleとの連携、ページごとの表記ゆれチェックなどは未実装です。
        </Empty>
      </Card>
    </div>
  );
}
