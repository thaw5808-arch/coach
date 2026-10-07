"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/lib/products";

/** Figma "Complete the Chapter" (Product Detail 29:2/32:172, Shopping Bag 43:3/44:215). */
export function RelatedProducts({
  items,
  title = "Worn Well Together",
  viewAllHref,
  viewAllLabel,
}: {
  items: Product[];
  title?: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const [start, setStart] = useState(0);
  const windowSize = 3;
  const canPrev = start > 0;
  const canNext = start + windowSize < items.length;

  if (items.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-start gap-6 px-4 py-16 desk:gap-12 desk:px-0 desk:py-32">
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col items-start gap-2 desk:gap-3">
          <p className="type-eyebrow text-accent-deep">COMPLETE THE CHAPTER</p>
          <h2 className="type-h1-mobile text-ink desk:type-h1">{title}</h2>
        </div>
        <div className="hidden items-center gap-3 desk:flex">
          <Button href={viewAllHref} variant="text" showArrow={false}>
            {viewAllLabel}
          </Button>
          <IconButton icon="prev" label="Previous" disabled={!canPrev} onClick={() => setStart((s) => Math.max(0, s - windowSize))} />
          <IconButton icon="next" label="Next" disabled={!canNext} onClick={() => setStart((s) => Math.min(items.length - 1, s + windowSize))} />
        </div>
      </div>

      <div className="hidden w-full gap-12 desk:grid desk:grid-cols-3">
        {items.slice(start, start + windowSize).map((p) => (
          <ProductCard key={p.id} product={p} size="large" />
        ))}
      </div>

      <div className="grid w-full grid-cols-2 gap-4 desk:hidden">
        {items.slice(0, 2).map((p) => (
          <ProductCard key={p.id} product={p} size="compact" />
        ))}
      </div>

      <Button href={viewAllHref} variant="secondary" showArrow={false} className="w-full desk:hidden">
        {viewAllLabel}
      </Button>
    </div>
  );
}
