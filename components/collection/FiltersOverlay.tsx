"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";
import { CloseIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";
import { emptyFacets, type ColourOption, type FilterState, type PriceOption, type TypeOption } from "@/lib/collection";

function toggle<T>(current: T | null, value: T): T | null {
  return current === value ? null : value;
}

function Group({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <fieldset className={`flex flex-col gap-3 border-t border-line py-5 desk:gap-4 desk:py-6 ${className}`}>
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="type-eyebrow text-ink">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * Figma "Filters — Drawer (Desktop)" + "Mobile — Filter Sheet" (New Arrival 20:313, Women 92:3108).
 * Edits a draft; nothing touches the URL until the primary "Show N pieces" action applies it.
 * Desktop: Colour / Material / Price (category lives in the chip row). Mobile: Category / Material / Price.
 */
export function FiltersOverlay({
  open,
  onClose,
  draft,
  onDraftChange,
  onApply,
  types,
  colours,
  materials,
  prices,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  draft: FilterState;
  onDraftChange: (next: FilterState) => void;
  onApply: () => void;
  types: TypeOption[];
  colours: ColourOption[];
  materials: string[];
  prices: PriceOption[];
  resultCount: number;
}) {
  const clear = () => onDraftChange({ ...draft, ...emptyFacets });

  return (
    <Overlay open={open} onClose={onClose} shape="responsive" label="Filters">
      <>
        <div className="flex items-center justify-between px-4 pb-2 desk:px-10 desk:py-8">
          <p className="type-h1-mobile text-ink">Filters</p>
          <button type="button" onClick={onClose} aria-label="Close filters" className="flex size-11 items-center justify-center text-ink">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 desk:px-10">
          <fieldset className="hidden flex-col gap-4 border-t border-line py-6 desk:flex">
            <legend className="sr-only">Colour</legend>
            <p aria-hidden="true" className="type-eyebrow text-ink">
              COLOUR
            </p>
            <div className="flex flex-wrap gap-3">
              {colours.map((c) => {
                const selected = draft.colour === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onDraftChange({ ...draft, colour: toggle(draft.colour, c.name) })}
                    className={`flex items-center gap-2 rounded-pill py-1.5 pl-2 pr-3 hover:bg-blob ${selected ? "bg-blob" : ""}`}
                  >
                    <span className="size-4 rounded-full ring-1 ring-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                    <span className={`type-caption ${selected ? "text-accent-deep" : "text-ink"}`}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Group title="CATEGORY" className="desk:hidden">
            {types.map((o) => (
              <FilterChip key={o.key} tone="sheet" active={draft.type === o.key} onClick={() => onDraftChange({ ...draft, type: toggle(draft.type, o.key) })}>
                {o.label}
              </FilterChip>
            ))}
          </Group>

          <Group title="MATERIAL">
            {materials.map((m) => (
              <FilterChip key={m} tone="sheet" active={draft.material === m} onClick={() => onDraftChange({ ...draft, material: toggle(draft.material, m) })}>
                {m}
              </FilterChip>
            ))}
          </Group>

          <Group title="PRICE">
            {prices.map((p) => (
              <FilterChip key={p.key} tone="sheet" active={draft.price === p.key} onClick={() => onDraftChange({ ...draft, price: toggle(draft.price, p.key) })}>
                {p.label}
              </FilterChip>
            ))}
          </Group>
        </div>

        <div className="flex gap-2 border-t border-line px-4 pb-6 pt-4 desk:gap-3 desk:px-10 desk:pb-8 desk:pt-6">
          <Button variant="secondary" showArrow={false} onClick={clear} className="border border-line">
            <span className="desk:hidden">Clear</span>
            <span className="hidden desk:inline">Clear all</span>
          </Button>
          <Button className="flex-1" showArrow={false} onClick={onApply} aria-live="polite">
            Show {resultCount} {resultCount === 1 ? "piece" : "pieces"}
          </Button>
        </div>
      </>
    </Overlay>
  );
}
