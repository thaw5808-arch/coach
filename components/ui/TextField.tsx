import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  trailing?: ReactNode;
  /** "surface" (white, the default — checkout/delivery forms) or "bg" (page tint — promo code on the bag page). */
  tone?: "surface" | "bg";
};

/** Figma "Text Field" (50:62) — Default / Focus / Error, with an optional trailing action. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ error, trailing, tone = "surface", className = "", ...props }, ref) {
  return (
    <div
      className={`flex h-[53px] items-center gap-2 rounded-pill border pl-5 pr-2 ${tone === "surface" ? "bg-surface" : "bg-bg"} ${
        error ? "border-[1.5px] border-error" : "border-line focus-within:border-[1.5px] focus-within:border-accent-deep"
      } ${className}`}
    >
      <input
        ref={ref}
        {...props}
        aria-invalid={error || undefined}
        className="type-body min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none"
      />
      {trailing}
    </div>
  );
});
