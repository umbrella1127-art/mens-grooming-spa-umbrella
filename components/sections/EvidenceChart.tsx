type Datum = { label: string; value: number };

/**
 * 単色の縦棒グラフ（1系列のためカテゴリカル配色は不要、brownの単色のみ使用）。
 * バー上端4px丸め・下端は直角でベースラインに接地、値は各バー上端に直接ラベル。
 * データテーブルを併記し、SVGが読めない環境でも数値を確認できるようにする。
 */
export default function EvidenceChart({
  data,
  unit = "%",
  valueFormatter = (v: number) => `${v > 0 ? "+" : ""}${v}${unit}`,
}: {
  data: Datum[];
  unit?: string;
  valueFormatter?: (v: number) => string;
}) {
  const width = 640;
  const bandWidth = width / data.length;
  const barWidth = 28;
  const baselineY = 190;
  const plotTop = 30;
  const plotHeight = baselineY - plotTop;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  function barPath(x: number, height: number) {
    const r = Math.min(4, height);
    const yTop = baselineY - height;
    if (height <= 0) return "";
    return `M ${x},${baselineY}
      L ${x},${yTop + r}
      Q ${x},${yTop} ${x + r},${yTop}
      L ${x + barWidth - r},${yTop}
      Q ${x + barWidth},${yTop} ${x + barWidth},${yTop + r}
      L ${x + barWidth},${baselineY}
      Z`;
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} 230`}
        role="img"
        aria-label={`${data.map((d) => `${d.label} ${valueFormatter(d.value)}`).join("、")}`}
        className="w-full"
      >
        <line
          x1={0}
          y1={baselineY}
          x2={width}
          y2={baselineY}
          className="stroke-beige"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const cx = bandWidth * i + bandWidth / 2;
          const x = cx - barWidth / 2;
          const height = (d.value / maxValue) * plotHeight;
          const yTop = baselineY - height;
          return (
            <g key={d.label}>
              <title>{`${d.label}：${valueFormatter(d.value)}`}</title>
              {height > 0 ? (
                <path d={barPath(x, height)} className="fill-brown" />
              ) : (
                <circle cx={cx} cy={baselineY} r={3} className="fill-greige" />
              )}
              <text
                x={cx}
                y={height > 0 ? yTop - 8 : baselineY - 10}
                textAnchor="middle"
                className="fill-ink text-[13px] font-medium"
              >
                {valueFormatter(d.value)}
              </text>
              <text
                x={cx}
                y={baselineY + 22}
                textAnchor="middle"
                className="fill-charcoal-light text-[12px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      <table className="mt-6 w-full border-t border-beige text-xs text-charcoal-light">
        <thead>
          <tr className="border-b border-beige text-left text-greige">
            <th className="py-2 font-normal">対象（年代・性別）</th>
            <th className="py-2 font-normal">深い睡眠の指標 変化率</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label} className="border-b border-beige/60">
              <td className="py-2">{d.label}</td>
              <td className="py-2">{valueFormatter(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
