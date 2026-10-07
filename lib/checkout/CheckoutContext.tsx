"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_COUNTRY, migrateAddress } from "@/lib/address/countries";
import type { DeliveryFormValues } from "./validation";
import type { DeliveryMethod } from "./delivery";

export type PaymentMethod = "card" | "paypal" | "applepay";

export type BillingState = {
  sameAsDelivery: boolean;
  values: DeliveryFormValues;
};

export type CheckoutState = {
  values: DeliveryFormValues;
  emailOptIn: boolean;
  deliveryMethod: DeliveryMethod;
  storeId: string | null;
  savedAddressId: string | null;
  paymentMethod: PaymentMethod;
  billing: BillingState;
  giftCardCode: string | null;
};

const EMPTY_VALUES: DeliveryFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: DEFAULT_COUNTRY,
  phone: "",
};

const EMPTY_STATE: CheckoutState = {
  values: EMPTY_VALUES,
  emailOptIn: false,
  deliveryMethod: "standard",
  storeId: null,
  savedAddressId: null,
  paymentMethod: "card",
  billing: { sameAsDelivery: true, values: EMPTY_VALUES },
  giftCardCode: null,
};

const STORAGE_KEY = "coach.checkout.v1";

type CheckoutContextValue = {
  state: CheckoutState;
  hydrated: boolean;
  setValues: (values: Partial<DeliveryFormValues>) => void;
  setEmailOptIn: (optIn: boolean) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  setStoreId: (id: string | null) => void;
  setSavedAddressId: (id: string | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setBillingSameAsDelivery: (same: boolean) => void;
  setBillingValues: (values: Partial<DeliveryFormValues>) => void;
  setGiftCardCode: (code: string | null) => void;
  reset: () => void;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckoutState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CheckoutState>;
        setState((prev) => ({
          // migrateAddress: checkouts started before country/region codes stored full names.
          values: migrateAddress({ ...prev.values, ...parsed.values }),
          emailOptIn: parsed.emailOptIn ?? prev.emailOptIn,
          deliveryMethod: parsed.deliveryMethod ?? prev.deliveryMethod,
          storeId: parsed.storeId ?? prev.storeId,
          savedAddressId: parsed.savedAddressId ?? prev.savedAddressId,
          paymentMethod: parsed.paymentMethod ?? prev.paymentMethod,
          billing: parsed.billing
            ? { sameAsDelivery: parsed.billing.sameAsDelivery ?? true, values: migrateAddress({ ...prev.billing.values, ...parsed.billing.values }) }
            : prev.billing,
          giftCardCode: parsed.giftCardCode ?? prev.giftCardCode,
        }));
      }
    } catch {
      /* corrupted or unavailable storage — start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // Card number/expiry/CVC/name never enter this context, so there's nothing sensitive to persist here.
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — checkout still works for this page view */
    }
  }, [state, hydrated]);

  const setValues = useCallback((values: Partial<DeliveryFormValues>) => {
    setState((prev) => ({ ...prev, values: { ...prev.values, ...values } }));
  }, []);
  const setEmailOptIn = useCallback((optIn: boolean) => setState((prev) => ({ ...prev, emailOptIn: optIn })), []);
  const setDeliveryMethod = useCallback((method: DeliveryMethod) => setState((prev) => ({ ...prev, deliveryMethod: method })), []);
  const setStoreId = useCallback((id: string | null) => setState((prev) => ({ ...prev, storeId: id })), []);
  const setSavedAddressId = useCallback((id: string | null) => setState((prev) => ({ ...prev, savedAddressId: id })), []);
  const setPaymentMethod = useCallback((method: PaymentMethod) => setState((prev) => ({ ...prev, paymentMethod: method })), []);
  const setBillingSameAsDelivery = useCallback((same: boolean) => setState((prev) => ({ ...prev, billing: { ...prev.billing, sameAsDelivery: same } })), []);
  const setBillingValues = useCallback(
    (values: Partial<DeliveryFormValues>) => setState((prev) => ({ ...prev, billing: { ...prev.billing, values: { ...prev.billing.values, ...values } } })),
    [],
  );
  const setGiftCardCode = useCallback((code: string | null) => setState((prev) => ({ ...prev, giftCardCode: code })), []);
  const reset = useCallback(() => setState(EMPTY_STATE), []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      setValues,
      setEmailOptIn,
      setDeliveryMethod,
      setStoreId,
      setSavedAddressId,
      setPaymentMethod,
      setBillingSameAsDelivery,
      setBillingValues,
      setGiftCardCode,
      reset,
    }),
    [state, hydrated, setValues, setEmailOptIn, setDeliveryMethod, setStoreId, setSavedAddressId, setPaymentMethod, setBillingSameAsDelivery, setBillingValues, setGiftCardCode, reset],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used inside <CheckoutProvider>");
  return ctx;
}
