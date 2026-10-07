import { GalleryThumbnail } from "@/components/ui/GalleryThumbnail";
import { IconButton } from "@/components/ui/IconButton";
import { Overlay } from "@/components/ui/Overlay";
import type { GalleryShot } from "@/lib/products";
import { GalleryImage } from "./ProductGallery";

/** Figma "State / Gallery — Zoom" (Product Detail States 35:255, node 35:397). */
export function GalleryLightbox({
  open,
  onClose,
  gallery,
  productName,
  index,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  gallery: GalleryShot[];
  productName: string;
  index: number;
  onSelect: (i: number) => void;
}) {
  const active = gallery[index];
  const canPrev = index > 0;
  const canNext = index < gallery.length - 1;

  return (
    <Overlay open={open} onClose={onClose} shape="center" label={`${productName} gallery`}>
      <div className="relative h-[70vh] w-[90vw] max-w-[1080px] overflow-hidden rounded-pill">
        <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[24%] top-[11%] h-[70%] w-[52%] rounded-[50%] bg-blob" />
        <GalleryImage shot={active} alt={`${productName} — ${active.caption}`} sizes="90vw" priority />
        <IconButton icon="close" label="Close" onClick={onClose} className="absolute right-6 top-6 bg-bg" />
        <IconButton
          icon="prev"
          label="Previous image"
          disabled={!canPrev}
          onClick={() => onSelect(index - 1)}
          className="absolute left-6 top-1/2 -translate-y-1/2 bg-bg"
        />
        <IconButton
          icon="next"
          label="Next image"
          disabled={!canNext}
          onClick={() => onSelect(index + 1)}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-bg"
        />
        <p className="type-eyebrow absolute left-6 top-6 text-ink">
          {String(index + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
        </p>
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
          {gallery.map((shot, i) => (
            <GalleryThumbnail key={shot.caption} size={64} selected={i === index} onClick={() => onSelect(i)} label={shot.caption}>
              <GalleryImage shot={shot} alt="" sizes="64px" />
            </GalleryThumbnail>
          ))}
        </div>
      </div>
    </Overlay>
  );
}
