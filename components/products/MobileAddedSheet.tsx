import Link from "next/link";
import { ArrowIcon, CheckIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice, type Product } from "@/lib/products";
import type { AddedLine } from "./ProductPurchasePanel";

/** Figma "State / Mobile — Added to Bag" (Product Detail States 35:255, node 35:458). */
export function MobileAddedSheet({ open, onClose, product, line }: { open: boolean; onClose: () => void; product: Product; line: AddedLine | null }) {
  const colour = product.colours.find((c) => c.name === line?.colourName) ?? product.colours[0];

  return (
    <Overlay open={open} onClose={onClose} shape="sheet" label="Added to your bag">
      <div className="flex w-full flex-col gap-5 px-4 pb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent-deep text-surface">
            <CheckIcon size={16} />
          </span>
          <p className="type-h3 text-ink">Added to Your Bag</p>
        </div>
        <div className="flex items-center gap-4 border-y border-line py-4">
          <div className="relative size-[88px] shrink-0 overflow-hidden rounded-pill bg-bg">
            <SafeImage src={colour.image.src} alt="" fill sizes="88px" className="object-contain" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="type-h4 text-ink">{product.name}</p>
            <p className="type-caption text-ink-muted">
              {colour.name} · {product.material}
            </p>
            <p className="type-price-sm text-ink">{formatPrice(product.price, product.currency)}</p>
          </div>
        </div>
        <Link href="/checkout/delivery" className="type-button flex h-[53px] items-center justify-center gap-3 rounded-pill bg-ink text-surface">
          Checkout <ArrowIcon size={18} />
        </Link>
        <button type="button" onClick={onClose} className="type-button flex h-11 items-center justify-center text-ink">
          Continue shopping
        </button>
      </div>
    </Overlay>
  );
}
