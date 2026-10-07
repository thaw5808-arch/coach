import { CheckIcon } from "./Icons";

/** Figma "Checkbox" (42:57) — Unchecked / Checked. */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex size-11 shrink-0 items-center justify-center"
    >
      <span
        className={`flex size-5 items-center justify-center rounded-[6px] border ${
          checked ? "border-ink bg-ink text-surface" : "border-ink-muted bg-surface"
        }`}
      >
        {checked && <CheckIcon size={12} />}
      </span>
    </button>
  );
}
