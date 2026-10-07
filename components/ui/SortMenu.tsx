"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "./Icons";
import { FilterChip } from "./FilterChip";

export type SortOption = { key: string; label: string };

/** Figma "State / Sort — Open" (20:314) — chip opens a menu; selected option shows a check. */
export function SortMenu({ options, value, onChange }: { options: SortOption[]; value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex shrink-0 flex-col items-end">
      <FilterChip
        className="w-full desk:w-auto"
        active={open}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {current.label}
      </FilterChip>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[280px] overflow-hidden rounded-[20px] border border-line bg-surface py-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
        >
          {options.map((o) => {
            const selected = o.key === value;
            return (
              <li key={o.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  className={`type-chip flex h-12 w-full items-center justify-between pl-6 pr-5 text-left tracking-[0.02em] hover:bg-bg ${
                    selected ? "text-accent-deep" : "text-ink"
                  }`}
                >
                  {o.label}
                  {selected && <CheckIcon size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
