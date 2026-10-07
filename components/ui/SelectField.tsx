import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronIcon } from "./Icons";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hideLabel?: boolean;
  children: ReactNode;
};

/**
 * Figma "Select Field" (50:102) — a native <select> styled to match, for real keyboard/
 * screen-reader support. The closed field matches Figma exactly; the open option list is
 * rendered by the browser/OS rather than Figma's custom menu mockup.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hideLabel, id, className = "", children, ...props },
  ref,
) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${fieldId}-error`;

  return (
    <div className={`flex w-full flex-col items-start gap-2 ${className}`}>
      <label htmlFor={fieldId} className={`type-caption text-ink ${hideLabel ? "sr-only" : ""}`}>
        {label}
      </label>
      <div
        className={`relative flex h-[53px] w-full items-center rounded-pill border bg-surface pl-5 pr-4 ${
          error ? "border-[1.5px] border-error" : "border-line focus-within:border-[1.5px] focus-within:border-accent-deep"
        }`}
      >
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          className="type-body size-full appearance-none truncate bg-transparent pr-6 text-ink focus:outline-none"
          {...props}
        >
          {children}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-4 text-ink">
          <ChevronIcon size={16} />
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="type-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
});
