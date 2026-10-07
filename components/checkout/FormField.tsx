import { forwardRef, type InputHTMLAttributes } from "react";
import { TextField } from "@/components/ui/TextField";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hideLabel?: boolean;
};

/** Figma "Text Field" (50:62) with its label + helper/error row. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField({ label, error, hideLabel, id, className = "", ...props }, ref) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${fieldId}-error`;

  return (
    <div className={`flex w-full flex-col items-start gap-2 ${className}`}>
      <label htmlFor={fieldId} className={`type-caption text-ink ${hideLabel ? "sr-only" : ""}`}>
        {label}
      </label>
      <TextField id={fieldId} ref={ref} error={!!error} aria-describedby={error ? errorId : undefined} className="w-full" {...props} />
      {error && (
        <p id={errorId} role="alert" className="type-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
});
