/** 施術・来店の流れを縦に並べる共通コンポーネント */
export default function FlowSteps({
  steps,
}: {
  steps: { title: string; body?: string }[];
}) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brown font-serif-jp text-sm text-brown">
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-beige" aria-hidden="true" />
            )}
          </div>
          <div className="pt-1">
            <p className="font-serif-jp text-base text-ink">{step.title}</p>
            {step.body && (
              <p className="mt-1 text-sm text-charcoal-light">{step.body}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
