/** Figma "Colour Swatch" (27:351) — 28px dot in a 44px touch target; Default/Hover/Selected/Unavailable. */
export function ColorSwatch({
  hex,
  name,
  selected = false,
  available = true,
  onClick,
  className = "",
}: {
  hex: string;
  name: string;
  selected?: boolean;
  available?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={available ? name : `${name} — sold out`}
      className={`relative flex size-11 shrink-0 items-center justify-center ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-[27px] rounded-full ${selected ? "" : "ring-1 ring-line transition-shadow hover:ring-ink-muted"} ${available ? "" : "opacity-45"}`}
        style={{
          backgroundColor: hex,
          boxShadow: selected ? "0 0 0 3px var(--color-surface), 0 0 0 4.5px var(--color-ink)" : undefined,
        }}
      />
      {!available && <span aria-hidden="true" className="absolute h-px w-[25px] rotate-45 bg-ink-muted" />}
    </button>
  );
}
