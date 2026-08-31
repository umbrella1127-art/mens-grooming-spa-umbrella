/** 通常価格→キャンペーン価格を強調して見せるコースカード */
export default function CampaignPriceCard({
  name,
  duration,
  description,
  originalPrice,
  campaignPrice,
  recommended = false,
}: {
  name: string;
  duration: string;
  description: string;
  originalPrice: string;
  campaignPrice: string;
  recommended?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-sm p-6 transition-shadow md:p-8 ${
        recommended
          ? "bg-ink shadow-lg ring-1 ring-brown"
          : "border border-beige bg-paper"
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-6 rounded-sm bg-brown px-3 py-0.5 text-[11px] tracking-wider text-paper">
          おすすめ
        </span>
      )}
      <h3 className={`mb-2 text-lg ${recommended ? "text-paper" : "text-ink"}`}>
        {name}
      </h3>
      <p
        className={`mb-3 text-xs tracking-wider ${
          recommended ? "text-beige/80" : "text-greige"
        }`}
      >
        {duration}
      </p>
      <p
        className={`mb-5 flex-1 text-sm ${
          recommended ? "text-beige" : "text-charcoal-light"
        }`}
      >
        {description}
      </p>
      <div>
        <p
          className={`text-xs line-through ${
            recommended ? "text-beige/60" : "text-greige"
          }`}
        >
          通常価格 {originalPrice}
        </p>
        <p
          className={`text-xl font-bold ${
            recommended ? "text-paper" : "text-brown"
          }`}
        >
          キャンペーン価格 {campaignPrice}
          <span className="ml-1 text-xs font-normal">（税込）</span>
        </p>
      </div>
    </div>
  );
}
