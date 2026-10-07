import { Suspense } from "react";
import { ProductCollection, ProductCollectionFallback } from "@/components/collection/ProductCollection";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import type { CollectionConfig } from "@/lib/collection";
import { products } from "@/lib/products";
import { formatPrice } from "@/lib/format";

/** The Blush Edit = every piece offered in a blush, petal or pink colour; count and "From" price follow the catalogue. */
const BLUSH_EDIT = products.filter((p) => p.colours.some((c) => /^(blush|petal|pink)$/i.test(c.name)));
const BLUSH_FROM = Math.min(...BLUSH_EDIT.map((p) => p.price));

function BlushEditPanel() {
  return (
    <div className="w-full rounded-pill bg-surface desk:overflow-hidden">
      <div className="flex flex-col desk:flex-row">
        <div className="relative h-[280px] w-full shrink-0 overflow-hidden desk:h-[560px] desk:w-[624px]">
          <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[18%] top-[14%] h-[70%] w-[70%] rounded-[50%] bg-blob" />
          <div className="absolute left-[9%] top-[14%] size-[65%] -rotate-10">
            <SafeImage src="/images/home/bag-signature-pink.png" alt="" fill sizes="300px" className="object-contain" />
          </div>
          <div className="absolute left-[38%] top-[18%] size-[72%] rotate-14">
            <SafeImage src="/images/home/bag-bow-pink.png" alt="" fill sizes="330px" className="object-contain" />
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 px-4 pb-8 pt-2 desk:flex-1 desk:justify-center desk:gap-6 desk:px-24 desk:pl-12 desk:py-16">
          <p className="type-eyebrow text-accent-deep">THE EDIT — N° 01</p>
          <p className="type-h1-mobile text-ink desk:type-h1">The Blush Edit</p>
          <p className="type-body text-ink-muted desk:type-body-lg desk:w-[420px]">
            Soft signature canvas and petal leather, finished with gold-tone hardware. A palette made for long afternoons — and
            every chapter after.
          </p>
          <div className="type-caption hidden gap-8 text-ink desk:flex">
            <span>{BLUSH_EDIT.length} pieces</span>
            <span>From {formatPrice(BLUSH_FROM)}</span>
            <span>Gold-tone hardware</span>
          </div>
          <p className="type-caption text-ink desk:hidden">{BLUSH_EDIT.length} pieces&nbsp;&nbsp;·&nbsp;&nbsp;From {formatPrice(BLUSH_FROM)}</p>
          <Button href="/bags" className="w-full desk:w-auto">
            Shop the edit
          </Button>
        </div>
      </div>
    </div>
  );
}

/** New Arrival collection — shared ProductCollection with the Figma 103:88 / 20:313 facets and sorts. */
const newArrivalCollection: CollectionConfig = {
  types: [
    { key: "shoulder-bags", label: "Shoulder Bags" },
    { key: "crossbody", label: "Crossbody" },
    { key: "mini-bags", label: "Mini Bags" },
    { key: "chain-straps", label: "Chain Straps" },
  ],
  // Figma drawer (20:313) lists "Oat"; the Cargo Tote's card in the same file is "Natural" — Natural is used so the swatch matches a product.
  colours: [
    { name: "Black", hex: "#111111" },
    { name: "Blush", hex: "#f2b8c6" },
    { name: "Petal", hex: "#e8a3b2" },
    { name: "Natural", hex: "#d9c7ae" },
  ],
  materials: ["Pebble Leather", "Signature Canvas", "Glove-tanned Leather"],
  prices: [
    { key: "under-250", label: "Under $250", max: 249.99 },
    { key: "250-300", label: "$250 – $300", min: 250, max: 300 },
    { key: "300-plus", label: "$300+", min: 300.01 },
  ],
  sorts: [
    { key: "newest", label: "Sort: Newest" },
    { key: "featured", label: "Sort: Featured" },
    { key: "price-asc", label: "Sort: Price, Low to High" },
    { key: "price-desc", label: "Sort: Price, High to Low" },
  ],
  defaultSort: "newest",
  /** Figma "Load More" (103:153) shows an initial 6-piece page. */
  pageSize: { desktop: 6, mobile: 6 },
  grid: "three-large",
  empty: {
    title: "This chapter hasn’t been written yet.",
    body: "Nothing matches {summary}. Try removing a filter, or browse every new arrival.",
    summary: "list",
    fallbackBody: "Nothing matches this filter yet. Try browsing every new arrival instead.",
    style: "plain",
    secondary: { kind: "link", label: "View all new arrivals", href: "/new-arrivals" },
  },
};

const blocks = [
  // Desktop: full-width editorial break after row 1 (128px either side = 48 grid gap + 80). Mobile: after the first 4.
  { key: "blush-edit", node: <BlushEditPanel />, desktopAfter: 3, mobileAfter: 4, desktopSpan: "full" as const, className: "py-8 desk:py-20" },
];

export function CollectionSection() {
  return (
    <Suspense fallback={<ProductCollectionFallback config={newArrivalCollection} />}>
      <ProductCollection items={products} config={newArrivalCollection} blocks={blocks} />
    </Suspense>
  );
}
