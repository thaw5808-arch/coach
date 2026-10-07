"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/Icons";
import { OrderSummary, type OrderSummaryItem } from "@/components/order/OrderSummary";
import { useBag } from "@/lib/bag/BagContext";
import { DELIVERY_PRICE, DELIVERY_TITLE } from "@/lib/checkout/delivery";
import { useCheckout, type PaymentMethod } from "@/lib/checkout/CheckoutContext";
import {
  BILLING_REQUIRED_FIELDS,
  SHIPPING_REQUIRED_FIELDS,
  STORE_REQUIRED_FIELDS,
  isComplete,
  validateAll,
  type FieldKey,
} from "@/lib/checkout/validation";
import { BRAND_LABEL, DECLINED_TEST_CARD, detectBrand, last4, validateCardNumber, validateCvc, validateExpiry } from "@/lib/checkout/card";
import { validateGiftCard } from "@/lib/checkout/giftCards";
import { HOME_COUNTRY, countryName, formatCityLine } from "@/lib/address/countries";
import { calculateTax, getTax, taxLabel } from "@/lib/checkout/tax";
import { formatPrice } from "@/lib/format";
import { getProductById } from "@/lib/products";
import { createOrderId, saveOrder, snapshotLines, type Order } from "@/lib/orders";
import { getStoreById } from "@/lib/stores";
import { CardForm, type CardFormValues } from "./CardForm";
import { PaymentMethodSection } from "./PaymentMethodSection";
import { ReviewRow } from "./ReviewRow";
import { SummaryToggle } from "./SummaryToggle";
import { POLICY_COPY } from "@/lib/policies";

const EMPTY_CARD: CardFormValues = { number: "", name: "", expiry: "", cvc: "" };

