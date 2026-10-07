"use client";

import { useId, useState, type ReactNode } from "react";
import { MinusIcon, PlusIcon } from "./Icons";

/**
 * Figma "Accordion Item" (27:420) — Default / Expanded. Uncontrolled by default; pass `open` + `onOpenChange` to drive
 * it from outside (Client Care opens the question an anchor points to).
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  id,
  level = 3,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** DOM id of the item (anchor target); the panel gets `${id}-panel`. */
  id?: string;
  /** Heading level of the trigger — follow the page outline (PDP: right under the h1 → 2). */
  level?: 2 | 3;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const autoId = useId();
  const panelId = `${id ?? autoId}-panel`;
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <div id={id} className="w-full scroll-mt-24 border-t border-line">
      <Heading>
        <button
          type="button"
          onClick={() => {
            if (controlledOpen === undefined) setUncontrolledOpen(!open);
            onOpenChange?.(!open);
          }}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-[60px] w-full items-center justify-between gap-4 py-3 text-left"
        >
          <span className="type-eyebrow text-ink">{title}</span>
          {open ? <MinusIcon size={16} className="shrink-0 text-ink" /> : <PlusIcon size={16} className="shrink-0 text-ink" />}
        </button>
      </Heading>
      <div id={panelId} role="region" aria-label={title} hidden={!open} className="type-body w-full pb-6 text-ink-muted">
        {children}
      </div>
    </div>
  );
}
