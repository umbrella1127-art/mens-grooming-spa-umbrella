import { Card, Empty } from "@/components/admin/board";

export default function Ga4Page() {
  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">GA4</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          アクセス解析
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          チャネル別セッション・ランディングページ・LINEクリック(line_click)の実績
        </p>
      </div>

      <Card eyebrow="STATUS" title="準備中">
        <Empty>
          データ取得は `npm run ga4:report` で手元では動いています。この画面への表示は未実装です。
        </Empty>
      </Card>
    </div>
  );
}
