"use client";

import { useEffect, useRef, useState } from "react";
import { InfoIcon } from "@/components/ui/Icons";

/** Figma "State / Security Code — Help" (Checkout Payment States 59:133) — keyboard-accessible, Esc-closable popover. */
export function CvcHelpPopover() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={open ? "cvc-help-panel" : undefined}
        aria-label="What is the security code?"
        className="flex size-6 items-center justify-center text-ink-muted hover:text-ink"
      >
        <InfoIcon size={16} />
      </button>
      {open && (
        <div
          id="cvc-help-panel"
          role="tooltip"
          className="absolute right-0 top-8 z-30 w-[240px] rounded-[16px] border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <p className="type-caption text-ink">
            The 3-digit code on the back of your card, just right of the signature strip. American Express cards have a 4-digit code on the front, above the
            number.
          </p>
        </div>
      )}
    </div>
  );
}
