"use client";

import Link from "next/link";
import { useRef } from "react";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { BackIcon } from "@/components/ui/Icons";
import type { GalleryShot } from "@/lib/products";
import { GalleryImage } from "./ProductGallery";

/** Figma "Gallery / Swipe" (Product Detail Mobile 32:172, node 32:193). */
export function ProductGalleryMobile({
  gallery,
  productName,
  productId,
  index,
  onSelect,
  backHref,
  backLabel,
}: {
  gallery: GalleryShot[];
  productName: string;
  productId: string;
  index: number;
  onSelect: (i: number) => void;
  backHref: string;
  backLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) onSelect(i);
  }

  return (
    <div className="relative h-[336px] w-full overflow-hidden desk:hidden">
      <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[14%] top-[15%] h-[78%] w-[80%] rounded-[50%] bg-blob" />
      {/* Focusable so keyboard users can scroll the strip with the arrow keys. */}
      <div ref={scrollRef} onScroll={handleScroll} tabIndex={0} role="region" aria-label={`${productName} gallery`} className="relative z-10 flex size-full snap-x snap-mandatory overflow-x-auto">
        {gallery.map((shot, i) => (
          <div key={shot.caption} className="relative size-full shrink-0 snap-center">
            <GalleryImage shot={shot} alt={`${productName} — ${shot.caption}`} sizes="390px" priority={i === 0} />
          </div>
        ))}
      </div>
      <Link href={backHref} className="absolute left-4 top-2 flex h-11 items-center gap-2 text-ink-muted">
        <BackIcon size={16} />
        <span className="type-caption">{backLabel}</span>
      </Link>
      <WishlistButton productId={productId} size={44} className="absolute right-4 top-2 z-20" />
      {gallery.length > 1 && (
        <div className="absolute bottom-[11px] left-1/2 z-20 flex -translate-x-1/2 items-center">
          {gallery.map((shot, i) => (
            <button
              key={shot.caption}
              type="button"
              aria-label={`Go to ${shot.caption}`}
              aria-current={i === index}
              onClick={() => {
                onSelect(i);
                scrollRef.current?.scrollTo({ left: i * (scrollRef.current?.clientWidth ?? 0), behavior: "smooth" });
              }}
              // Figma's dot, centred in a transparent 24×24 tap target (WCAG 2.2 target size; launch decision).
              className={`flex h-6 items-center justify-center ${i === index ? "min-w-8" : "min-w-6"}`}
            >
              <span aria-hidden="true" className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-line"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
