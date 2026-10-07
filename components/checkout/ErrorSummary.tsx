import { ErrorIcon } from "@/components/ui/Icons";

/** Figma "State / Form — Validation Errors" (Checkout States 54:177) — shared by checkout and the Client Care form. */
export function ErrorSummary<K extends string>({
  errors,
  label,
  onJumpToField,
}: {
  errors: Partial<Record<K, string>>;
  /** Human label for a field key (follows the country on checkout: State / Province …). */
  label: (field: K) => string;
  onJumpToField: (field: K) => void;
}) {
  const fields = (Object.keys(errors) as K[]).filter((f) => errors[f]);
  if (fields.length === 0) return null;

  return (
    <div role="alert" className="flex w-full items-start gap-3 rounded-pill border border-error bg-surface px-5 py-4">
      <span className="mt-0.5 shrink-0 text-error">
        <ErrorIcon size={18} />
      </span>
      <div className="flex flex-col items-start gap-1">
        <p className="type-h4 text-ink">
          Please check {fields.length} {fields.length === 1 ? "field" : "fields"} before continuing
        </p>
        <p className="type-caption flex flex-wrap gap-x-1.5 text-error">
          {fields.map((f, i) => (
            <span key={f}>
              <button type="button" onClick={() => onJumpToField(f)} className="underline decoration-from-font">
                {label(f)}
              </button>
              {i < fields.length - 1 && " ·"}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
