"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowIcon } from "@/components/ui/Icons";
import { OrderSummary, type OrderSummaryItem } from "@/components/order/OrderSummary";
import { useBag } from "@/lib/bag/BagContext";
import { DELIVERY_PRICE } from "@/lib/checkout/delivery";
import { useCheckout } from "@/lib/checkout/CheckoutContext";
import { SHIPPING_REQUIRED_FIELDS, STORE_REQUIRED_FIELDS, validateAll, type FieldKey, fieldLabel } from "@/lib/checkout/validation";
import { formatPrice } from "@/lib/format";
import { getProductById } from "@/lib/products";
import { useSession, type SavedAddress } from "@/lib/auth/SessionContext";
import { AddressSection } from "./AddressSection";
import { ContactSection } from "./ContactSection";
import { DeliveryMethodSection } from "./DeliveryMethodSection";
import { ErrorSummary } from "./ErrorSummary";
import { SummaryToggle } from "./SummaryToggle";
import { POLICY_COPY } from "@/lib/policies";

export function CheckoutDeliveryView() {
  const bag = useBag();
  const checkout = useCheckout();
  const router = useRouter();

  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { session, account, signOut } = useSession();

  const hasSoldOut = bag.lines.some((l) => {
    const product = getProductById(l.productId);
    const colour = product?.colours.find((c) => c.name === l.colour);
    return colour ? !colour.available : false;
  });

  // Guard: empty or sold-out bags have nothing to check out — but wait for hydration first.
  useEffect(() => {
    if (!bag.hydrated) return;
    if (bag.lines.length === 0 || hasSoldOut) router.replace("/bag");
  }, [bag.hydrated, bag.lines.length, hasSoldOut, router]);

  useEffect(() => {
    if (!session || !checkout.hydrated) return;
    if (!checkout.state.values.email) checkout.setValues({ email: session.email });
    // Pre-select the account's default address the first time a signed-in shopper lands here.
    const fallback = account?.addresses.find((a) => a.id === account.defaultAddressId);
    if (!checkout.state.savedAddressId && fallback && !checkout.state.values.address1) handleSelectSaved(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, checkout.hydrated]);

  const requiredFields = checkout.state.deliveryMethod === "store" ? STORE_REQUIRED_FIELDS : SHIPPING_REQUIRED_FIELDS;
  const errors = useMemo(() => validateAll(checkout.state.values, requiredFields), [checkout.state.values, requiredFields]);
  const visibleErrors = useMemo(
    () => Object.fromEntries(Object.entries(errors).filter(([key]) => touched[key as FieldKey])) as Partial<Record<FieldKey, string>>,
    // Submit marks every required field touched; changing country un-touches its dependent fields (fresh errors).
    [errors, touched],
  );

  function handleBlur(field: FieldKey) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSelectSaved(address: SavedAddress | null) {
    checkout.setSavedAddressId(address?.id ?? null);
    if (address) {
      checkout.setValues({
        firstName: address.firstName,
        lastName: address.lastName,
        address1: address.address1,
        address2: address.address2 ?? "",
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
      });
    }
  }

  function handleSignOut() {
    signOut();
    checkout.setSavedAddressId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTouched(Object.fromEntries(requiredFields.map((f) => [f, true])) as Partial<Record<FieldKey, boolean>>);

    const firstInvalid = requiredFields.find((f) => errors[f]);
    if (firstInvalid || (checkout.state.deliveryMethod === "store" && !checkout.state.storeId)) {
      const target = firstInvalid ? document.getElementById(firstInvalid) : document.getElementById("delivery-method");
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    setTimeout(() => router.push("/checkout/payment"), 700);
  }

  const deliveryPrice = DELIVERY_PRICE[checkout.state.deliveryMethod];
  const deliveryLabel = deliveryPrice === 0 ? "Complimentary" : formatPrice(deliveryPrice);
  const total = Math.max(0, bag.subtotal - bag.discount + deliveryPrice);

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

  if (!bag.hydrated || bag.lines.length === 0 || hasSoldOut) {
    // A viewport tall until storage loads, so the footer starts below the fold instead of jumping (CLS).
    return <div className="min-h-svh" aria-hidden="true" />;
  }

  return (
    <div className="bg-bg pb-16">
      <div className="px-4 pt-6 desk:hidden">
        <SummaryToggle items={summaryItems} pieceCount={bag.count} subtotal={bag.subtotal} deliveryLabel={deliveryLabel} total={total} />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pb-0 pt-8 desk:flex-row desk:items-start desk:gap-12 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-16"
      >
        <div className="flex w-full flex-col items-start gap-10 desk:w-[744px]">
          <div className="flex w-full flex-col items-start gap-2">
            <p className="type-product-mobile text-ink desk:type-product">Delivery</p>
            <p className="type-italic text-accent-deep">Where should we send your pieces?</p>
          </div>

          {Object.keys(visibleErrors).length > 0 && (
            <ErrorSummary
              errors={visibleErrors}
              label={(f) => fieldLabel(f, checkout.state.values.country)}
              onJumpToField={(f) => {
                const el = document.getElementById(f);
                el?.focus();
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          )}

          <ContactSection
            email={checkout.state.values.email}
            emailOptIn={checkout.state.emailOptIn}
            error={visibleErrors.email}
            signedIn={!!session}
            onChange={(value) => checkout.setValues({ email: value })}
            onBlur={handleBlur}
            onOptInChange={checkout.setEmailOptIn}
          />

          {checkout.state.deliveryMethod !== "store" && (
            <AddressSection
              values={checkout.state.values}
              errors={visibleErrors}
              account={account}
              savedAddressId={checkout.state.savedAddressId}
              onSelectSaved={handleSelectSaved}
              onSignOut={handleSignOut}
              onChange={checkout.setValues}
              onBlur={handleBlur}
              onResetFields={(fields: FieldKey[]) => setTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, false])) }))}
            />
          )}

          <DeliveryMethodSection
            method={checkout.state.deliveryMethod}
            address={checkout.state.values}
            storeId={checkout.state.storeId}
            showStoreError={submitted}
            onMethodChange={checkout.setDeliveryMethod}
            onStoreChange={checkout.setStoreId}
          />

          <div className="flex w-full flex-col items-center gap-4 border-t border-line pt-8 desk:flex-row desk:gap-6">
            <button
              type="submit"
              disabled={loading}
              className="type-button flex h-[53px] w-full items-center justify-center gap-3 rounded-pill text-surface transition-colors focus-visible:outline-none focus-visible:border-2 focus-visible:border-accent-deep disabled:cursor-wait desk:w-auto bg-ink hover:bg-accent-deep"
            >
              {loading ? (
                <>
                  <span>Continue to payment</span>
                  <span className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-1 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <span>Continue to payment</span>
                  <ArrowIcon size={18} />
                </>
              )}
            </button>
            <p className="type-caption text-ink-muted">You won’t be charged yet.</p>
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
            taxNote="Calculated at next step"
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
    </div>
  );
}