export function CheckoutPaymentView() {
  const bag = useBag();
  const checkout = useCheckout();
  const router = useRouter();

  const [card, setCard] = useState<CardFormValues>(EMPTY_CARD);
  const [cardTouched, setCardTouched] = useState<Partial<Record<keyof CardFormValues, boolean>>>({});
  const [billingTouched, setBillingTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "declined">("idle");

  const hasSoldOut = bag.lines.some((l) => {
    const product = getProductById(l.productId);
    const colour = product?.colours.find((c) => c.name === l.colour);
    return colour ? !colour.available : false;
  });

  const requiredFields = checkout.state.deliveryMethod === "store" ? STORE_REQUIRED_FIELDS : SHIPPING_REQUIRED_FIELDS;
  const deliveryComplete =
    isComplete(checkout.state.values, requiredFields) && (checkout.state.deliveryMethod !== "store" || !!checkout.state.storeId);

  // Set once an order is placed: clearing the bag must not trip the empty-bag guard below and
  // override the redirect to the confirmation page.
  const placedRef = useRef(false);

  // Guards: nothing to pay for, or the previous step was skipped — wait for both stores to hydrate first.
  useEffect(() => {
    if (placedRef.current || !bag.hydrated || !checkout.hydrated) return;
    if (bag.lines.length === 0 || hasSoldOut) {
      router.replace("/bag");
      return;
    }
    if (!deliveryComplete) router.replace("/checkout/delivery");
  }, [bag.hydrated, checkout.hydrated, bag.lines.length, hasSoldOut, deliveryComplete, router]);

  const brand = detectBrand(card.number);

  const cardErrors = useMemo(() => {
    const errors: Partial<Record<keyof CardFormValues, string>> = {};
    if (checkout.state.paymentMethod !== "card") return errors;
    const numberError = validateCardNumber(card.number, brand);
    if (numberError) errors.number = numberError;
    if (!card.name.trim()) errors.name = "Please enter the name on the card.";
    const expiryError = validateExpiry(card.expiry);
    if (expiryError) errors.expiry = expiryError;
    const cvcError = validateCvc(card.cvc, brand);
    if (cvcError) errors.cvc = cvcError;
    return errors;
  }, [checkout.state.paymentMethod, card, brand]);

  const billingErrors = useMemo(() => {
    if (checkout.state.paymentMethod !== "card" || checkout.state.billing.sameAsDelivery) return {};
    return validateAll(checkout.state.billing.values, BILLING_REQUIRED_FIELDS);
  }, [checkout.state.paymentMethod, checkout.state.billing]);

  const isValid = checkout.state.paymentMethod !== "card" || (Object.keys(cardErrors).length === 0 && Object.keys(billingErrors).length === 0);

  function handleCardBlur(field: keyof CardFormValues) {
    setCardTouched((prev) => ({ ...prev, [field]: true }));
  }
  function handleBillingBlur(field: FieldKey) {
    setBillingTouched((prev) => ({ ...prev, [field]: true }));
  }

  const visibleCardErrors = submitted
    ? cardErrors
    : (Object.fromEntries(Object.entries(cardErrors).filter(([k]) => cardTouched[k as keyof CardFormValues])) as Partial<Record<keyof CardFormValues, string>>);
  // Submit marks every billing field touched; changing country un-touches its dependent fields (fresh errors).
  const visibleBillingErrors = (Object.fromEntries(Object.entries(billingErrors).filter(([k]) => billingTouched[k as FieldKey])) as Partial<Record<FieldKey, string>>);

  // Totals.
  const deliveryPrice = DELIVERY_PRICE[checkout.state.deliveryMethod];
  const deliveryLabel = deliveryPrice === 0 ? "Complimentary" : formatPrice(deliveryPrice);
  const taxableAmount = Math.max(0, bag.subtotal - bag.discount + deliveryPrice);
  // Collect in Store is a New York boutique → home-country default rate.
  const taxInfo = checkout.state.deliveryMethod === "store" ? getTax(HOME_COUNTRY, "") : getTax(checkout.state.values.country, checkout.state.values.state);
  const tax = calculateTax(taxableAmount, taxInfo);
  // Figma's "Estimated tax" for US orders; international orders show what the estimate is (e.g. "VAT (7%)").
  const taxRowLabel = taxInfo.label === "Tax" ? "Estimated tax" : taxLabel(taxInfo);
  const preGiftTotal = Math.max(0, taxableAmount + tax);

  const giftCardResult = checkout.state.giftCardCode ? validateGiftCard(checkout.state.giftCardCode) : null;
  const giftCard = giftCardResult?.ok ? giftCardResult.card : null;
  const giftCardAmount = giftCard ? Math.min(giftCard.balance, preGiftTotal) : 0;
  const total = Math.max(0, preGiftTotal - giftCardAmount);

  const summaryItems: OrderSummaryItem[] = bag.lines.map((line) => {
    const product = getProductById(line.productId);
    const colour = product?.colours.find((c) => c.name === line.colour) ?? product?.colours[0];
    return {
      key: `${line.productId}-${line.colour ?? ""}`,
      name: product?.name ?? "Item",
      detail: `${colour?.name ?? ""} · Qty ${line.quantity}`,
      price: (product?.price ?? 0) * line.quantity,
      image: colour?.image.src ?? "",
      initials: line.initials ? `Initials: ${line.initials} (${line.finish})` : undefined,
    };
  });

  const shipToValue =
    checkout.state.deliveryMethod === "store"
      ? getStoreById(checkout.state.storeId ?? "")?.name ?? "Boutique pickup"
      : `${checkout.state.values.address1}${checkout.state.values.address2 ? `, ${checkout.state.values.address2}` : ""}, ${formatCityLine(checkout.state.values)}${
          checkout.state.values.country !== HOME_COUNTRY ? `, ${countryName(checkout.state.values.country)}` : ""
        }`;

  // Mobile sticky Place Order bar: shown once the page heading scrolls out of view, hidden again
  // once the inline submit button (further down the page) is back on screen.
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [pastTop, setPastTop] = useState(false);
  const [bottomVisible, setBottomVisible] = useState(false);

  useEffect(() => {
    const topEl = topSentinelRef.current;
    const bottomEl = bottomSentinelRef.current;
    if (!topEl || !bottomEl) return;
    const topObserver = new IntersectionObserver(([entry]) => setPastTop(!entry.isIntersecting), { threshold: 0 });
    const bottomObserver = new IntersectionObserver(([entry]) => setBottomVisible(entry.isIntersecting), { threshold: 0 });
    topObserver.observe(topEl);
    bottomObserver.observe(bottomEl);
    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, []);

  const showStickyBar = pastTop && !bottomVisible;

  function firstInvalidFieldId(): string | null {
    if (checkout.state.paymentMethod !== "card") return null;
    const cardOrder: (keyof CardFormValues)[] = ["number", "name", "expiry", "cvc"];
    const firstCard = cardOrder.find((f) => cardErrors[f]);
    if (firstCard) return `card-${firstCard}`;
    const billingOrder = BILLING_REQUIRED_FIELDS;
    const firstBilling = billingOrder.find((f) => billingErrors[f]);
    if (firstBilling) return `billing-${firstBilling}`;
    return null;
  }

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (status === "processing") return;
    setSubmitted(true);

    if (!isValid) {
      setCardTouched({ number: true, name: true, expiry: true, cvc: true });
      setBillingTouched(Object.fromEntries(BILLING_REQUIRED_FIELDS.map((f) => [f, true])) as Partial<Record<FieldKey, boolean>>);
      const targetId = firstInvalidFieldId();
      const target = targetId ? document.getElementById(targetId) : null;
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setStatus("processing");
    window.setTimeout(() => {
      if (checkout.state.paymentMethod === "card" && card.number === DECLINED_TEST_CARD) {
        setStatus("declined");
        return;
      }

      const order: Order = {
        id: createOrderId(),
        createdAt: new Date().toISOString(),
        status: "placed",
        lines: snapshotLines(bag.lines, getProductById),
        subtotal: bag.subtotal,
        discount: bag.discount,
        deliveryPrice,
        tax,
        giftCardAmount,
        total,
        firstName: checkout.state.values.firstName,
        lastName: checkout.state.values.lastName,
        contactEmail: checkout.state.values.email,
        contactPhone: checkout.state.values.phone,
        deliveryMethod: checkout.state.deliveryMethod,
        shippingAddress: checkout.state.deliveryMethod === "store" ? null : checkout.state.values,
        storeId: checkout.state.deliveryMethod === "store" ? checkout.state.storeId : null,
        payment: checkout.state.paymentMethod === "card" ? { brand: BRAND_LABEL[brand], last4: last4(card.number) } : { method: checkout.state.paymentMethod },
      };

      saveOrder(order);
      placedRef.current = true;
      bag.clear();
      checkout.reset();
      router.replace(`/order/${order.id}`);
    }, 1500);
  }

  if (!bag.hydrated || !checkout.hydrated || bag.lines.length === 0 || hasSoldOut || !deliveryComplete) {
    // A viewport tall until storage loads, so the footer starts below the fold instead of jumping (CLS).
    return <div className="min-h-svh" aria-hidden="true" />;
  }

  const placeOrderLabel = checkout.state.paymentMethod === "card" ? "Place Order" : checkout.state.paymentMethod === "paypal" ? "Pay with PayPal" : "Pay with Apple Pay";

  return (
    <div className="bg-bg pb-16">
      <div ref={topSentinelRef} className="px-4 pt-6 desk:hidden">
        <SummaryToggle
          items={summaryItems}
          pieceCount={bag.count}
          subtotal={bag.subtotal}
          discount={bag.discount}
          deliveryLabel={deliveryLabel}
          taxAmount={tax}
          taxRowLabel={taxRowLabel}
          giftCardAmount={giftCardAmount}
          total={total}
        />
      </div>

      <form
        onSubmit={handlePlaceOrder}
        noValidate
        className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pb-0 pt-8 desk:flex-row desk:items-start desk:gap-12 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-16"
      >
        <div className="flex w-full flex-col items-start gap-10 desk:w-[744px]">
          <div className="flex w-full flex-col items-start gap-2">
            <p className="type-product-mobile text-ink desk:type-product">Payment</p>
            <p className="type-italic text-accent-deep">You won’t be charged until you place your order.</p>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <div className="flex items-baseline gap-3">
              <p className="type-eyebrow text-accent-deep">01</p>
              <p className="type-h3 text-ink">Review</p>
            </div>
            <div className="flex w-full flex-col">
              <ReviewRow label="Contact" value={checkout.state.values.email} editHref="/checkout/delivery" />
              <ReviewRow label="Ship to" value={shipToValue} editHref="/checkout/delivery" />
              <ReviewRow label="Method" value={DELIVERY_TITLE[checkout.state.deliveryMethod]} editHref="/checkout/delivery" />
            </div>
          </div>

          <PaymentMethodSection
            method={checkout.state.paymentMethod}
            onMethodChange={(m: PaymentMethod) => checkout.setPaymentMethod(m)}
            cardForm={
              <CardForm
                values={card}
                errors={visibleCardErrors}
                touched={cardTouched}
                onChange={(patch) => setCard((prev) => ({ ...prev, ...patch }))}
                onBlur={handleCardBlur}
                billingSameAsDelivery={checkout.state.billing.sameAsDelivery}
                onBillingSameAsDeliveryChange={checkout.setBillingSameAsDelivery}
                billingValues={checkout.state.billing.values}
                billingErrors={visibleBillingErrors}
                onBillingChange={checkout.setBillingValues}
                onBillingBlur={handleBillingBlur}
                onBillingReset={(fields) => setBillingTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, false])) }))}
              />
            }
          />

          {status === "declined" && (
            <div role="alert" className="flex w-full flex-col gap-1 rounded-[20px] border border-error bg-surface px-5 py-4">
              <p className="type-h4 text-ink">This card was declined</p>
              <p className="type-caption text-ink-muted">Try another card, or use PayPal or Apple Pay instead.</p>
            </div>
          )}

          <div ref={bottomSentinelRef} className="flex w-full flex-col items-center gap-4 border-t border-line pt-8 desk:flex-row desk:gap-6">
            <button
              type="submit"
              disabled={status === "processing"}
              aria-busy={status === "processing" || undefined}
              className="type-button flex h-[53px] w-full items-center justify-center gap-3 rounded-pill text-surface transition-colors focus-visible:outline-none focus-visible:border-2 focus-visible:border-accent-deep disabled:cursor-wait desk:w-auto bg-ink hover:bg-accent-deep"
            >
              {status === "processing" ? (
                <>
                  <span>Placing order</span>
                  <span className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-1 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <span>{placeOrderLabel}</span>
                  <ArrowIcon size={18} />
                </>
              )}
            </button>
            <p className="type-caption text-ink-muted">Taxes and totals are final once your order is placed.</p>
          </div>
        </div>

        <div className="hidden w-full flex-col gap-6 desk:flex desk:w-[456px]">
          <OrderSummary
            editHref="/bag"
            items={summaryItems}
            pieceCount={bag.count}
            subtotal={bag.subtotal}
            discount={bag.discount}
            deliveryLabel={deliveryLabel}
            taxAmount={tax}
            taxRowLabel={taxRowLabel}
            giftCard={{
              appliedLast4: giftCard?.last4 ?? null,
              appliedAmount: giftCardAmount,
              onApply: (code) => {
                const result = validateGiftCard(code);
                if (result.ok) checkout.setGiftCardCode(result.card.code);
                return result;
              },
              onRemove: () => checkout.setGiftCardCode(null),
            }}
            total={total}
            footer={
              <div className="flex w-full flex-col items-start gap-3 pt-2">
                <p className="type-caption text-ink">Encrypted, secure payment</p>
                <p className="type-caption text-ink">{POLICY_COPY.freeReturns}</p>
                <p className="type-caption text-ink">{POLICY_COPY.careHours}</p>
              </div>
            }
          />
        </div>
      </form>

      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-line bg-surface px-4 py-3 desk:hidden">
          <div className="flex flex-col">
            <p className="type-caption text-ink-muted">Total</p>
            <p className="type-price-sm text-ink">{formatPrice(total)}</p>
          </div>
          <button
            type="button"
            onClick={() => bottomSentinelRef.current?.closest("form")?.requestSubmit()}
            disabled={status === "processing"}
              aria-busy={status === "processing" || undefined}
            className="type-button flex h-[48px] flex-1 items-center justify-center gap-2 rounded-pill text-surface disabled:cursor-wait bg-ink hover:bg-accent-deep"
          >
            {status === "processing" ? "Placing order…" : placeOrderLabel}
          </button>
        </div>
      )}
    </div>
  );
}
