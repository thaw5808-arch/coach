import Link from "next/link";
import { CutoutImage } from "@/components/ui/CutoutImage";
import { FitBadge } from "@/components/ui/FitBadge";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { formatPrice, type Product } from "@/lib/products";

type Size = "large" | "medium" | "compact";

const SIZE = {
  large: {
    aspect: "aspect-[384/420]",
    blobInset: "inset-x-[8.85%] top-[19.8%] bottom-[12.18%]",
    imageInset: "inset-x-[5.73%] top-[11.43%] bottom-[7.62%]",
    // Badge: left/top from Figma; reserve = heart inset + width + 8px gap; stacked = just under the heart.
    badgeInset: 16,
    badgeTop: 22,
    badgeReserve: 16 + 40 + 8,
    badgeStackedTop: 64,
    wishlistPos: "right-4 top-4",
    wishlistSize: 40,
    gap: "gap-5",
    titleClass: "type-h3",
    priceClass: "type-price",
    sizes: "(min-width: 1024px) 384px, 90vw",
    hoverBlob: "",
    hoverImage: "",
    quickViewPos: "bottom-6",
  },
  medium: {
    aspect: "aspect-[288/316]",
    blobInset: "inset-x-[9.03%] top-[20.04%] bottom-[12.45%]",
    imageInset: "inset-x-[5.56%] top-[11.39%] bottom-[7.59%]",
    badgeInset: 12,
    badgeTop: 18,
    badgeReserve: 12 + 40 + 8,
    badgeStackedTop: 58,
    wishlistPos: "right-3 top-3",
    wishlistSize: 40,
    gap: "gap-4",
    titleClass: "type-h4",
    priceClass: "type-price-sm",
    sizes: "(min-width: 1024px) 288px, 70vw",
    // Figma "Product Card — Hover (Medium)" (Women 73:436): blob deepens (#e1eaff, not a token), product lifts —
    // image inset 11.39%/5.56% → 7.28%/3.13% ≈ scale 1.055 and 6px up. Tailwind's hover variants only apply on
    // (hover: hover) devices, so touch screens never get a hover-only state.
    hoverBlob: "transition-colors duration-200 group-hover:bg-[#e1eaff]",
    hoverImage: "transition-transform duration-300 ease-out group-hover:-translate-y-[6px] group-hover:scale-[1.055]",
    quickViewPos: "bottom-3",
  },
  compact: {
    aspect: "aspect-[171/200]",
    blobInset: "inset-x-[9.06%] top-[22.36%] bottom-[14.36%]",
    imageInset: "inset-x-[6.14%] top-[14.5%] bottom-[10.5%]",
    badgeInset: 8,
    badgeTop: 15.5,
    badgeReserve: 8 + 36 + 6,
    badgeStackedTop: 50,
    wishlistPos: "right-2 top-2",
    wishlistSize: 36,
    gap: "gap-3",
    titleClass: "type-h4",
    priceClass: "type-price-sm",
    sizes: "45vw",
    hoverBlob: "",
    hoverImage: "",
    quickViewPos: "",
  },
} satisfies Record<Size, Record<string, string | number>>;

/** First 3 colours; the shown colour gets the ink ring (Figma "Swatches" in Product Card 13:146). */
function Swatches({ colours }: { colours: Product["colours"] }) {
  const shown = colours.slice(0, 3);
  return (
    <span className="flex h-6 items-center gap-1.5" role="img" aria-label={`Available in ${colours.map((c) => c.name).join(", ")}`}>
      {shown.map((c, i) =>
        i === 0 ? (
          <span key={c.name} aria-hidden="true" className="flex size-[21px] items-center justify-center rounded-full border-2 border-ink bg-surface">
            <span className="size-[13px] rounded-full" style={{ backgroundColor: c.hex }} />
          </span>
        ) : (
          <span
            key={c.name}
            aria-hidden="true"
            className="size-3 rounded-full ring-1 ring-line"
            style={{ backgroundColor: c.hex, opacity: c.available ? 1 : 0.4 }}
          />
        ),
      )}
    </span>
  );
}

