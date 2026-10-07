"use client";

import { useState } from "react";
import { GalleryThumbnail } from "@/components/ui/GalleryThumbnail";
import { IconButton } from "@/components/ui/IconButton";
import { CutoutImage } from "@/components/ui/CutoutImage";
import { shareProduct } from "@/lib/share";
import type { GalleryShot } from "@/lib/products";

function GalleryImage({ shot, alt, sizes, priority }: { shot: GalleryShot; alt: string; sizes: string; priority?: boolean }) {
  return <CutoutImage image={shot.image} alt={alt} sizes={sizes} priority={priority} />;
}

/** Figma "Gallery" (Product Detail Desktop 29:2, node 29:38) — thumbnail rail + main image. */
export function ProductGallery({
  gallery,
  productName,
  index,
  onSelect,
  onZoom,
}: {
  gallery: GalleryShot[];
  productName: string;
  index: number;
  onSelect: (i: number) => void;
  onZoom: () => void;
}) {
  const active = gallery[index];
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function handleShare() {
    const result = await shareProduct(productName, `${productName} — COACH`);
    if (result === "copied") setShareMessage("Link copied");
    else if (result === "failed") setShareMessage("Couldn’t share — copy the link from your browser");
    if (result !== "shared") setTimeout(() => setShareMessage(null), 2500);
  }

  return (
    <div className="hidden gap-6 desk:flex">
      <div className="flex flex-col items-start gap-4">
        {gallery.map((shot, i) => (
          <GalleryThumbnail key={shot.caption} selected={i === index} onClick={() => onSelect(i)} label={shot.caption}>
            <GalleryImage shot={shot} alt="" sizes="88px" />
          </GalleryThumbnail>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="relative h-[680px] w-[584px] overflow-hidden rounded-pill bg-surface">
          <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[7%] top-[16.8%] h-[66.5%] w-[85.6%] rounded-[50%] bg-blob" />
          <button type="button" onClick={onZoom} className="absolute inset-0" aria-label={`Zoom ${productName}`}>
            <GalleryImage shot={active} alt={`${productName} — ${active.caption}`} sizes="584px" priority />
          </button>
          <div className="absolute right-6 top-6 flex flex-col gap-3">
            <IconButton icon="zoom" label="Zoom image" onClick={onZoom} className="bg-bg" />
            <IconButton icon="share" label="Share this product" onClick={handleShare} className="bg-bg" />
          </div>
          {shareMessage && (
            <p role="status" className="type-caption absolute right-6 top-[108px] rounded-pill bg-bg px-3 py-1.5 text-ink">
              {shareMessage}
            </p>
          )}
          <p className="type-eyebrow absolute bottom-6 left-6 text-ink-muted">{active.caption}</p>
        </div>
      </div>
    </div>
  );
}

export { GalleryImage };
