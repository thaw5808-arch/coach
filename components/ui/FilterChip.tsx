import type { ButtonHTMLAttributes } from "react";
import { CloseIcon } from "./Icons";

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  /** "sheet" = inactive chips on a white surface (filters drawer / sheet 20:313, 92:3108) use the bg tint. */
  tone?: "page" | "sheet";
};

/** Figma "Filter Chip" (13:108) — Default / Hover / Active states. */
export function FilterChip({ active = false, tone = "page", className = "", ...props }: FilterChipProps) {
  const inactive = tone === "sheet" ? "bg-bg text-ink hover:bg-blob" : "bg-surface text-ink hover:bg-blob";
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`type-chip shrink-0 whitespace-nowrap rounded-pill px-6 py-3 transition-colors duration-150 ${
        active ? "bg-ink text-surface" : inactive
      } ${className}`}
      {...props}
    />
  );
}

/** Figma "Tag" (Women 73:421) — an applied filter; the whole pill removes it. */
export function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="type-chip flex shrink-0 items-center gap-2 whitespace-nowrap rounded-pill bg-accent-deep py-2 pl-4 pr-2.5 text-surface transition-colors duration-150 hover:bg-ink"
    >
      {label}
      <span aria-hidden="true" className="flex size-5 items-center justify-center">
        <CloseIcon size={12} />
      </span>
    </button>
  );
}
