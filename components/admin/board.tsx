// 業務ボードの表示部品。トーン（info/ok/warn/bad）で色を出し分ける。
// 配色は公開サイトと同じブランドトークン（ink/charcoal/brown/beige）に揃える。
import Link from "next/link";
import type { BoardAlert, Stage, Tone } from "@/lib/admin/board";

const STAGE_TONE: Record<Tone, string> = {
  info: "border-t-brown bg-paper",
  ok: "border-t-[#4b7a5b] bg-paper",
  warn: "border-t-[#a0731f] bg-[#f7f1e4]",
  bad: "border-t-[#a8442e] bg-[#f8eae6]",
};

const BADGE_TONE: Record<Tone, string> = {
  info: "bg-paper-dark text-charcoal-light",
  ok: "bg-[#e6ede7] text-[#3d6a4c]",
  warn: "bg-[#f2e8d5] text-[#8a621a]",
  bad: "bg-[#f3ddd7] text-[#8f3826]",
};

export function Badge({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[11px] leading-tight tracking-wide ${BADGE_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

function StageCard({ stage }: { stage: Stage }) {
  const inner = (
    <>
      <div className="font-serif-jp text-[30px] leading-none tabular-nums text-ink">
        {stage.n}
      </div>
      <div className="mt-2.5 text-[12px] leading-snug tracking-wide text-charcoal">
        {stage.label}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-greige">
        {stage.hint}
      </div>
    </>
  );

  const className = `block h-full rounded-sm border border-t-[3px] border-beige px-4 py-4 ${
    STAGE_TONE[stage.tone]
  }`;

  return stage.href ? (
    <Link
      href={stage.href}
      className={`${className} transition-colors hover:border-greige`}
    >
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function Flow({ stages }: { stages: Stage[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:flex lg:items-stretch">
      {stages.map((stage, i) => (
        <div key={stage.label} className="contents lg:flex lg:flex-1">
          {/* 先頭にも同じ幅の矢印を置いてカード幅を揃える */}
          <span
            aria-hidden
            className={`hidden w-6 shrink-0 select-none items-center justify-center text-beige lg:flex ${
              i === 0 ? "invisible" : ""
            }`}
          >
            →
          </span>
          <div className="lg:flex-1">
            <StageCard stage={stage} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Alerts({ alerts }: { alerts: BoardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-sm border border-beige border-l-[3px] border-l-[#4b7a5b] bg-paper px-4 py-3 text-[13px] text-charcoal">
        今つまっているものはありません。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const style =
          alert.tone === "bad"
            ? "border-l-[#a8442e] bg-[#f8eae6] text-[#7d3122]"
            : "border-l-[#a0731f] bg-[#f7f1e4] text-[#7a5716]";
        return (
          <div
            key={i}
            className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-beige border-l-[3px] px-4 py-3 text-[13px] leading-relaxed ${style}`}
          >
            <span>{alert.text}</span>
            {alert.href && (
              <Link
                href={alert.href}
                className="ml-auto shrink-0 whitespace-nowrap tracking-wide underline underline-offset-4"
              >
                直す →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Card({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-beige bg-paper p-5">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-beige pb-3">
        <span className="text-[10px] tracking-[0.18em] text-greige">
          {eyebrow}
        </span>
        <h2 className="font-serif-jp text-[14px] tracking-wide text-ink">
          {title}
        </h2>
        {aside && (
          <span className="ml-auto text-[11px] text-greige">{aside}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-[12.5px] text-greige">{children}</p>;
}
