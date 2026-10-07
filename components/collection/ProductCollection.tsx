"use client";

import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { FilterChip, FilterTag } from "@/components/ui/FilterChip";
import { ProductCard, ProductCardSkeleton } from "@/components/ui/ProductCard";
import { SortMenu } from "@/components/ui/SortMenu";
import {
  activeFacetCount,
  applyFilters,
  colourOptions,
  describeFilters,
  emptyFacets,
  materialOptions,
  parseFilters,
  toQueryString,
  type CollectionConfig,
  type FacetKey,
  type FilterState,
} from "@/lib/collection";
import type { Product } from "@/lib/products";
import { FiltersOverlay } from "./FiltersOverlay";
import { NoResults } from "./NoResults";

/** An editorial / promo tile slotted into the grid after N products (per breakpoint). */
export type CollectionBlock = {
  key: string;
  node: ReactNode;
  desktopAfter: number;
  mobileAfter: number;
  /** Desktop column span: the whole row (New Arrival "Blush Edit") or two columns (Women editorial / promo). */
  desktopSpan: "full" | 2;
  /** Keep the block when it would be the grid's last item (promos); editorial breaks need products after them. */
  showAtEnd?: boolean;
  className?: string;
};

const LAYOUT = {
  "three-large": {
    card: "large" as const,
    grid: "grid grid-cols-2 gap-4 px-4 desk:grid-cols-3 desk:gap-12 desk:px-0",
    top: "pt-6 desk:pt-8",
    skeletons: 3,
    loadMore: "pt-16 desk:pt-24",
    loadMoreGap: "gap-6",
    loadMoreButton: "w-full desk:w-auto",
    loadMoreLabel: "Load More Pieces",
  },
  "four-medium": {
    card: "medium" as const,
    grid: "grid grid-cols-2 gap-x-4 gap-y-8 px-4 desk:grid-cols-4 desk:gap-x-8 desk:gap-y-16 desk:px-0",
    top: "pt-8 desk:pt-12",
    skeletons: 4,
    loadMore: "pt-12 desk:pt-24",
    loadMoreGap: "gap-4 desk:gap-6",
    loadMoreButton: "w-full desk:w-auto",
    loadMoreLabel: "Load more pieces",
  },
};

/** Simulated fetch latency so filter/sort changes show Figma "Grid — Loading" (20:383). */
const LOADING_MS = 400;

function visibilityClass(mobile: boolean, desktop: boolean) {
  if (mobile && desktop) return "";
  if (desktop) return "hidden desk:block";
  return "desk:hidden";
}

/**
 * Shared filterable product grid — New Arrival + category pages.
 * State lives in the URL (?type=&colour=&material=&price=&sort=) via history.pushState, so filtered views are
 * shareable, survive reload, and Back/Forward step through them. Must render inside <Suspense> (useSearchParams).
 */
