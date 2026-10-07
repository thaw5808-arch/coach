"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmailField } from "@/components/ui/EmailField";
import type { CollectionConfig } from "@/lib/collection";

/**
 * Figma "Grid — No Results":
 *  - plain (New Arrival 20:313): blob, secondary "Clear filters", text link to the full collection.
 *  - card  (Women 73:466 desktop / 92:3374 mobile): white card, primary "Clear filters", "Notify me" text CTA.
 */
export function NoResults({ empty, summary, hasFilters, onClear }: { empty: CollectionConfig["empty"]; summary: string; hasFilters: boolean; onClear: () => void }) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const notifyRef = useRef<HTMLDivElement>(null);
  const card = empty.style === "card";
  const body = hasFilters ? empty.body.replace("{summary}", summary) : empty.fallbackBody;

  useEffect(() => {
    if (notifyOpen) notifyRef.current?.querySelector("input")?.focus();
  }, [notifyOpen]);

  return (
    <div className={card ? "w-full px-4 desk:px-0" : "w-full"}>
      <div
        className={
          card
            ? "mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 rounded-pill bg-surface px-4 py-10 text-center desk:px-12 desk:py-[72px]"
            : "flex w-full flex-col items-center gap-4 px-4 py-16 text-center desk:py-24"
        }
      >
        {!card && <span aria-hidden="true" className="h-[108px] w-[120px] rounded-[50%] bg-blob" />}
        <div role="status" className="flex flex-col items-center gap-4">
          <p className="type-eyebrow text-accent-deep">NO PIECES FOUND</p>
          {/* Mobile card title is 22/28 in Figma (92:3376) — not a named text style. */}
          <h3 className={card ? "font-display text-[22px] font-bold leading-[28px] text-ink desk:type-h1" : "type-h1 text-ink"}>{empty.title}</h3>
          <p className="type-body w-full max-w-[440px] text-ink-muted">{body}</p>
        </div>
        <div className={`flex items-center pt-2 ${card ? "flex-col gap-3 desk:flex-row desk:gap-8" : "gap-8"}`}>
          <Button variant={card ? "primary" : "secondary"} showArrow={false} onClick={onClear}>
            Clear filters
          </Button>
          {empty.secondary.kind === "link" ? (
            <Button variant="text" href={empty.secondary.href}>
              {empty.secondary.label}
            </Button>
          ) : (
            <Button variant="text" aria-expanded={notifyOpen} aria-controls="collection-notify" onClick={() => setNotifyOpen(true)}>
              {empty.secondary.label}
            </Button>
          )}
        </div>
        {empty.secondary.kind === "notify" && notifyOpen && (
          <div ref={notifyRef} id="collection-notify" className="w-full max-w-[380px] pt-2 text-left">
            <EmailField className="w-full" successMessage="We’ll write as soon as one arrives." />
          </div>
        )}
      </div>
    </div>
  );
}
