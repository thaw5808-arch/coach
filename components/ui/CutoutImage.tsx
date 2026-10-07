import { SafeImage } from "@/components/ui/SafeImage";
import type { ProductImage } from "@/lib/products";

/**
 * `priority` = this is the LCP image: loaded eagerly at high fetch priority (Next 16 deprecates <Image priority>, and
 * a <head> preload would also fire for the CSS-hidden desktop / mobile twin).
 *
 * A product cut-out filling its (positioned) parent. With `crop`, the image is placed exactly as Figma's
 * image-fill crop (percent box, may overflow and is clipped); without, it's contain-fitted.
 */
export function CutoutImage({
  image,
  alt = "",
  sizes,
  className = "",
  priority,
  loading,
}: {
  image: ProductImage;
  alt?: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}) {
  const load = priority ? ({ loading: "eager", fetchPriority: "high" } as const) : { loading };
  if (!image.crop) {
    return <SafeImage src={image.src} alt={alt} fill sizes={sizes} className={`object-contain ${className}`} {...load} />;
  }
  const { left, top, width, height } = image.crop;
  return (
    <div className="relative size-full overflow-hidden">
      <div className="absolute" style={{ left, top, width, height }}>
        <SafeImage src={image.src} alt={alt} fill sizes={sizes} className={`object-cover ${className}`} {...load} />
      </div>
    </div>
  );
}
