"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/ui/Icons";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/format";
import type { OrderSummaryItem } from "@/components/order/OrderSummary";

/** Figma "Summary Toggle" (52:124) + "State / Mobile — Order Summary Expanded" (54:177). */
export function SummaryToggle({
  items,
  pieceCount,
  subtotal,
  discount = 0,
  deliveryLabel,
  taxAmount,
  taxRowLabel = "Estimated tax",
  giftCardAmount = 0,
  total,
}: {
  items: OrderSummaryItem[];
  pieceCount: number;
  subtotal: number;
  discount?: number;
  deliveryLabel: string;
  taxAmount?: number;
  /** See OrderSummary — "VAT (7%)" etc. for international orders. */
  taxRowLabel?: string;
  giftCardAmount?: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-pill bg-surface px-5">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-14 w-full items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="type-caption text-ink">
            {open ? "Hide" : "Show"} order summary · {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
          </span>
          <ChevronIcon size={16} className={`text-ink transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </span>
        <span className="type-price text-ink">{formatPrice(total)}</span>
      </button>

      <div className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pb-5">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-3 border-t border-line pt-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-[16px] bg-bg">
                  <SafeImage src={item.image} alt="" fill sizes="56px" className="object-contain p-1" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="type-h4 text-ink">{item.name}</p>
                  <p className="type-caption text-ink-muted">{item.detail}</p>
                </div>
                <p className="type-price-sm text-ink">{formatPrice(item.price)}</p>
              </div>
            ))}
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <p className="type-caption text-ink-muted">Subtotal</p>
                <p className="type-caption text-ink">{formatPrice(subtotal)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="type-caption text-ink-muted">Delivery</p>
                <p className="type-caption text-ink">{deliveryLabel}</p>
              </div>
              {taxAmount !== undefined && (
                <div className="flex items-center justify-between">
                  <p className="type-caption text-ink-muted">{taxRowLabel}</p>
                  <p className="type-caption text-ink">{formatPrice(taxAmount)}</p>
                </div>
              )}
              {discount > 0 && (
                <div className="flex items-center justify-between">
                  <p className="type-caption text-ink-muted">Discount</p>
                  <p className="type-caption text-accent-deep">−{formatPrice(discount)}</p>
                </div>
              )}
              {giftCardAmount > 0 && (
                <div className="flex items-center justify-between">
                  <p className="type-caption text-ink-muted">Gift card</p>
                  <p className="type-caption text-accent-deep">−{formatPrice(giftCardAmount)}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="type-h4 text-ink">Total</p>
                <p className="type-price text-ink">{formatPrice(total)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
