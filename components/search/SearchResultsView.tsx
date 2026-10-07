"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCollection } from "@/components/collection/ProductCollection";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import Link from "@/components/ui/SiteLink";
import { applyFilters, parseFilters } from "@/lib/collection";
import { NO_RESULT_ROUTES, SEARCH_COLLECTION, clearRecent, readRecent, saveRecent, searchProducts, spellingSuggestion } from "@/lib/search";
import { PopularChips, SearchDefaults } from "./SearchDefaults";
import { searchHref } from "./SearchOverlay";

const shell = "mx-auto w-full max-w-[1440px] px-4 desk:px-[clamp(24px,6.667vw,96px)]";

/** Figma "Search / Query" (95:1243 / mobile 95:1349): the query in a 68px field (52px mobile) + Popular chips. */
function QueryField({ initial, autoFocus }: { initial: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setValue(initial), [initial]);
  const [placeholder, setPlaceholder] = useState("Search Coach");
  useEffect(() => setPlaceholder(window.matchMedia("(min-width: 1024px)").matches ? "Search bags, collections, stores" : "Search Coach"), []);

  return (
    <form
      role="search"
      className="flex h-[52px] w-full items-center gap-4 rounded-[24px] border border-line bg-surface px-4 focus-within:border-[1.5px] focus-within:border-accent-deep desk:h-[68px] desk:rounded-[32px] desk:px-7"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (!q) return inputRef.current?.focus();
        saveRecent(q);
        router.push(searchHref(q));
      }}
    >
      <SearchIcon size={38} className="shrink-0 text-ink" aria-hidden="true" />
      <input
        ref={inputRef}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search COACH"
        className="type-body min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none desk:type-body-lg [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink hover:bg-blob"
        >
          <CloseIcon size={20} />
        </button>
      )}
    </form>
  );
}

/** Figma "Results — None" (96:353): the query echoed, spelling help, popular routes, Client Care. */
function NoResults({ q }: { q: string }) {
  const spelling = useMemo(() => spellingSuggestion(q), [q]);
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[24px] bg-surface px-6 py-10 text-center desk:mx-auto desk:max-w-[552px] desk:px-10 desk:py-12" role="status">
      <p className="type-badge text-accent-deep">NO PIECES FOUND</p>
      <h1 className="type-h1-mobile break-words text-ink desk:type-h1">Nothing for “{q}”</h1>
      <p className="type-body text-ink-muted">
        {spelling ? (
          <>
            Did you mean{" "}
            <Link href={searchHref(spelling)} className="text-accent-deep underline underline-offset-2">
              {spelling}
            </Link>
            ? Or try a broader word, or start from one of these.
          </>
        ) : (
          "Check the spelling, try a broader word, or start from one of these."
        )}
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {NO_RESULT_ROUTES.map((r) => (
          <li key={r.label}>
            <Link href={r.href} className="type-chip flex h-[42px] items-center rounded-pill bg-bg px-6 text-ink hover:bg-blob">
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
      <Button href="/client-care#contact" variant="text">
        Ask Client Care
      </Button>
    </div>
  );
}

/** /search?q= — Figma "Search — Desktop 1440" (95:939) / "Mobile 390" (95:1040) + States (96:270). */
export function SearchResultsView() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const hits = useMemo(() => searchProducts(q), [q]);
  const items = useMemo(() => hits.map((h) => h.product), [hits]);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();

  // Every results page visit counts as a recent search (also covers popular chips and shared links).
  useEffect(() => {
    setRecent(q ? saveRecent(q) : readRecent());
  }, [q]);

  // The count follows the For Her / For Him chips (same state the grid reads from the URL).
  const filteredCount = useMemo(() => applyFilters(items, parseFilters(new URLSearchParams(params.toString()), SEARCH_COLLECTION, items), SEARCH_COLLECTION).length, [items, params]);

  return (
    <div className="relative">
      <div className={`${shell} relative`}>
        <Blob className="-top-[142px] right-[-90px] h-[199px] w-[220px] desk:-top-[190px] desk:right-[-254px] desk:h-[359px] desk:w-[397px]" />
        <div className="relative z-10 flex flex-col gap-4 pt-6 desk:gap-6 desk:pt-12">
          {!q && <h1 className="sr-only">Search</h1>}
          <QueryField initial={q} autoFocus={!q} />
          {q && (
            <PopularChips tone="surface" label="inline" />
          )}
        </div>
      </div>

      {!q ? (
        // No query: the overlay's designed default content, in page (Figma 96:274).
        <div className={`${shell} pb-16 pt-8 desk:pb-32 desk:pt-12`}>
          <div className="rounded-[24px] desk:bg-surface desk:px-12 desk:py-10">
            <SearchDefaults
              recent={recent}
              chipTone="panel"
              onRecent={(r) => router.push(searchHref(r))}
              onClearRecent={() => {
                clearRecent();
                setRecent([]);
              }}
            />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className={`${shell} pb-16 pt-12 desk:pb-32 desk:pt-24`}>
          <NoResults q={q} />
        </div>
      ) : (
        <>
          {/* Figma "Search / Results Header" (95:1262) */}
          <div className={`${shell} pt-12 desk:pt-24`}>
            <div className="flex items-end justify-between gap-4 pb-4 desk:pb-6">
              <div className="flex min-w-0 flex-col gap-2">
                <p className="type-eyebrow text-accent-deep">SEARCH RESULTS</p>
                <h1 className="type-h1-mobile break-words text-ink desk:type-h1">“{q}”</h1>
              </div>
              <p className="type-caption shrink-0 pb-1 text-ink-muted" aria-live="polite">
                {filteredCount} {filteredCount === 1 ? "piece" : "pieces"}
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[1440px] pb-16 desk:px-[clamp(24px,6.667vw,96px)] desk:pb-32">
            <ProductCollection key={q} items={items} config={SEARCH_COLLECTION} filtersButton={false} />
          </div>
        </>
      )}
    </div>
  );
}
