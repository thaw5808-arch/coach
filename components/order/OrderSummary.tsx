import Link from "next/link";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/format";
import type { PromoResult } from "@/lib/promos";
import type { GiftCardResult } from "@/lib/checkout/giftCards";
import { PromoCodeField } from "@/components/bag/PromoCodeField";
import { GiftCardField } from "@/components/checkout/GiftCardField";

export type OrderSummaryItem = {
  key: string;
  name: string;
  detail: string;
  price: number;
  image: string;
  initials?: string;
};

/**
 * Shared order-summary card — Figma "Order Summary" (Shopping Bag 43:145/44:328,
 * Checkout Delivery 51:163/54:355). Checkout passes `items` (it has no separate
 * line-item list on the page); Bag renders its own list above and omits `items`.
 */
export function OrderSummary({
  title = "Order Summary",
  editHref,
  items,
  pieceCount,
  subtotal,
  discount,
  deliveryLabel = "Complimentary",
  taxNote = "Calculated at checkout",
  taxRowLabel = "Estimated tax",
  taxAmount,
  total,
  promo,
  giftCard,
  cta,
  footer,
}: {
  title?: string;
  editHref?: string;
  items?: OrderSummaryItem[];
  pieceCount: number;
  subtotal: number;
  discount: number;
  deliveryLabel?: string;
  taxNote?: string;
  /** Left-hand label of the tax row — international orders name the basis, e.g. "VAT (7%)". */
  taxRowLabel?: string;
  /** When known (Payment step), the real computed tax amount — overrides `taxNote`. */
  taxAmount?: number;
  total: number;
  promo?: { code: string | null; onApply: (code: string) => PromoResult; onRemove: () => void };
  giftCard?: { appliedLast4: string | null; appliedAmount: number; onApply: (code: string) => GiftCardResult; onRemove: () => void };
  cta?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-pill bg-surface p-6 desk:p-8">
      <div className="flex w-full items-baseline justify-between">
        <p className="type-h3 text-ink">{title}</p>
        {editHref && (
          <Link href={editHref} className="type-caption text-ink underline decoration-from-font">
            Edit bag
          </Link>
        )}
      </div>

      {items && items.length > 0 && (
        <div className="flex w-full flex-col border-b border-line">
          {items.map((item) => (
            <div key={item.key} className="flex w-full items-center gap-4 border-t border-line py-4">
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-pill bg-bg">
                <SafeImage src={item.image} alt="" fill sizes="72px" className="object-contain p-1.5" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="type-h4 text-ink">{item.name}</p>
                <p className="type-caption text-ink-muted">{item.detail}</p>
                {item.initials && <p className="type-caption text-accent-deep">{item.initials}</p>}
              </div>
              <p className="type-price-sm text-ink">{formatPrice(item.price)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex w-full items-start justify-between">
        <p className="type-body text-ink-muted">
          Subtotal ({pieceCount} {pieceCount === 1 ? "piece" : "pieces"})
        </p>
        <p className="type-body text-ink">{formatPrice(subtotal)}</p>
      </div>
      <div className="flex w-full items-start justify-between">
        <p className="type-body text-ink-muted">Delivery</p>
        <p className="type-body text-ink">{deliveryLabel}</p>
      </div>
      <div className="flex w-full items-start justify-between">
        <p className="type-body text-ink-muted">{taxRowLabel}</p>
        <p className={taxAmount === undefined ? "type-body text-ink-muted" : "type-body text-ink"}>{taxAmount === undefined ? taxNote : formatPrice(taxAmount)}</p>
      </div>

      {discount > 0 && (
        <div className="flex w-full items-start justify-between">
          <p className="type-body text-ink-muted">Discount</p>
          <p className="type-body text-accent-deep">−{formatPrice(discount)}</p>
        </div>
      )}

      {giftCard?.appliedLast4 && (
        <div className="flex w-full items-start justify-between">
          <p className="type-body text-ink-muted">Gift card</p>
          <p className="type-body text-accent-deep">−{formatPrice(giftCard.appliedAmount)}</p>
        </div>
      )}

      {promo && <PromoCodeField appliedCode={promo.code} onApply={promo.onApply} onRemove={promo.onRemove} />}
      {giftCard && <GiftCardField appliedLast4={giftCard.appliedLast4} appliedAmount={giftCard.appliedAmount} onApply={giftCard.onApply} onRemove={giftCard.onRemove} />}

      <div className="flex w-full items-baseline justify-between border-t border-line pt-4">
        <p className="type-h3 text-ink">Total</p>
        <p className="type-price-lg text-ink">{formatPrice(total)}</p>
      </div>

      {cta}
      {footer}
    </div>
  );
}