export function ProductCollection({
  items,
  config,
  blocks = [],
  allLabel = "All",
  filtersButton = true,
}: {
  /** The collection's products in curated ("featured") order. */
  items: Product[];
  config: CollectionConfig;
  blocks?: CollectionBlock[];
  allLabel?: string;
  /** Search results (Figma 95:1268) show only the chip row + Sort — no Filters drawer. */
  filtersButton?: boolean;
}) {
  const layout = LAYOUT[config.grid];
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const state = useMemo(() => parseFilters(new URLSearchParams(queryKey), config, items), [queryKey, config, items]);

  const colours = useMemo(() => colourOptions(config, items), [config, items]);
  const materials = useMemo(() => materialOptions(config, items).map((m) => m.label), [config, items]);
  const chipTypes = config.types.filter((t) => !t.hidden);

  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(state);
  const lastQuery = useRef(queryKey);

  // Any URL change (chip, sheet, tag, Back/Forward, mega-menu link) resets paging and shows the loading state.
  useEffect(() => {
    if (lastQuery.current === queryKey) return;
    lastQuery.current = queryKey;
    setPages(1);
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LOADING_MS);
    return () => clearTimeout(t);
  }, [queryKey]);

  const commit = useCallback(
    (next: FilterState) => {
      const query = toQueryString(next, config, new URLSearchParams(window.location.search));
      if (query === window.location.search) return;
      window.history.pushState(null, "", `${window.location.pathname}${query}`);
    },
    [config],
  );

  const update = (patch: Partial<FilterState>) => commit({ ...state, ...patch });
  const clearAll = () => commit({ ...state, ...emptyFacets });

  const filtered = useMemo(() => applyFilters(items, state, config), [items, state, config]);
  const draftCount = useMemo(() => applyFilters(items, draft, config).length, [items, draft, config]);
  const facetCount = activeFacetCount(state);

  const openFilters = () => {
    setDraft(state);
    setFiltersOpen(true);
  };
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  // After "Load more", move focus to the first newly revealed card so keyboard users continue from there.
  const focusFrom = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const loadMore = () => {
    focusFrom.current = window.matchMedia("(min-width: 1024px)").matches ? desktopVisible : mobileVisible;
    setPages((n) => n + 1);
  };
  useEffect(() => {
    if (focusFrom.current === null) return;
    const links = gridRef.current?.querySelectorAll<HTMLAnchorElement>(`[data-index="${focusFrom.current}"] a[href]`);
    focusFrom.current = null;
    Array.from(links ?? []).find((a) => a.offsetParent !== null)?.focus({ preventScroll: false });
  }, [pages]);

  const desktopVisible = Math.min(filtered.length, pages * config.pageSize.desktop);
  const mobileVisible = Math.min(filtered.length, pages * config.pageSize.mobile);
  const renderCount = Math.max(desktopVisible, mobileVisible);

  const tags: { key: FacetKey; label: string }[] = [];
  if (state.audience) tags.push({ key: "audience", label: config.audiences?.find((a) => a.key === state.audience)?.label ?? state.audience });
  if (state.edit) tags.push({ key: "edit", label: config.edits?.find((e) => e.key === state.edit)?.label ?? state.edit });
  if (state.type) tags.push({ key: "type", label: config.types.find((t) => t.key === state.type)?.label ?? state.type });
  if (state.colour) tags.push({ key: "colour", label: `Colour: ${state.colour}` });
  if (state.material) tags.push({ key: "material", label: `Material: ${state.material}` });
  if (state.price) tags.push({ key: "price", label: `Price: ${config.prices.find((p) => p.key === state.price)?.label}` });

  const blockShown = (b: CollectionBlock, visible: number, after: number) => visible >= after && (filtered.length > after || !!b.showAtEnd);

  function renderBlocksAt(index: number) {
    return blocks.flatMap((b) => {
      const atMobile = b.mobileAfter === index && blockShown(b, mobileVisible, b.mobileAfter);
      const atDesktop = b.desktopAfter === index && blockShown(b, desktopVisible, b.desktopAfter);
      if (!atMobile && !atDesktop) return [];
      const span = b.desktopSpan === "full" ? "col-span-2 desk:col-span-full" : "col-span-2 desk:col-span-2";
      return [
        <div key={`${b.key}-${index}`} className={`${span} ${visibilityClass(atMobile, atDesktop)} ${b.className ?? ""}`}>
          {b.node}
        </div>,
      ];
    });
  }

  return (
    <div className="flex w-full flex-col">
      {/* Filter row — Figma "Filter Row" (Women 71:89): categories left, Filters + Sort right */}
      <div className="flex w-full flex-col gap-4 desk:flex-row desk:items-center desk:justify-between desk:gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 desk:flex-wrap desk:gap-3 desk:overflow-visible desk:px-0" role="group" aria-label="Category">
          <FilterChip active={!state.type && !state.audience} onClick={() => update({ type: null, audience: null })}>
            {allLabel}
          </FilterChip>
          {/* Bags: "For Her" / "For Him" sit in the same row, before the type chips (86:459). */}
          {config.audiences?.map((a) => (
            <FilterChip key={a.key} active={state.audience === a.key} onClick={() => update({ audience: state.audience === a.key ? null : a.key })}>
              {a.label}
            </FilterChip>
          ))}
          {chipTypes.map((t) => (
            <FilterChip key={t.key} active={state.type === t.key} onClick={() => update({ type: state.type === t.key ? null : t.key })}>
              {t.label}
            </FilterChip>
          ))}
        </div>
        <div className={`${filtersButton ? "grid grid-cols-2" : "flex"} gap-2 px-4 desk:flex desk:shrink-0 desk:gap-3 desk:px-0`}>
          {filtersButton && (
            <FilterChip active={filtersOpen} aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={openFilters}>
              {facetCount > 0 ? `Filters (${facetCount})` : "Filters  +"}
            </FilterChip>
          )}
          <SortMenu options={config.sorts} value={state.sort} onChange={(key) => update({ sort: key as FilterState["sort"] })} />
        </div>
      </div>

      {/* Applied filters — Figma "Filters — Applied" (73:398) / mobile 92:3359 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-6 desk:px-0 desk:pt-5">
          {tags.map((t) => (
            <FilterTag key={t.key} label={t.label} onRemove={() => update({ [t.key]: null } as Partial<FilterState>)} />
          ))}
          <button type="button" onClick={clearAll} className="type-caption py-3 pl-2 text-ink underline underline-offset-2 hover:text-accent-deep">
            Clear all
          </button>
          <p className="type-caption ml-auto hidden text-ink-muted desk:block" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
      )}

      <div className={layout.top} aria-busy={loading}>
        {loading ? (
          <SkeletonGrid config={config} />
        ) : filtered.length === 0 ? (
          <NoResults empty={config.empty} summary={describeFilters(state, config)} hasFilters={facetCount > 0} onClear={clearAll} />
        ) : (
          <div ref={gridRef} className={layout.grid}>
            {filtered.slice(0, renderCount).map((p, i) => (
              <Fragment key={p.id}>
                {renderBlocksAt(i)}
                <div data-index={i} className={visibilityClass(i < mobileVisible, i < desktopVisible)}>
                  <div className="hidden desk:block">
                    <ProductCard product={p} size={layout.card} />
                  </div>
                  <div className="desk:hidden">
                    <ProductCard product={p} size="compact" />
                  </div>
                </div>
              </Fragment>
            ))}
            {renderBlocksAt(renderCount)}
          </div>
        )}
      </div>

      {/* Figma "Load More" (New Arrival 103:153, Women 71:280 / 72:411) — hides once everything is shown. */}
      {!loading && filtered.length > 0 && (
        <div className={`w-full px-4 desk:px-0 ${layout.loadMore}`}>
          {(
            [
              ["flex desk:hidden", mobileVisible, 200],
              ["hidden desk:flex", desktopVisible, 240],
            ] as const
          ).map(([display, visible, barWidth]) => (
            <div key={display} className={`w-full flex-col items-center ${display} ${layout.loadMoreGap}`}>
              <p className="type-caption text-ink-muted" aria-live="polite">
                You’ve viewed {visible} of {filtered.length} pieces
              </p>
              <div className="h-0.5 overflow-hidden rounded-full bg-line" style={{ width: barWidth }} aria-hidden="true">
                <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${(visible / filtered.length) * 100}%` }} />
              </div>
              {visible < filtered.length && (
                <Button variant="secondary" showArrow={false} className={layout.loadMoreButton} onClick={loadMore}>
                  {layout.loadMoreLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <FiltersOverlay
        open={filtersOpen}
        onClose={closeFilters}
        draft={draft}
        onDraftChange={setDraft}
        onApply={() => {
          commit(draft);
          setFiltersOpen(false);
        }}
        types={chipTypes}
        colours={colours}
        materials={materials}
        prices={config.prices}
        resultCount={draftCount}
      />
    </div>
  );
}

/** Figma "Grid — Loading" (20:383): one skeleton row on desktop, two on mobile. */
function SkeletonGrid({ config }: { config: CollectionConfig }) {
  const layout = LAYOUT[config.grid];
  return (
    <div className={layout.grid} aria-hidden="true">
      {Array.from({ length: Math.max(layout.skeletons, 4) }).map((_, i) => (
        <div key={i} className={visibilityClass(i < 4, i < layout.skeletons)}>
          <div className="hidden desk:block">
            <ProductCardSkeleton size={layout.card} />
          </div>
          <div className="desk:hidden">
            <ProductCardSkeleton size="compact" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Suspense fallback while search params resolve (static prerender) — the loading skeleton. */
export function ProductCollectionFallback({ config }: { config: CollectionConfig }) {
  return (
    <div className={LAYOUT[config.grid].top}>
      <SkeletonGrid config={config} />
    </div>
  );
}
