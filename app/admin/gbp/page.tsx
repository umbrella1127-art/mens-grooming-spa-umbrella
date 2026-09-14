import { Card, Empty } from "@/components/admin/board";

export default function GbpPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">GBP</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          Googleビジネスプロフィール
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          閲覧数・検索語句・通話/ルート検索/ウェブサイトクリックの実績
        </p>
      </div>

      <Card eyebrow="STATUS" title="準備中">
        <Empty>
          現時点ではGBPのインサイト画面から手動で共有いただく運用です。自動取得は未実装です。
        </Empty>
      </Card>
    </div>
  );
}
