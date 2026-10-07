import { Button } from "@/components/ui/Button";
import { CutoutStage } from "./CutoutStage";
import type { EditorialBlockConfig } from "@/lib/categories";

type Feature = Extract<EditorialBlockConfig, { kind: "feature" }>;
type Promo = Extract<EditorialBlockConfig, { kind: "promo" }>;

/** Figma "Editorial / The Quilted Tabby" — 2-column grid tile on desktop (71:185), stacked card on mobile (72:362). */
export function EditorialFeature({ block }: { block: Feature }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-pill bg-surface desk:flex-row desk:items-center">
      <CutoutStage stage={block.stage.mobile} className="w-full shrink-0 desk:hidden" />
      {/* Image column is 300 of 608 (49.34%) in Figma. */}
      <CutoutStage stage={block.stage.desktop} className="hidden w-[49.34%] shrink-0 desk:block" />
      <div className="flex flex-col items-start gap-2.5 px-6 pb-6 desk:flex-1 desk:gap-4 desk:py-10 desk:pl-2 desk:pr-10">
        <p className="type-eyebrow text-accent-deep">{block.eyebrow}</p>
        <h3 className="type-h3 text-ink">{block.title}</h3>
        <p className="type-body text-ink-muted">
          <span className="desk:hidden">{block.body.mobile}</span>
          <span className="hidden desk:inline">{block.body.desktop}</span>
        </p>
        <Button href={block.cta.href} variant="text">
          {block.cta.label}
        </Button>
      </div>
    </article>
  );
}

/** Figma "Promo / Make It Yours" — blob-tinted panel (desktop 71:270, mobile 72:403). */
export function PromoPanel({ block }: { block: Promo }) {
  return (
    <aside className="flex h-full flex-col items-start justify-center gap-3 rounded-pill bg-blob px-6 py-8 desk:gap-4 desk:p-12">
      {block.hangtag && (
        // Figma 71:271 — literal #111 tag with #d4b26a foil initials (not tokens).
        <span aria-hidden="true" className="hidden h-[68px] w-12 items-center justify-center rounded-[10px] bg-[#111] desk:flex">
          <span className="font-display text-[11px] font-bold tracking-[0.14em] text-[#d4b26a]">{block.hangtag}</span>
        </span>
      )}
      <p className="type-eyebrow text-accent-deep">{block.eyebrow}</p>
      <h3 className="type-h1-mobile text-ink desk:type-h1">{block.title}</h3>
      <p className="type-body max-w-[400px] text-ink-muted">
        <span className="desk:hidden">{block.body.mobile}</span>
        <span className="hidden desk:inline">{block.body.desktop}</span>
      </p>
      <Button href={block.cta.href} variant="secondary" showArrow={false}>
        <span className="desk:hidden">{block.cta.label.mobile}</span>
        <span className="hidden desk:inline">{block.cta.label.desktop}</span>
      </Button>
    </aside>
  );
}
