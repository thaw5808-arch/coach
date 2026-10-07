"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { locateStores } from "@/lib/storeLocator";
import { distanceLabel, openStatus, stores, type Store } from "@/lib/stores";

/** Map frame: every store fits with padding; positions are % of the box (no tiles, no third-party map). */
const PAD = 0.22;
const lats = stores.map((s) => s.lat);
const lngs = stores.map((s) => s.lng);
const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
function project(s: Store) {
  const x = (s.lng - minLng) / (maxLng - minLng || 1);
  const y = 1 - (s.lat - minLat) / (maxLat - minLat || 1);
  return { left: `${(PAD + x * (1 - 2 * PAD)) * 100}%`, top: `${(PAD + y * (1 - 2 * PAD)) * 100}%` };
}

/** Figma "Stores — Locator Results" (100:173): search + list on the left, an illustrated street map on the right. */
export function StoreLocator({ onBook }: { onBook: (store: Store) => void }) {
  const [query, setQuery] = useState("New York, NY");
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => setNow(new Date()), []);

  const { results, summary } = useMemo(() => locateStores(query), [query]);
  const activeId = results.some((r) => r.store.id === selected) ? selected : (results[0]?.store.id ?? null);

  const select = (id: string, scroll = false) => {
    setSelected(id);
    if (scroll) listRef.current?.querySelector<HTMLElement>(`[data-store="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="flex w-full flex-col gap-4 desk:flex-row desk:items-stretch desk:gap-6">
      <div className="flex w-full flex-col gap-4 rounded-[24px] bg-surface p-5 desk:w-[460px] desk:shrink-0 desk:p-8">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex h-[52px] items-center gap-3 rounded-[24px] bg-bg px-5">
          <SearchIcon size={38} className="shrink-0 text-ink" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, ZIP or boutique"
            aria-label="Find a boutique by city, ZIP or name"
            aria-controls="store-results"
            className="type-body min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-blob">
              <CloseIcon size={18} />
            </button>
          )}
        </form>
        <p className="type-caption text-ink-muted" aria-live="polite">
          {summary}
        </p>
        {results.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-[16px] bg-bg p-4">
            <p className="type-h4 text-ink">No boutiques near “{query.trim()}”</p>
            <p className="type-caption text-ink-muted">Our boutiques are in New York — try SoHo, Midtown or a ZIP like 10012.</p>
            <Button variant="text" showArrow={false} onClick={() => setQuery("")}>
              Show all boutiques
            </Button>
          </div>
        ) : (
          <ul id="store-results" ref={listRef} className="flex flex-col gap-1">
            {results.map(({ store, miles }, i) => {
              const active = store.id === activeId;
              const status = now ? openStatus(store, now) : null;
              return (
                <li key={store.id} data-store={store.id}>
                  <div className={`flex w-full flex-col gap-3 rounded-[16px] p-4 transition-colors ${active ? "bg-blob" : "hover:bg-bg"}`}>
                    <button type="button" onClick={() => select(store.id)} aria-pressed={active} className="flex w-full items-start gap-4 text-left">
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="type-h4 text-ink">
                          <span className="sr-only">{i + 1}. </span>
                          {store.shortName}
                        </span>
                        <span className="type-caption text-ink-muted">{store.street}</span>
                        <span className={`type-caption min-h-[21px] ${status?.open ? "text-accent-deep" : "text-ink-muted"}`}>{status?.label}</span>
                      </span>
                      {miles !== null && <span className="type-price-sm shrink-0 text-ink-muted">{distanceLabel(miles)}</span>}
                    </button>
                    {active && (
                      <Button variant="text" onClick={() => onBook(store)} className="self-start">
                        Book an appointment
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Illustrated map (Figma 100:199) — decorative streets; pins are buttons linked to the list. */}
      <div className="relative h-[320px] w-full overflow-hidden rounded-[24px] bg-blob desk:h-auto desk:min-h-[480px] desk:flex-1" aria-label="Boutique map" role="group">
        {[
          "left-0 top-[26%] h-[2px] w-full",
          "left-0 top-[46%] h-[2px] w-full",
          "left-0 top-[9%] h-px w-full",
          "left-[33%] top-0 h-full w-[2px]",
          "left-[66%] top-0 h-full w-[2px]",
          "left-[15%] top-0 h-full w-px",
        ].map((c) => (
          <span key={c} aria-hidden="true" className={`absolute bg-line ${c}`} />
        ))}
        {results.map(({ store }, i) => {
          const active = store.id === activeId;
          return (
            <button
              key={store.id}
              type="button"
              onClick={() => select(store.id, true)}
              aria-pressed={active}
              aria-label={`${i + 1}. ${store.shortName}`}
              data-pin={store.id}
              style={project(store)}
              className={`type-badge absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-surface transition-all ${
                active ? "z-10 size-10 bg-accent-deep" : "size-8 bg-ink hover:bg-accent-deep"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
