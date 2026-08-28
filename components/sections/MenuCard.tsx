import PriceLabel from "@/components/ui/PriceLabel";
import type { Menu } from "@/lib/types";

export default function MenuCard({ menu }: { menu: Menu }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-sm border bg-paper p-6 md:p-8 ${
        menu.is_recommended ? "border-brown shadow-sm" : "border-beige"
      }`}
    >
      {menu.is_recommended && (
        <span className="absolute -top-3 left-6 bg-brown px-3 py-0.5 text-[11px] tracking-wider text-paper">
          おすすめ
        </span>
      )}
      <h3 className="mb-2 text-lg text-ink">{menu.name}</h3>
      {menu.duration_min && (
        <p className="mb-3 text-xs tracking-wider text-greige">
          約{menu.duration_min}分
        </p>
      )}
      {menu.description && (
        <p className="mb-5 flex-1 text-sm text-charcoal-light">
          {menu.description}
        </p>
      )}
      <PriceLabel menu={menu} className="text-brown" />
    </div>
  );
}
