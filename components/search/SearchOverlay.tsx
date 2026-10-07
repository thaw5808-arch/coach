"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon, CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { CutoutImage } from "@/components/ui/CutoutImage";
import { formatPrice } from "@/lib/format";
import {
  clearRecent,
  highlight,
  readRecent,
  saveRecent,
  searchProducts,
  spellingSuggestion,
  suggestCollections,
  suggestPhrases,
  type Segment,
} from "@/lib/search";
import { cardSubtitle } from "@/components/ui/ProductCard";
import { PopularChips, SearchDefaults, sectionLabel } from "./SearchDefaults";

/** Figma: "Suggestions start at three letters". */
const MIN_CHARS = 3;
const DEBOUNCE_MS = 150;
const MAX_PRODUCTS = 3;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const searchHref = (q: string) => `/search?q=${encodeURIComponent(q.trim())}`;

/** "tab" + "by shoulder bag": the typed part plain (muted), the completion bold — Figma 96:334. */
function Completion({ segments }: { segments: Segment[] }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-0.5">
      {segments.map((s, i) =>
        s.match ? (
          <span key={i} className="type-body whitespace-pre text-ink-muted">
            {s.text}
          </span>
        ) : (
          <span key={i} className="type-h4 whitespace-pre text-ink">
            {s.text}
          </span>
        ),
      )}
    </span>
  );
}

