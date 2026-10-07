import type { ComponentProps } from "react";
import { TextField } from "@/components/ui/TextField";
import { Checkbox } from "@/components/ui/Checkbox";
import { BRAND_LABEL, cvcLength, detectBrand, formatCardNumber, sanitizeCardDigits } from "@/lib/checkout/card";
import type { DeliveryFormValues, FieldKey } from "@/lib/checkout/validation";
import { AddressFields } from "./AddressFields";
import { CvcHelpPopover } from "./CvcHelpPopover";

export type CardFormValues = { number: string; name: string; expiry: string; cvc: string };
export type CardFormErrors = Partial<Record<keyof CardFormValues, string>>;

function formatExpiry(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Figma "Card Form" (Checkout Payment 57:57) — number/name/expiry/CVC, with a nested billing address. */
export function CardForm({
  values,
  errors,
  touched,
  onChange,
  onBlur,
  billingSameAsDelivery,
  onBillingSameAsDeliveryChange,
  billingValues,
  billingErrors,
  onBillingChange,
  onBillingBlur,
  onBillingReset,
}: {
  values: CardFormValues;
  errors: CardFormErrors;
  touched: Partial<Record<keyof CardFormValues, boolean>>;
  onChange: (patch: Partial<CardFormValues>) => void;
  onBlur: (field: keyof CardFormValues) => void;
  billingSameAsDelivery: boolean;
  onBillingSameAsDeliveryChange: (same: boolean) => void;
  billingValues: DeliveryFormValues;
  billingErrors: Partial<Record<FieldKey, string>>;
  onBillingChange: (patch: Partial<DeliveryFormValues>) => void;
  onBillingBlur: (field: FieldKey) => void;
  onBillingReset?: (fields: FieldKey[]) => void;
}) {
  const brand = detectBrand(values.number);
  const visible = (field: keyof CardFormValues) => (touched[field] ? errors[field] : undefined);

  function field(
    id: string,
    label: string,
    value: string,
    onValueChange: (v: string) => void,
    blurField: keyof CardFormValues,
    extra?: Partial<ComponentProps<typeof TextField>>,
  ) {
    const error = visible(blurField);
    const errorId = `${id}-error`;
    return (
      <div className="flex w-full flex-col items-start gap-2">
        <label htmlFor={id} className="type-caption text-ink">
          {label}
        </label>
        <TextField
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={() => onBlur(blurField)}
          error={!!error}
          aria-describedby={error ? errorId : undefined}
          className="w-full"
          {...extra}
        />
        {error && (
          <p id={errorId} role="alert" className="type-caption text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-4 pt-2">
      {field(
        "card-number",
        "Card number",
        formatCardNumber(values.number, brand),
        (v) => {
          const digits = sanitizeCardDigits(v, detectBrand(v.replace(/\D/g, "")));
          onChange({ number: digits });
        },
        "number",
        {
          inputMode: "numeric",
          autoComplete: "cc-number",
          placeholder: "1234 5678 9012 3456",
          trailing: brand !== "unknown" ? <span className="type-caption shrink-0 pr-3 text-ink-muted">{BRAND_LABEL[brand]}</span> : undefined,
        },
      )}

      {field("card-name", "Name on card", values.name, (v) => onChange({ name: v }), "name", { autoComplete: "cc-name" })}

      <div className="flex w-full gap-4">
        {field("card-expiry", "Expiry (MM/YY)", values.expiry, (v) => onChange({ expiry: formatExpiry(v) }), "expiry", {
          inputMode: "numeric",
          autoComplete: "cc-exp",
          placeholder: "MM/YY",
        })}
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="card-cvc" className="type-caption text-ink">
              Security code
            </label>
            <CvcHelpPopover />
          </div>
          <TextField
            id="card-cvc"
            value={values.cvc}
            onChange={(e) => onChange({ cvc: e.target.value.replace(/\D/g, "").slice(0, cvcLength(brand)) })}
            onBlur={() => onBlur("cvc")}
            error={!!visible("cvc")}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "amex" ? "4 digits" : "3 digits"}
            aria-describedby={visible("cvc") ? "card-cvc-error" : undefined}
            className="w-full"
          />
          {visible("cvc") && (
            <p id="card-cvc-error" role="alert" className="type-caption text-error">
              {visible("cvc")}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-4 border-t border-line pt-4">
        <div className="flex items-center gap-2">
          <Checkbox checked={billingSameAsDelivery} onChange={onBillingSameAsDeliveryChange} label="Billing address same as delivery address" />
          <p className="type-body text-ink">Billing address same as delivery address</p>
        </div>
        {!billingSameAsDelivery && (
          <AddressFields idPrefix="billing-" values={billingValues} errors={billingErrors} onChange={onBillingChange} onBlur={onBillingBlur} onResetFields={onBillingReset} />
        )}
      </div>
    </div>
  );
}
