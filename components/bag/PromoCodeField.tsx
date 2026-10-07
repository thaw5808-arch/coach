"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlusIcon, RemoveIcon } from "@/components/ui/Icons";
import { TextField } from "@/components/ui/TextField";
import type { PromoResult } from "@/lib/promos";

/** Figma "State / Promo Code — Open / Applied / Error" (Shopping Bag States 45:326). */
export function PromoCodeField({
  appliedCode,
  onApply,
  onRemove,
}: {
  appliedCode: string | null;
  onApply: (code: string) => PromoResult;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApply() {
    if (!value.trim()) return;
    const result = onApply(value);
    if (result.ok) {
      setError(null);
      setValue("");
      setOpen(false);
    } else {
      setError(result.message);
    }
  }

  if (appliedCode) {
    return (
      <div className="flex w-full items-center border-y border-line py-3.5">
        <span className="flex items-center gap-2 rounded-pill bg-blob py-2 pl-4 pr-3">
          <span className="type-chip text-accent-deep">{appliedCode} applied</span>
          <button type="button" onClick={onRemove} aria-label={`Remove promo code ${appliedCode}`} className="text-accent-deep">
            <RemoveIcon size={14} />
          </button>
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-14 w-full items-center justify-between border-y border-line">
        <span className="type-body text-ink">Add a promo code</span>
        <PlusIcon size={16} className="text-ink" />
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 border-y border-line py-3.5">
      <TextField
        autoFocus
        tone="bg"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        placeholder="Enter code"
        aria-label="Promo code"
        error={!!error}
        aria-describedby={error ? "promo-error" : undefined}
        trailing={
          <Button variant="text" showArrow={false} onClick={handleApply}>
            Apply
          </Button>
        }
      />
      {error && (
        <p id="promo-error" role="alert" className="type-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}