/** Product names keep the card's weight; the typed letters get an accent underline. */
function Marked({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.match ? (
          <mark key={i} className="bg-transparent text-inherit underline decoration-accent-deep decoration-[1.5px] underline-offset-[3px]">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

type Option = { id: string; href: string; query: string };

/**
 * Figma "Overlay — Open" (96:271), "Overlay — Suggestions" (96:320), "Mobile — Search Overlay" (96:371).
 * Desktop: a white panel under the header over a scrim. Mobile: a full-screen sheet with Cancel.
 * The input is an ARIA combobox; suggestions, products, collections and "See all" form one listbox.
 */
export function SearchOverlay({ open, onClose, returnFocus }: { open: boolean; onClose: () => void; returnFocus: RefObject<HTMLElement | null> }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  // Figma: "Search bags, collections, stores" on desktop (96:279), "Search Coach" on the narrow mobile field (96:380).
  const [placeholder, setPlaceholder] = useState("Search Coach");

  // Open: fresh field, recent searches, scroll lock, focus the input; close: restore focus to the icon.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebounced("");
    setActive(-1);
    setRecent(readRecent());
    setPlaceholder(window.matchMedia("(min-width: 1024px)").matches ? "Search bags, collections, stores" : "Search Coach");
    window.dispatchEvent(new Event("coach:search-open"));
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const target = returnFocus;
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      target.current?.focus({ preventScroll: true });
    };
  }, [open, returnFocus]);

  // A mega-menu opening closes search (they never stack).
  useEffect(() => {
    if (!open) return;
    window.addEventListener("coach:menu-open", onClose);
    return () => window.removeEventListener("coach:menu-open", onClose);
  }, [open, onClose]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const q = debounced.trim();
  const suggesting = q.length >= MIN_CHARS;
  const results = useMemo(() => (suggesting ? searchProducts(q) : []), [q, suggesting]);
  const phrases = useMemo(() => (suggesting ? suggestPhrases(q) : []), [q, suggesting]);
  const collections = useMemo(() => (suggesting ? suggestCollections(q) : []), [q, suggesting]);
  const spelling = useMemo(() => (suggesting && results.length === 0 ? spellingSuggestion(q) : null), [q, suggesting, results.length]);

  const options: Option[] = useMemo(() => {
    if (!suggesting) return [];
    const opts: Option[] = [
      ...phrases.map((p, i) => ({ id: `${listId}-p${i}`, href: searchHref(p), query: p })),
      ...results.slice(0, MAX_PRODUCTS).map((h) => ({ id: `${listId}-${h.product.id}`, href: `/products/${h.product.slug}`, query: q })),
      ...collections.map((c, i) => ({ id: `${listId}-c${i}`, href: c.href, query: q })),
    ];
    if (results.length) opts.push({ id: `${listId}-all`, href: searchHref(q), query: q });
    return opts;
  }, [suggesting, phrases, results, collections, listId, q]);

  useEffect(() => setActive(-1), [debounced]);

  const go = useCallback(
    (href: string, recentQuery: string) => {
      if (recentQuery.trim()) setRecent(saveRecent(recentQuery));
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  function submit() {
    const typed = query.trim();
    if (!typed) return;
    go(searchHref(typed), typed);
  }

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!options.length) return;
      e.preventDefault();
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % options.length : i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Enter before the debounce settles still searches what was typed.
      if (active >= 0 && options[active] && debounced === query) go(options[active].href, options[active].query);
      else submit();
    }
  }

  // Keep the highlighted option in view.
  useEffect(() => {
    if (active < 0) return;
    document.getElementById(options[active]?.id ?? "")?.scrollIntoView({ block: "nearest" });
  }, [active, options]);

  function onPanelKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
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

  if (!open) return null;

  const optIndex = (id: string) => options.findIndex((o) => o.id === id);
  const optionProps = (id: string) => {
    const i = optIndex(id);
    const o = options[i];
    return {
      id,
      role: "option" as const,
      "aria-selected": active === i,
      onMouseEnter: () => setActive(i),
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(), // keep focus in the input
      onClick: () => go(o.href, o.query),
    };
  };
  const activeBg = (id: string) => (active === optIndex(id) ? "bg-blob" : "");
  const showList = suggesting && options.length > 0;

  return (
    // Desktop: under the 80px header (it stays visible — hovering a menu opens it and closes this); mobile: full screen.
    <div className="fixed inset-0 z-[70] desk:top-20" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 hidden bg-ink/25 desk:block" onClick={onClose} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 desk:top-4 desk:mx-auto desk:max-w-[1440px] desk:px-[clamp(24px,6.667vw,96px)]">
        <div
          ref={panelRef}
          onKeyDown={onPanelKey}
          className="pointer-events-auto flex h-full flex-col gap-6 overflow-y-auto overscroll-contain bg-bg px-4 pb-8 pt-[calc(16px+env(safe-area-inset-top))] desk:h-auto desk:max-h-[calc(100vh-128px)] desk:gap-8 desk:rounded-[24px] desk:bg-surface desk:px-12 desk:pb-12 desk:pt-10 desk:shadow-[0_24px_64px_rgba(0,0,0,0.12)]"
        >
          {/* Field — Figma "Search Field" (desktop 68px, mobile 52px + Cancel) */}
          <form
            role="search"
            className="flex w-full items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="flex h-[52px] min-w-0 flex-1 items-center gap-4 rounded-[24px] border-[1.5px] border-accent-deep bg-surface px-4 desk:h-[68px] desk:rounded-[32px] desk:px-7">
              <SearchIcon size={38} className="shrink-0 text-ink" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder={placeholder}
                aria-label="Search COACH"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? options[active]?.id : undefined}
                className="type-body min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none desk:type-body-lg [&::-webkit-search-cancel-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (query) {
                    setQuery("");
                    inputRef.current?.focus();
                  } else onClose();
                }}
                aria-label={query ? "Clear search" : "Close search"}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink hover:bg-blob"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <button type="button" onClick={onClose} className="type-button shrink-0 py-2 text-ink desk:hidden">
              Cancel
            </button>
          </form>

          {!suggesting ? (
            <SearchDefaults
              recent={recent}
              chipTone="panel"
              onRecent={(r) => go(searchHref(r), r)}
              onClearRecent={() => {
                clearRecent();
                setRecent([]);
                inputRef.current?.focus();
              }}
              onNavigate={onClose}
            />
          ) : (
            <div className="flex w-full flex-col gap-5 desk:max-w-[720px]">
              <ul id={listId} role="listbox" aria-label="Search suggestions" className="flex w-full flex-col gap-5">
                {phrases.length > 0 && (
                  <li role="presentation">
                    <ul role="group" aria-label="Suggested searches" className="flex flex-col">
                      {phrases.map((p, i) => {
                        const id = `${listId}-p${i}`;
                        return (
                          <li key={id} {...optionProps(id)} className={`cursor-pointer rounded-[12px] px-1 py-3 ${activeBg(id)}`}>
                            <Completion segments={highlight(p, q)} />
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                )}
                {results.length > 0 && (
                  <li role="presentation">
                    <ul role="group" aria-label="Pieces" className="flex flex-col gap-2">
                      {results.slice(0, MAX_PRODUCTS).map(({ product }) => {
                        const id = `${listId}-${product.id}`;
                        return (
                          <li
                            key={id}
                            {...optionProps(id)}
                            className={`flex cursor-pointer items-center gap-4 rounded-[20px] p-4 ${active === optIndex(id) ? "bg-blob" : "bg-surface desk:bg-bg"}`}
                          >
                            <span className="relative block size-16 shrink-0 overflow-hidden rounded-[12px] bg-blob">
                              <span className="absolute inset-1">
                                <CutoutImage image={product.colours[0].image} sizes="64px" />
                              </span>
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="type-h4 text-ink">
                                <Marked segments={highlight(product.name, q)} />
                              </span>
                              <span className="type-caption truncate text-ink-muted">
                                {cardSubtitle(product)} · {formatPrice(product.price)}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                )}
                {collections.length > 0 && (
                  <li role="presentation" className="flex flex-col gap-2">
                    <p className={sectionLabel} aria-hidden="true">
                      COLLECTIONS
                    </p>
                    <ul role="group" aria-label="Collections" className="flex flex-col">
                      {collections.map((c, i) => {
                        const id = `${listId}-c${i}`;
                        return (
                          <li key={id} {...optionProps(id)} className={`flex cursor-pointer items-baseline justify-between gap-4 rounded-[12px] px-1 py-3 ${activeBg(id)}`}>
                            <span className="type-h4 text-ink">
                              <Marked segments={highlight(c.label, q)} />
                            </span>
                            <span className="type-caption text-ink-muted">{c.detail}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                )}
                {results.length > 0 && (
                  <li
                    {...optionProps(`${listId}-all`)}
                    className={`type-button flex w-fit cursor-pointer items-center gap-3 rounded-[12px] px-1 py-2 text-ink ${activeBg(`${listId}-all`)}`}
                  >
                    See all {results.length} {results.length === 1 ? "result" : "results"} for “{q}”
                    <ArrowIcon aria-hidden="true" />
                  </li>
                )}
              </ul>
              {results.length === 0 && (
                <div className="flex flex-col items-start gap-4" role="status">
                  <p className="type-body text-ink">
                    No pieces match “{q}”.
                    {spelling ? (
                      <>
                        {" "}
                        Did you mean{" "}
                        <button type="button" onClick={() => go(searchHref(spelling), spelling)} className="text-accent-deep underline underline-offset-2">
                          {spelling}
                        </button>
                        ?
                      </>
                    ) : (
                      " Try a broader word, or start from one of these."
                    )}
                  </p>
                  <PopularChips tone="panel" onNavigate={onClose} label="none" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
