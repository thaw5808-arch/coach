"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowIcon, CheckIcon } from "./Icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Figma "Email Field" (19:351) — newsletter signup with Default/Focus/Error/Success states. */
export function EmailField({
  className = "",
  successMessage = "You’re on the list — welcome to the next chapter.",
}: {
  className?: string;
  successMessage?: string;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const id = useId();
  const errorId = `${id}-error`;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "success") return;
    if (!EMAIL_RE.test(value.trim())) {
      setStatus("error");
      return;
    }
    setStatus("success");
  }

  const isError = status === "error";
  const isSuccess = status === "success";
  const borderClass = isError
    ? "border-[1.5px] border-error"
    : isSuccess
      ? "border-[1.5px] border-accent-deep"
      : "border border-line focus-within:border-[1.5px] focus-within:border-accent-deep";

  return (
    <form className={`flex flex-col items-start gap-2 ${className}`} onSubmit={handleSubmit} noValidate>
      <div className={`flex h-[53px] w-full items-center overflow-clip rounded-pill bg-bg py-1 pl-6 pr-2 ${borderClass}`}>
        <label htmlFor={id} className="sr-only">
          Your email address
        </label>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email address"
          value={value}
          disabled={isSuccess}
          aria-invalid={isError || undefined}
          aria-describedby={isError ? errorId : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          className="type-body min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none disabled:text-ink"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className={`flex size-[37px] shrink-0 items-center justify-center rounded-full text-surface ${isSuccess ? "bg-accent-deep" : "bg-ink"}`}
        >
          {isSuccess ? <CheckIcon size={16} /> : <ArrowIcon size={16} />}
        </button>
      </div>
      {isError && (
        <p id={errorId} className="type-caption text-error">
          Please enter a valid email address.
        </p>
      )}
      {isSuccess && (
        <p role="status" className="type-caption text-accent-deep">
          {successMessage}
        </p>
      )}
    </form>
  );
}
