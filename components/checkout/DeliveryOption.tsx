/** Figma "Delivery Option" (50:128) — Default / Hover / Selected / Disabled. */
export function DeliveryOption({
  name,
  title,
  detail,
  price,
  selected,
  disabled,
  onSelect,
}: {
  name: string;
  title: string;
  detail: string;
  price: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex min-h-[86px] w-full cursor-pointer items-center gap-4 rounded-[20px] border bg-surface py-5 pl-5 pr-6 transition-colors ${
        disabled ? "cursor-not-allowed opacity-45" : selected ? "border-[1.5px] border-ink" : "border-line hover:bg-blob"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect()}
        className="sr-only"
        aria-describedby={`${name}-${title.replace(/\s+/g, "-")}-detail`}
      />
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-ink" : "border-ink-muted"}`}
      >
        {selected && <span className="size-2.5 rounded-full bg-ink" />}
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="type-h4 text-ink">{title}</span>
        <span id={`${name}-${title.replace(/\s+/g, "-")}-detail`} className="type-caption text-ink-muted">
          {detail}
        </span>
      </span>
      <span className="type-body text-ink">{price}</span>
    </label>
  );
}
