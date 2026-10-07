"use client";

import Link from "@/components/ui/SiteLink";
import { CutoutImage } from "@/components/ui/CutoutImage";
import { formatPrice } from "@/lib/format";
import { getProductById, type Product } from "@/lib/products";
import { POPULAR, TRENDING_IDS } from "@/lib/search";

const TRENDING = TRENDING_IDS.map((id) => getProductById(id)).filter((p): p is Product => !!p);

export const sectionLabel = "type-badge text-ink-muted";

/** Chip fill: page tint on white surfaces, white on the page tint. "panel" = the overlay (white desktop panel, tinted mobile sheet). */
export type ChipTone = "bg" | "surface" | "panel";
const CHIP_FILL: Record<ChipTone, string> = { bg: "bg-bg", surface: "bg-surface", panel: "bg-surface desk:bg-bg" };

/** Figma "Popular" chips (96:291 / mobile 96:394 / results page 95:1252). */
export function PopularChips({ tone, onNavigate, label = "above" }: { tone: ChipTone; onNavigate?: () => void; label?: "above" | "inline" | "none" }) {
  return (
    <div className="flex flex-col gap-3.5">
      {label === "above" && <p className={sectionLabel}>POPULAR</p>}
      {/* "inline" = the results page row (95:1252): the label flows with the chips and wraps like one of them. */}
      <ul className="flex flex-wrap items-center gap-2" aria-label={label === "inline" ? "Popular searches" : undefined}>
        {label === "inline" && (
          <li aria-hidden="true" className={`${sectionLabel} mr-2`}>
            POPULAR
          </li>
        )}
        {POPULAR.map((p) => (
          <li key={p.label}>
            <Link
              href={p.href}
              onClick={onNavigate}
              className={`type-chip flex h-[42px] items-center rounded-pill px-6 text-ink transition-colors hover:bg-blob ${CHIP_FILL[tone]}`}
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Figma "Overlay — Open" (96:274) columns: Recent · Popular · Trending now. Mobile (96:374) stacks them and shows
 * two trending pieces without prices.
 */
export function SearchDefaults({
  recent,
  onRecent,
  onClearRecent,
  onNavigate,
  chipTone,
}: {
  recent: string[];
  onRecent: (q: string) => void;
  onClearRecent: () => void;
  onNavigate?: () => void;
  chipTone: ChipTone;
}) {
  return (
    <div className="flex w-full flex-col gap-6 desk:flex-row desk:gap-16">
      {recent.length > 0 && (
        <div className="flex flex-col gap-3.5 desk:w-[240px] desk:shrink-0">
          <div className="flex items-center justify-between">
            <p className={sectionLabel}>RECENT</p>
            <button type="button" onClick={onClearRecent} className="type-caption text-accent-deep hover:underline focus-visible:underline focus-visible:outline-none">
              Clear<span className="sr-only"> recent searches</span>
            </button>
          </div>
          <ul className="flex flex-col gap-3.5">
            {recent.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => onRecent(q)} className="type-body text-left text-ink hover:text-accent-deep">
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="desk:w-[300px] desk:shrink-0">
        <PopularChips tone={chipTone} onNavigate={onNavigate} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <p className={sectionLabel}>TRENDING NOW</p>
        <ul className="grid grid-cols-2 gap-3 desk:grid-cols-3 desk:gap-4">
          {TRENDING.map((p, i) => (
            <li key={p.id} className={i > 1 ? "hidden desk:block" : ""}>
              <Link href={`/products/${p.slug}`} onClick={onNavigate} className="group flex flex-col gap-2">
                <span className="relative block h-40 overflow-hidden rounded-[20px] bg-blob desk:h-[120px]">
                  <span className="absolute inset-1 transition-transform duration-300 group-hover:scale-[1.04]">
                    <CutoutImage image={p.colours[0].image} sizes="(min-width: 1024px) 140px, 45vw" />
                  </span>
                </span>
                <span className="type-h4 text-ink">{p.name}</span>
                <span className="type-price-sm hidden text-ink-muted desk:block">{formatPrice(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
