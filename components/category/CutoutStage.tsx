import { CutoutImage } from "@/components/ui/CutoutImage";
import type { Stage } from "@/lib/categories";

const pct = (value: number, of: number) => `${(value / of) * 100}%`;

/**
 * Cut-outs floating on a blob — Figma "Hero / Stage" and editorial "Image" frames.
 * Positions are Figma px converted to % so the stage scales with its container.
 */
export function CutoutStage({ stage, className = "", eager = false }: { stage: Stage; className?: string; eager?: boolean }) {
  const { width: w, height: h, blob } = stage;
  // The largest cut-out of an above-the-fold stage is its LCP candidate.
  const largest = Math.max(...stage.images.map((i) => i.size));
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-[50%] bg-blob"
        style={{ left: pct(blob.x, w), top: pct(blob.y, h), width: pct(blob.w, w), height: pct(blob.h, h) }}
      />
      {stage.images.map((img) => (
        <div
          key={img.src}
          className="absolute"
          style={{
            left: pct(img.x, w),
            top: pct(img.y, h),
            width: pct(img.size, w),
            height: pct(img.size, h),
            transform: img.rotate ? `rotate(${img.rotate}deg)` : undefined,
          }}
        >
          <CutoutImage image={img} alt={img.alt} sizes={`(min-width: 1024px) ${img.size}px, ${Math.round((img.size / w) * 100)}vw`} loading={eager ? "eager" : undefined} priority={eager && img.size === largest} />
        </div>
      ))}
    </div>
  );
}
