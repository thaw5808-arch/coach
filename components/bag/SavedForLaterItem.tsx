import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import type { BagLine } from "@/lib/bag/BagContext";
import { formatPrice } from "@/lib/format";
import { getProductById } from "@/lib/products";

export function SavedForLaterItem({ line, onMoveToBag }: { line: BagLine; onMoveToBag: () => void }) {
  const product = getProductById(line.productId);
  if (!product) return null;
  const colour = product.colours.find((c) => c.name === line.colour) ?? product.colours[0];

  return (
    <div className="flex w-full items-center gap-4 border-y border-line py-4 desk:gap-5 desk:py-5">
      <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true" className="relative size-20 shrink-0 overflow-hidden rounded-pill bg-surface desk:size-24">
        <SafeImage src={colour.image.src} alt="" fill sizes="96px" className="object-contain p-1.5" />
      </Link>
      <div className="flex flex-1 flex-col gap-0.5">
        <Link href={`/products/${product.slug}`} className="type-h4 text-ink">
          {product.name}
        </Link>
        <p className="type-caption desk:hidden text-ink">{formatPrice(product.price, product.currency)}</p>
        <p className="type-caption hidden text-ink-muted desk:block">
          {colour.name} · {product.material}
        </p>
        <p className="type-price-sm hidden text-ink desk:block">{formatPrice(product.price, product.currency)}</p>
        <button type="button" onClick={onMoveToBag} className="type-caption w-fit py-3 text-ink underline decoration-from-font desk:hidden">
          Move to bag
        </button>
      </div>
      <Button variant="secondary" showArrow={false} onClick={onMoveToBag} className="hidden desk:inline-flex">
        Move to bag
      </Button>
    </div>
  );
}
