// 業務ボードの表示部品。トーン（info/ok/warn/bad）で色を出し分ける。
import Link from "next/link";
import type { BoardAlert, Stage, Tone } from "@/lib/admin/board";

const STAGE_TONE: Record<Tone, string> = {
  info: "border-t-[#5b6cff] bg-white",
  ok: "border-t-[#10b981] bg-white",
  warn: "border-t-[#f59e0b] bg-[#fffbeb]",
  bad: "border-t-[#ef4444] bg-[#fef2f2]",
};

const BADGE_TONE: Record<Tone, string> = {
  info: "bg-[#eef0ff] text-[#4553c9]",
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-800",
  bad: "bg-red-50 text-red-700",
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
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] leading-tight ${BADGE_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

function StageCard({ stage }: { stage: Stage }) {
  const inner = (
    <>
      <div className="text-[26px] font-bold leading-none tabular-nums text-neutral-900">
        {stage.n}
      </div>
      <div className="mt-2 text-[12px] leading-snug text-neutral-600">
        {stage.label}
      </div>
      <div className="mt-0.5 text-[11px] leading-snug text-neutral-400">
        {stage.hint}
      </div>
    </>
  );

  const className = `block h-full rounded-[18px] border border-t-[3px] border-neutral-200 px-4 py-4 ${
    STAGE_TONE[stage.tone]
  }`;

  return stage.href ? (
    <Link href={stage.href} className={`${className} hover:shadow-sm`}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function Flow({ stages }: { stages: Stage[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch">
      {stages.map((stage, i) => (
        <div key={stage.label} className="contents sm:flex sm:flex-1">
          {/* 先頭にも同じ幅の矢印を置いてカード幅を揃える */}
          <span
            aria-hidden
            className={`hidden w-6 shrink-0 select-none items-center justify-center text-neutral-300 sm:flex ${
              i === 0 ? "invisible" : ""
            }`}
          >
            →
          </span>
          <div className="sm:flex-1">
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
      <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
        ✅ 今つまっているものはありません。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const style =
          alert.tone === "bad"
            ? "border-red-200 bg-[#fef2f2] text-red-800"
            : "border-amber-200 bg-[#fffbeb] text-amber-900";
        return (
          <div
            key={i}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] border px-4 py-3 text-[13px] ${style}`}
          >
            <span>
              {alert.tone === "bad" ? "🔴" : "🟡"} {alert.text}
            </span>
            {alert.href && (
              <Link
                href={alert.href}
                className="ml-auto shrink-0 underline underline-offset-2"
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
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-[13px] font-bold text-neutral-900">{title}</h2>
        {aside && (
          <span className="ml-auto text-[11px] text-neutral-400">{aside}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-[12.5px] text-neutral-400">{children}</p>;
}
