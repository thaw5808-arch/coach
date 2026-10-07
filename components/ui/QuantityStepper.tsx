import { MinusIcon, PlusIcon } from "./Icons";

/** Figma "Quantity Stepper" (42:48) — Default / Min (decrease disabled) / Max (purchase limit reached). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 5,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center rounded-pill border border-line bg-surface">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className="flex size-11 items-center justify-center text-ink disabled:opacity-30"
      >
        <MinusIcon size={14} />
      </button>
      <span className="type-price-sm flex h-11 w-7 items-center justify-center text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase quantity of ${label}`}
        className="flex size-11 items-center justify-center text-ink disabled:opacity-30"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}
