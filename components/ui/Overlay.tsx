"use client";

import { useEffect, useRef, type ReactNode } from "react";

type OverlayShape = "drawer" | "sheet" | "center" | "responsive";

const SHAPE_CLASS: Record<OverlayShape, string> = {
  drawer:
    "absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-surface rounded-tl-[20px] rounded-bl-[20px]",
  sheet:
    "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[20px] bg-surface pt-3",
  center:
    "absolute inset-0 m-auto flex h-fit max-h-[90vh] w-fit max-w-[95vw] flex-col items-center rounded-pill bg-surface",
  // Bottom sheet on mobile, right-hand drawer from desk: up (Filters drawer / mobile filter sheet).
  responsive:
    "absolute inset-x-0 bottom-0 flex max-h-[85vh] w-full flex-col rounded-t-[20px] bg-surface pt-3 desk:inset-y-0 desk:inset-x-auto desk:bottom-auto desk:left-auto desk:right-0 desk:max-h-none desk:max-w-[440px] desk:rounded-t-none desk:rounded-tl-[20px] desk:rounded-bl-[20px] desk:pt-0",
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared scrim + panel shell for drawers, bottom sheets, and the gallery lightbox. Traps focus while open. */
export function Overlay({
  open,
  onClose,
  shape,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  shape: OverlayShape;
  label: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (focusables()[0] ?? panel)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label={`Close ${label}`} onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={SHAPE_CLASS[shape]}>
        {shape === "sheet" && (
          <div className="flex justify-center pb-2">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>
        )}
        {shape === "responsive" && (
          <div className="flex justify-center pb-2 desk:hidden">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
