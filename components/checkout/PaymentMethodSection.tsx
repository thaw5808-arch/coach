import type { ReactNode } from "react";
import type { PaymentMethod } from "@/lib/checkout/CheckoutContext";

const METHOD_LABEL: Record<PaymentMethod, string> = { card: "Credit or Debit Card", paypal: "PayPal", applepay: "Apple Pay" };
const METHOD_DETAIL: Record<PaymentMethod, string> = {
  card: "Visa, Mastercard, American Express",
  paypal: "You’ll be redirected to PayPal to complete payment (simulated)",
  applepay: "Pay with Face ID or Touch ID (simulated)",
};
const METHODS: PaymentMethod[] = ["card", "paypal", "applepay"];

/** Figma "Payment Method Selector" (Checkout Payment 57:57) — Card / PayPal / Apple Pay, simulated only. */
export function PaymentMethodSection({ method, onMethodChange, cardForm }: { method: PaymentMethod; onMethodChange: (m: PaymentMethod) => void; cardForm: ReactNode }) {
  return (
    <div id="payment-method" tabIndex={-1} className="flex w-full flex-col items-start gap-5 focus:outline-none">
      <div className="flex items-baseline gap-3">
        <p className="type-eyebrow text-accent-deep">02</p>
        <p className="type-h3 text-ink">Payment Method</p>
      </div>

      <div className="flex w-full flex-col items-start gap-3">
        {METHODS.map((m) => {
          const selected = method === m;
          return (
            <div key={m} className={`flex w-full flex-col rounded-[20px] border bg-surface ${selected ? "border-[1.5px] border-ink" : "border-line"}`}>
              <label className="flex min-h-[86px] w-full cursor-pointer items-center gap-4 py-5 pl-5 pr-6">
                <input type="radio" name="payment-method" checked={selected} onChange={() => onMethodChange(m)} className="sr-only" />
                <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-ink" : "border-ink-muted"}`}>
                  {selected && <span className="size-2.5 rounded-full bg-ink" />}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="type-h4 text-ink">{METHOD_LABEL[m]}</span>
                  <span className="type-caption text-ink-muted">{METHOD_DETAIL[m]}</span>
                </span>
              </label>
              {m === "card" && selected && <div className="px-5 pb-6">{cardForm}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
