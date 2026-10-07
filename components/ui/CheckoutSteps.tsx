import { CheckIcon } from "./Icons";

const STEPS: string[] = ["Bag", "Delivery", "Payment"];

/** Figma "Checkout Steps" (42:106) — desktop numbered markers; mobile segmented progress bar. */
export function CheckoutSteps({ step }: { step: 1 | 2 | 3 }) {
  const current = STEPS[step - 1];
  const next = step < 3 ? STEPS[step] : undefined;

  return (
    <>
      <div className="hidden items-center gap-4 desk:flex">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <span key={label} className="contents">
              {i > 0 && <span aria-hidden="true" className={`h-px w-12 ${i < step - 1 ? "bg-accent-deep" : "bg-line"}`} />}
              <span className="flex items-center gap-2.5">
                <span
                  className={`type-badge flex size-6 items-center justify-center rounded-full ${
                    done ? "bg-accent-deep text-surface" : active ? "bg-ink text-surface" : "border border-line text-ink-muted"
                  }`}
                >
                  {done ? <CheckIcon size={12} /> : n}
                </span>
                <span className={`type-eyebrow ${done ? "text-accent-deep" : active ? "text-ink" : "text-ink-muted"}`}>{label.toUpperCase()}</span>
              </span>
            </span>
          );
        })}
      </div>

      <div className="flex w-full flex-col gap-3 desk:hidden">
        <div className="flex w-full items-center justify-between">
          <p className="type-eyebrow text-ink">
            STEP {step} OF 3 — {current.toUpperCase()}
          </p>
          {next && <p className="type-caption text-ink-muted">Next: {next}</p>}
        </div>
        <div className="flex w-full gap-2">
          {STEPS.map((label, i) => (
            <span key={label} className={`h-0.5 flex-1 rounded-full ${i + 1 < step ? "bg-accent-deep" : i + 1 === step ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
      </div>
    </>
  );
}
