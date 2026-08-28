import type { Menu } from "@/lib/types";

/**
 * 価格表示の一元管理。
 * fixed: 金額表示 / tbd: 「価格未定」 / hidden: 価格欄を出さない。
 * 未確定の仮価格をコードに書かないための唯一の窓口。
 */
export default function PriceLabel({
  menu,
  className = "",
}: {
  menu: Pick<Menu, "price_yen" | "price_status" | "price_note">;
  className?: string;
}) {
  if (menu.price_status === "hidden") {
    return menu.price_note ? (
      <span className={`text-sm text-greige ${className}`}>{menu.price_note}</span>
    ) : null;
  }
  if (menu.price_status === "tbd" || menu.price_yen == null) {
    return (
      <span className={`text-sm text-greige ${className}`}>
        価格未定{menu.price_note ? `（${menu.price_note}）` : ""}
      </span>
    );
  }
  return (
    <span className={`font-serif-jp ${className}`}>
      <span className="text-xl md:text-2xl">
        ¥{menu.price_yen.toLocaleString()}
      </span>
      {menu.price_note && (
        <span className="ml-1 text-xs text-greige">{menu.price_note}</span>
      )}
    </span>
  );
}
