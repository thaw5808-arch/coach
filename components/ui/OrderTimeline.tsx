import type { OrderStage } from "@/lib/orderStatus";
import { ActiveMarkerIcon, CheckIcon } from "./Icons";

type StepState = "done" | "active" | "upcoming";

type Step = {
  key: string;
  label: string;
  date: string;
  state: StepState;
};

const MARKER_BASE = "flex size-6 shrink-0 items-center justify-center rounded-full";

function Marker({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className={`${MARKER_BASE} bg-accent-deep text-surface`}>
        <CheckIcon size={12} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className={`${MARKER_BASE} text-ink`}>
        <ActiveMarkerIcon size={24} />
      </span>
    );
  }
  return <span className={`${MARKER_BASE} border border-line bg-surface`} />;
}

const LABEL_COLOR: Record<StepState, string> = {
  done: "text-accent-deep",
  active: "text-ink",
  upcoming: "text-ink-muted",
};

/** Figma "Order Timeline" (62:252) — Preparing/Shipped/Delivered, derived from order age. */
export function OrderTimeline({
  stage,
  placedLabel,
  preparingLabel,
  shippedLabel,
  deliveredLabel,
}: {
  stage: OrderStage;
  placedLabel: string;
  preparingLabel: string;
  shippedLabel: string;
  deliveredLabel: string;
}) {
  const steps: Step[] = [
    { key: "placed", label: "ORDER PLACED", date: placedLabel, state: "done" },
    { key: "preparing", label: "PREPARING", date: `Initials hot-stamped · ${preparingLabel}`, state: stage === "preparing" ? "active" : "done" },
    { key: "shipped", label: "SHIPPED", date: `Estimated ${shippedLabel}`, state: stage === "shipped" ? "active" : stage === "delivered" ? "done" : "upcoming" },
    { key: "delivered", label: "DELIVERED", date: `Estimated ${deliveredLabel}`, state: stage === "delivered" ? "done" : "upcoming" },
  ];

  return (
    <>
      {/* Desktop: horizontal row, each step flex-1 with a connecting line. */}
      <div className="hidden w-full items-start desk:flex">
        {steps.map((step, i) => (
          <div key={step.key} className={`flex min-w-0 flex-col items-start gap-4 ${i < steps.length - 1 ? "flex-1" : ""} ${i === steps.length - 1 ? "items-end text-right" : ""}`}>
            <div className={`flex w-full items-center ${i < steps.length - 1 ? "gap-3 pr-3" : ""}`}>
              <Marker state={step.state} />
              {i < steps.length - 1 && <span aria-hidden="true" className={`h-[1.5px] flex-1 ${steps[i].state === "done" ? "bg-accent-deep" : "bg-line"}`} />}
            </div>
            <div className="flex flex-col gap-1">
              <p className={`type-eyebrow ${LABEL_COLOR[step.state]}`}>{step.label}</p>
              <p className="type-caption text-ink-muted">{step.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack, each step with a connecting line below its marker. */}
      <div className="flex w-full flex-col items-start desk:hidden">
        {steps.map((step, i) => (
          <div key={step.key} className="flex w-full items-start gap-4">
            <div className="flex flex-col items-center">
              <Marker state={step.state} />
              {i < steps.length - 1 && <span aria-hidden="true" className={`h-9 w-[1.5px] ${step.state === "done" ? "bg-accent-deep" : "bg-line"}`} />}
            </div>
            <div className={`flex flex-col gap-0.5 ${i < steps.length - 1 ? "pb-4" : ""}`}>
              <p className={`type-eyebrow ${LABEL_COLOR[step.state]}`}>{step.label}</p>
              <p className="type-caption text-ink-muted">{step.date}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
