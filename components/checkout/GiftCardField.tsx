"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlusIcon, RemoveIcon } from "@/components/ui/Icons";
import { TextField } from "@/components/ui/TextField";
import type { GiftCardResult } from "@/lib/checkout/giftCards";
import { formatPrice } from "@/lib/format";

/** Figma "State / Gift Card — Applied" (Checkout Payment States 59:133). */
export function GiftCardField({
  appliedLast4,
  appliedAmount,
  onApply,
  onRemove,
}: {
  appliedLast4: string | null;
  appliedAmount: number;
  onApply: (code: string) => GiftCardResult;
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

  if (appliedLast4) {
    return (
      <div className="flex w-full items-center justify-between border-y border-line py-3.5">
        <span className="flex items-center gap-2 rounded-pill bg-blob py-2 pl-4 pr-3">
          <span className="type-chip text-accent-deep">
            Gift card ending {appliedLast4} · {formatPrice(appliedAmount)} applied
          </span>
          <button type="button" onClick={onRemove} aria-label="Remove gift card" className="text-accent-deep">
            <RemoveIcon size={14} />
          </button>
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-14 w-full items-center justify-between border-y border-line">
        <span className="type-body text-ink">Add a gift card</span>
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
        placeholder="Enter gift card code"
        aria-label="Gift card code"
        error={!!error}
        aria-describedby={error ? "gift-card-error" : undefined}
        trailing={
          <Button variant="text" showArrow={false} onClick={handleApply}>
            Apply
          </Button>
        }
      />
      {error && (
        <p id="gift-card-error" role="alert" className="type-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}
