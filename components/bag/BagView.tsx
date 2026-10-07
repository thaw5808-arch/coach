"use client";

import Link from "@/components/ui/SiteLink";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { CheckoutSteps } from "@/components/ui/CheckoutSteps";
import { OrderSummary } from "@/components/order/OrderSummary";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { useBag, type BagLine } from "@/lib/bag/BagContext";
import { formatPrice } from "@/lib/format";
import { getProductById, getProductsInCategory, getRelatedProducts } from "@/lib/products";
import { BagLineItem } from "./BagLineItem";
import { EmptyBag } from "./EmptyBag";
import { GiftOption } from "./GiftOption";
import { QuickCheckoutCard } from "./QuickCheckoutCard";
import { SavedForLaterItem } from "./SavedForLaterItem";
import { CARE_HOURS, POLICY_COPY } from "@/lib/policies";

const sameLine = (a: BagLine, b: BagLine) => a.productId === b.productId && a.colour === b.colour;

export function BagView() {
  const bag = useBag();
  const router = useRouter();

  const [removed, setRemoved] = useState<{ line: BagLine; index: number; name: string } | null>(null);
  const removedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const quickCheckoutRef = useRef<HTMLDivElement | null>(null);
  const savedForLaterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = quickCheckoutRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(removedTimer.current), []);

  function handleRemove(line: BagLine) {
    const index = bag.lines.findIndex((l) => sameLine(l, line));
    const name = getProductById(line.productId)?.name ?? "Item";
    bag.remove(line.productId, line.colour);
    setRemoved({ line, index, name });
    clearTimeout(removedTimer.current);
    removedTimer.current = setTimeout(() => setRemoved(null), 10000);
  }

  function handleUndo() {
    if (!removed) return;
    bag.restoreLine(removed.line, removed.index);
    setRemoved(null);
    clearTimeout(removedTimer.current);
  }

  const hasSoldOut = bag.lines.some((l) => {
    const product = getProductById(l.productId);
    const colour = product?.colours.find((c) => c.name === l.colour);
    return colour ? !colour.available : false;
  });
  const checkoutDisabled = bag.lines.length === 0 || hasSoldOut;

  function handleCheckout() {
    if (checkoutDisabled || checkoutLoading) return;
    setCheckoutLoading(true);
    setTimeout(() => router.push("/checkout/delivery"), 700);
  }

  const excludeIds = new Set([...bag.lines, ...bag.savedForLater].map((l) => l.productId));
  const primaryProduct = getProductById(bag.lines[0]?.productId ?? bag.savedForLater[0]?.productId ?? "");
  const primaryCategory = primaryProduct?.category ?? "women";
  const relatedItems = primaryProduct ? getRelatedProducts(primaryProduct, excludeIds) : getProductsInCategory("women").filter((p) => !excludeIds.has(p.id));
  const categoryLabel = primaryCategory === "men" ? "men's bags" : primaryCategory === "women" ? "women's bags" : "bags";

  // Avoid flashing "empty" before localStorage has loaded.
  if (!bag.hydrated) {
    // A viewport tall until storage loads, so the footer starts below the fold instead of jumping (CLS).
    return <div className="min-h-svh" aria-hidden="true" />;
  }

  const isEmpty = bag.lines.length === 0;

  return (
    <div className="bg-bg pb-16">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pt-6 desk:gap-12 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-12">
        <div className="flex w-full flex-col gap-6 desk:gap-12">
          <div className="flex w-full items-center justify-between">
            <CheckoutSteps step={1} />
            <Button href="/new-arrivals" variant="text" showArrow={false} className="hidden desk:inline-flex">
              Continue shopping
            </Button>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="type-product-mobile text-ink desk:type-product">Your Bag</h1>
            <p className="type-caption text-ink-muted">
              {bag.count} {bag.count === 1 ? "piece" : "pieces"}
            </p>
          </div>
        </div>

        {!isEmpty && (
          <div ref={quickCheckoutRef}>
            <QuickCheckoutCard total={bag.total} disabled={checkoutDisabled} loading={checkoutLoading} onCheckout={handleCheckout} />
          </div>
        )}

        {removed && (
          <div className="flex w-full items-center justify-between gap-4 rounded-pill bg-blob px-6 py-4">
            <p className="type-body text-ink">{removed.name} was removed from your bag.</p>
            <button type="button" onClick={handleUndo} className="type-button shrink-0 text-ink">
              Undo
            </button>
          </div>
        )}

        {isEmpty ? (
          <EmptyBag savedCount={bag.savedForLater.length} onViewSaved={() => savedForLaterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
        ) : (
          <div className="flex w-full flex-col gap-12 desk:flex-row desk:items-start">
            <div className="flex w-full flex-col items-start desk:w-[744px]">
              <div className="flex w-full flex-col border-b border-line">
                {bag.lines.map((line) => (
                  <BagLineItem
                    key={`${line.productId}-${line.colour ?? ""}`}
                    line={line}
                    onQuantityChange={(next) => bag.setQuantity(line.productId, next, line.colour)}
                    onRemove={() => handleRemove(line)}
                    onSaveForLater={() => bag.moveToSaved(line.productId, line.colour)}
                  />
                ))}
              </div>

              <div className="w-full pt-8">
                <GiftOption wrapped={bag.gift.wrapped} note={bag.gift.note} onWrappedChange={bag.setGiftWrapped} onNoteChange={bag.setGiftNote} />
              </div>
            </div>

            <div className="flex w-full flex-col gap-6 desk:w-[456px]">
              <OrderSummary
                pieceCount={bag.count}
                subtotal={bag.subtotal}
                discount={bag.discount}
                total={bag.total}
                promo={{ code: bag.promoCode, onApply: bag.applyPromo, onRemove: bag.removePromo }}
                cta={
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutDisabled || checkoutLoading}
                    className="type-button flex h-[53px] w-full items-center justify-center gap-3 rounded-pill bg-ink text-surface transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:border-2 focus-visible:border-accent-deep disabled:opacity-35 disabled:hover:bg-ink"
                  >
                    {checkoutLoading ? (
                      <>
                        <span>Checkout</span>
                        <span className="flex gap-1" aria-hidden="true">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="size-1 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                          ))}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Checkout</span>
                        <ArrowIcon size={18} />
                      </>
                    )}
                  </button>
                }
                footer={
                  <>
                    <p className="type-caption w-full text-center text-ink-muted">Secure checkout · {POLICY_COPY.freeReturns}</p>
                    <div className="flex w-full flex-col items-start gap-1 pt-2">
                      <p className="type-h4 text-ink">Need Assistance?</p>
                      <p className="type-caption text-ink-muted">
                        Our Client Care team is available every day, {CARE_HOURS}, to help with sizing, gifting and delivery.
                      </p>
                      <Link href="/client-care#contact" className="type-button flex items-center gap-3 py-2 text-ink">
                        Contact Client Care
                      </Link>
                    </div>
                  </>
                }
              />
            </div>
          </div>
        )}

        {bag.savedForLater.length > 0 && (
          <div ref={savedForLaterRef} className="flex w-full flex-col items-start gap-4 desk:w-[744px]">
            <div className="flex items-baseline gap-3">
              <p className="type-h3 text-ink">Saved for Later</p>
              <p className="type-caption text-ink-muted">
                {bag.savedForLater.length} {bag.savedForLater.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
            {bag.savedForLater.map((line) => (
              <SavedForLaterItem key={`${line.productId}-${line.colour ?? ""}`} line={line} onMoveToBag={() => bag.moveToBag(line.productId, line.colour)} />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1440px] px-4 desk:px-[clamp(24px,6.667vw,96px)]">
        <RelatedProducts items={relatedItems} title="Pairs With Your Bag" viewAllHref={`/${primaryCategory}`} viewAllLabel={`View all ${categoryLabel}`} />
      </div>

      {stickyVisible && !isEmpty && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface px-4 pb-7 pt-3 desk:hidden">
          <div className="flex-1">
            <p className="type-caption text-ink-muted">Total · {bag.count} pieces</p>
            <p className="type-price text-ink">{formatPrice(bag.total)}</p>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutDisabled || checkoutLoading}
            className="type-button rounded-pill bg-ink px-5 py-[17px] text-surface disabled:opacity-35"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