/** "Natural · Heavy Canvas" (desktop) / "Natural · Canvas" (mobile compact card). */
export function cardSubtitle(product: Product, compact = false) {
  const detail = product.cardDetail ?? { full: product.material };
  return `${product.colours[0].name} · ${compact ? (detail.compact ?? detail.full) : detail.full}`;
}

/** Figma "Product Card" (13:146) — Large / Medium / Compact, with hover Quick View on Large/Medium. */
export function ProductCard({ product, size = "large", className = "" }: { product: Product; size?: Size; className?: string }) {
  const cfg = SIZE[size];
  const colour = product.colours[0];
  const showSwatches = size !== "compact";
  const badge = product.badge;

  return (
    <div className={`group relative flex flex-col items-start ${cfg.gap} ${className}`}>
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
      <div className={`relative w-full overflow-hidden ${cfg.aspect}`}>
        <span aria-hidden="true" className={`absolute rounded-[50%] bg-blob ${cfg.blobInset} ${cfg.hoverBlob}`} />
        <div className={`absolute ${cfg.imageInset} ${cfg.hoverImage}`}>
          <CutoutImage image={colour.image} sizes={cfg.sizes} className="pointer-events-none" />
        </div>
        {badge && (
          <FitBadge
            full={badge.full}
            compact={badge.compact}
            variant={size === "compact" ? "compact" : "roomy"}
            inset={cfg.badgeInset as number}
            top={cfg.badgeTop as number}
            stackedTop={cfg.badgeStackedTop as number}
            reserve={cfg.badgeReserve as number}
          />
        )}
        <WishlistButton
          productId={product.id}
          size={cfg.wishlistSize as number}
          className={`absolute z-20 ${cfg.wishlistPos} ${size === "medium" ? "group-hover:bg-blob" : ""}`}
        />
        {size !== "compact" && (
          <span className={`pointer-events-none absolute inset-x-0 ${cfg.quickViewPos} flex justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-has-[a:focus-visible]:opacity-100`}>
            <span className="type-button rounded-pill bg-surface px-8 py-[17px] text-ink">Quick view</span>
          </span>
        )}
      </div>
      <div className={`flex w-full items-start ${size === "compact" ? "flex-col gap-1" : "justify-between"}`}>
        <div className={`flex flex-col gap-1.5 ${size === "compact" ? "w-full" : "min-w-0 flex-1"}`}>
          {/* Compact titles reserve two lines (Figma: 40px) so prices line up across a row. */}
          <p className={`${cfg.titleClass} text-ink ${size === "compact" ? "line-clamp-2 min-h-[39px]" : "truncate"}`}>{product.name}</p>
          <p className="type-caption truncate text-ink-muted">{cardSubtitle(product, size === "compact")}</p>
          {showSwatches && <Swatches colours={product.colours} />}
        </div>
        <p className={`${cfg.priceClass} text-ink`}>{formatPrice(product.price, product.currency)}</p>
      </div>
    </div>
  );
}

/** Figma "State / Grid — Loading" (20:383) — skeleton mirrors the card silhouette. */
export function ProductCardSkeleton({ size = "large", className = "" }: { size?: Size; className?: string }) {
  const cfg = SIZE[size];
  return (
    <div className={`flex animate-pulse flex-col items-start ${cfg.gap} ${className}`} aria-hidden="true">
      <div className={`w-full rounded-[50%] bg-line/80 ${cfg.aspect}`} />
      <div className="flex w-full flex-col gap-2">
        <div className="h-4 w-[60%] rounded-md bg-line/80" />
        <div className="h-3 w-[40%] rounded-md bg-line/80" />
        <div className="h-3 w-[16%] rounded-md bg-line/80" />
      </div>
    </div>
  );
}
