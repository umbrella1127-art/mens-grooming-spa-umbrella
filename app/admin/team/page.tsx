import { Card } from "@/components/admin/board";
import {
  FLOW,
  HUMAN_TASKS,
  ORCHESTRATOR,
  SCHEDULE,
  UNITS,
  type Member,
} from "@/lib/admin/team";

function MemberBlock({ member }: { member: Member }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-serif-jp text-[14px] tracking-wide text-ink">
          {member.name}
        </span>
        <span className="text-[11.5px] text-charcoal-light">{member.role}</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-charcoal">
        {member.detail}
      </p>
      <p className="mt-1.5 text-[11px] text-greige">出すもの：{member.outputs}</p>
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">TEAM</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          部署・担当
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          コンテンツ企画を自動で回している担当の一覧と、その受け渡しの順番です。
        </p>
      </div>

      <Card eyebrow="SCHEDULE" title="動く時間">
        <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-[7rem_1fr]">
          <dt className="text-greige">実行</dt>
          <dd className="text-charcoal">{SCHEDULE.cron}</dd>
          <dt className="text-greige">仕事の名前</dt>
          <dd className="text-charcoal">{SCHEDULE.name}</dd>
          <dt className="text-greige">場所</dt>
          <dd className="text-charcoal">{SCHEDULE.where}</dd>
          <dt className="text-greige">モデル</dt>
          <dd className="tabular-nums text-charcoal">{SCHEDULE.model}</dd>
        </dl>
      </Card>

      <Card eyebrow="LEAD" title="進行役">
        <MemberBlock member={ORCHESTRATOR} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {UNITS.map((unit) => (
          <Card key={unit.label} eyebrow="UNIT" title={unit.label}>
            <div className="space-y-5">
              <MemberBlock member={unit.lead} />
              {unit.members.map((m) => (
                <div key={m.name} className="border-t border-beige/60 pt-5">
                  <MemberBlock member={m} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card eyebrow="FLOW" title="受け渡しの順番">
        <ol className="space-y-0">
          {FLOW.map((f) => (
            <li
              key={f.step}
              className="grid grid-cols-[2rem_1fr] gap-x-3 border-b border-beige/60 py-3 last:border-b-0"
            >
              <span className="font-serif-jp text-[15px] tabular-nums text-brown">
                {f.step}
              </span>
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[13px] text-ink">{f.title}</span>
                  <span className="text-[11px] text-greige">{f.by}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-charcoal">
                  {f.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card eyebrow="OWNER" title="人がやること">
        <ul className="space-y-2">
          {HUMAN_TASKS.map((t) => (
            <li
              key={t}
              className="border-l-2 border-brown pl-3 text-[12.5px] leading-relaxed text-charcoal"
            >
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
