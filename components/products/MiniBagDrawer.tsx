import Link from "next/link";
import { ArrowIcon, CloseIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { SafeImage } from "@/components/ui/SafeImage";
import { useBag } from "@/lib/bag/BagContext";
import { formatPrice, getRelatedProducts, type Product } from "@/lib/products";
import type { AddedLine } from "./ProductPurchasePanel";

/** Figma "State / Mini Bag — Drawer (Desktop)" (Product Detail States 35:255, node 35:290). */
export function MiniBagDrawer({ open, onClose, product, line }: { open: boolean; onClose: () => void; product: Product; line: AddedLine | null }) {
  const bag = useBag();
  const colour = product.colours.find((c) => c.name === line?.colourName) ?? product.colours[0];
  const bagLine = bag.lines.find((l) => l.productId === product.id && l.colour === colour.name);
  const quantity = bagLine?.quantity ?? 1;
  const suggestions = getRelatedProducts(product).slice(0, 2);

  return (
    <Overlay open={open} onClose={onClose} shape="drawer" label="Your bag">
      <div className="flex items-center justify-between px-10 pb-6 pt-8">
        <div className="flex flex-col gap-1">
          <p className="type-eyebrow text-accent-deep">ADDED TO YOUR BAG</p>
          <p className="type-h1-mobile text-ink">Your Bag ({bag.count})</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-full bg-bg text-ink">
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="flex gap-5 border-t border-line px-10 py-6">
        <div className="relative size-[104px] shrink-0 overflow-hidden rounded-pill bg-bg">
          <SafeImage src={colour.image.src} alt="" fill sizes="104px" className="object-contain" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="type-h4 text-ink">{product.name}</p>
          <p className="type-caption text-ink-muted">
            {colour.name} · {product.material}
          </p>
          {line?.initials && (
            <p className="type-caption text-ink-muted">
              Initials: {line.initials} ({line.finish})
            </p>
          )}
          <div className="flex w-full items-center justify-between pt-2">
            <button type="button" onClick={() => bag.remove(product.id, colour.name)} className="type-caption text-ink-muted hover:text-ink">
              Remove
            </button>
            <span className="type-price-sm text-ink">{formatPrice(product.price * quantity, product.currency)}</span>
          </div>
          <QuantityStepper
            value={quantity}
            onChange={(next) => bag.setQuantity(product.id, next, colour.name)}
            label={product.name}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-10 pt-8">
        <p className="type-eyebrow text-ink">PAIRS WELL WITH</p>
        {suggestions.map((s) => (
          <div key={s.id} className="flex w-full items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-pill bg-bg">
              <SafeImage src={s.colours[0].image.src} alt="" fill sizes="64px" className="object-contain" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="type-h4 text-ink">{s.name}</p>
              <p className="type-caption text-ink-muted">{formatPrice(s.price, s.currency)}</p>
            </div>
            <button type="button" onClick={() => bag.add(s.id, s.colours[0].name)} className="type-chip text-accent-deep">
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-line px-10 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <p className="type-body text-ink-muted">Subtotal</p>
          <p className="type-price text-ink">{formatPrice(bag.subtotal)}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="type-body text-ink-muted">Delivery</p>
          <p className="type-body text-ink">Complimentary</p>
        </div>
        <Link href="/checkout/delivery" className="type-button flex h-[53px] items-center justify-center gap-3 rounded-pill bg-ink text-surface">
          Checkout <ArrowIcon size={18} />
        </Link>
        <Link href="/bag" className="type-button flex h-[53px] items-center justify-center rounded-pill border border-line bg-surface text-ink">
          View bag
        </Link>
      </div>
    </Overlay>
  );
}
