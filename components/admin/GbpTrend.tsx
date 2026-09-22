import type { GbpMonthRow } from "@/lib/admin/gbp";

/**
 * GBPインタラクション数の月次推移(単一系列の縦棒)。
 * 当月は月途中なので薄く描いて「途中」と添える。数値は棒の上に直接表示。
 */
export default function GbpTrend({ months }: { months: GbpMonthRow[] }) {
  const rows = [...months]
    .filter((m) => m.values.interactions != null)
    .sort((a, b) => (a.month < b.month ? -1 : 1))
    .slice(-12);
  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((r) => r.values.interactions ?? 0), 1);
  const current = new Date().toISOString().slice(0, 7);

  return (
    <figure>
      <figcaption className="mb-2 text-[11.5px] text-greige">
        インタラクション数(通話+予約+ルート+サイト)の月次推移
      </figcaption>
      <div className="flex h-36 items-end gap-2 border-b border-beige">
        {rows.map((r) => {
          const v = r.values.interactions ?? 0;
          const partial = r.month === current;
          const detail = `${r.month}: ${v}(ルート${r.values.direction_requests ?? "—"} / サイト${
            r.values.website_clicks ?? "—"
          } / 通話${r.values.calls ?? "—"} / 予約${r.values.bookings ?? "—"})${partial ? " ※月途中" : ""}`;
          return (
            <div
              key={r.month}
              title={detail}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              <span className="mb-1 text-[11px] tabular-nums text-charcoal">{v}</span>
              <div
                className={`w-full max-w-10 rounded-t-[4px] transition-opacity group-hover:opacity-80 ${
                  partial ? "border border-dashed border-brown bg-brown/25" : "bg-brown"
                }`}
                style={{ height: `${(v / max) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2">
        {rows.map((r) => (
          <span
            key={r.month}
            className="flex-1 text-center text-[10.5px] tabular-nums text-greige"
          >
            {Number(r.month.slice(5))}月{r.month === current ? "(途中)" : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}
