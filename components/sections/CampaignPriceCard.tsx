/** 通常価格→キャンペーン価格を強調して見せるコースカード */
export default function CampaignPriceCard({
  nameEn,
  nameJa,
  duration,
  content,
  description,
  originalPrice,
  campaignPrice,
  recommended = false,
}: {
  nameEn: string;
  nameJa: string;
  duration: string;
  content: string;
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
      <h3
        className={`text-xl tracking-wide md:text-2xl ${
          recommended ? "text-paper" : "text-ink"
        }`}
      >
        {nameEn}
      </h3>
      <p
        className={`mt-1 text-sm ${
          recommended ? "text-beige" : "text-charcoal-light"
        }`}
      >
        {nameJa}
      </p>
      <p
        className={`mt-3 mb-3 text-xs tracking-wider ${
          recommended ? "text-beige/80" : "text-greige"
        }`}
      >
        {duration}
      </p>
      <p
        className={`mb-1 text-sm ${
          recommended ? "text-beige" : "text-charcoal-light"
        }`}
      >
        {content}
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
          className={`mt-1 text-xs tracking-wider ${
            recommended ? "text-beige/80" : "text-greige"
          }`}
        >
          キャンペーン価格
        </p>
        <p
          className={`font-serif-jp text-2xl md:text-3xl ${
            recommended ? "text-paper" : "text-brown"
          }`}
        >
          {campaignPrice}
          <span className="ml-1 text-xs">（税込）</span>
        </p>
      </div>
    </div>
  );
}
