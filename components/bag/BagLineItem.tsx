import Link from "next/link";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { SafeImage } from "@/components/ui/SafeImage";
import type { BagLine } from "@/lib/bag/BagContext";
import { formatPrice } from "@/lib/format";
import { getProductById } from "@/lib/products";
import { POLICY_COPY } from "@/lib/policies";

const NEW_ARRIVAL_LIMIT = 2;
const DEFAULT_LIMIT = 5;

/** Figma "Bag Line Item" (42:155) — includes the "Sold Out & Limit" state (45:326). */
export function BagLineItem({
  line,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}: {
  line: BagLine;
  onQuantityChange: (next: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
}) {
  const product = getProductById(line.productId);
  if (!product) return null;
  const colour = product.colours.find((c) => c.name === line.colour) ?? product.colours[0];
  const soldOut = !colour.available;
  const maxQty = product.tags.includes("new-arrival") ? NEW_ARRIVAL_LIMIT : DEFAULT_LIMIT;
  const atMax = line.quantity >= maxQty;

  return (
    <div className="flex w-full gap-4 border-t border-line py-5 desk:gap-6 desk:py-8">
      {/* Same destination as the name link beside it — one tab stop / one announcement per piece. */}
      <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true" className={`relative size-[104px] shrink-0 overflow-hidden rounded-pill bg-surface desk:size-[160px] ${soldOut ? "opacity-50" : ""}`}>
        <SafeImage src={colour.image.src} alt="" fill sizes="160px" className="object-contain p-2 desk:p-3" />
      </Link>

      <div className="flex min-h-[104px] flex-1 flex-col justify-between desk:min-h-[160px]">
        <div className="flex flex-col gap-1.5 desk:gap-2">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/products/${product.slug}`} className="type-h4 text-ink desk:type-h3">
              {product.name}
            </Link>
            <p className="type-price-sm shrink-0 text-ink desk:type-price">{formatPrice(product.price * line.quantity, product.currency)}</p>
          </div>
          <p className="type-caption text-ink-muted">
            {colour.name} · {product.material}
          </p>
          {line.initials && (
            <p className="type-caption text-accent-deep">
              Initials: {line.initials} ({line.finish})
            </p>
          )}
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${soldOut ? "bg-error" : "bg-accent-deep"}`} />
            <p className={`type-caption ${soldOut ? "text-error" : "text-ink"}`}>
              {soldOut ? "Sold out — move it to Saved for Later to be notified" : `In stock — ${POLICY_COPY.ships.toLowerCase()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className={soldOut ? "pointer-events-none opacity-35" : ""}>
            <QuantityStepper value={line.quantity} onChange={onQuantityChange} max={maxQty} label={product.name} />
          </div>
          <div className="flex items-center gap-2 desk:gap-4">
            <button type="button" onClick={onSaveForLater} className="type-caption px-1.5 py-3 text-ink underline decoration-from-font">
              <span className="desk:hidden">Save</span>
              <span className="hidden desk:inline">Save for later</span>
            </button>
            <button type="button" onClick={onRemove} className="type-caption px-1.5 py-3 text-ink underline decoration-from-font">
              Remove
            </button>
          </div>
        </div>
        {!soldOut && atMax && <p className="type-caption text-ink-muted">Limit of {maxQty} per client for new arrivals.</p>}
      </div>
    </div>
  );
}
