import PriceLabel from "@/components/ui/PriceLabel";
import type { Menu } from "@/lib/types";

export default function MenuCard({ menu }: { menu: Menu }) {
  const recommended = menu.is_recommended;

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
        className={`mb-2 text-lg ${recommended ? "text-paper" : "text-ink"}`}
      >
        {menu.name}
      </h3>
      {menu.duration_min && (
        <p
          className={`mb-3 text-xs tracking-wider ${
            recommended ? "text-beige/80" : "text-greige"
          }`}
        >
          約{menu.duration_min}分
        </p>
      )}
      {menu.description && (
        <p
          className={`mb-5 flex-1 text-sm ${
            recommended ? "text-beige" : "text-charcoal-light"
          }`}
        >
          {menu.description}
        </p>
      )}
      <PriceLabel
        menu={menu}
        className={recommended ? "text-paper" : "text-brown"}
      />
    </div>
  );
}
