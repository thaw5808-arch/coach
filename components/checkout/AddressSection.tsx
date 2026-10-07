"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { DeliveryFormValues, FieldKey } from "@/lib/checkout/validation";
import { countryName, formatCityLine, HOME_COUNTRY } from "@/lib/address/countries";
import { addressTitle, type Account, type SavedAddress } from "@/lib/auth/SessionContext";
import { AddressFields } from "./AddressFields";

export function AddressSection({
  values,
  errors,
  account,
  savedAddressId,
  onSelectSaved,
  onSignOut,
  onChange,
  onBlur,
  onResetFields,
}: {
  values: DeliveryFormValues;
  errors: Partial<Record<FieldKey, string>>;
  account: Account | null;
  savedAddressId: string | null;
  onSelectSaved: (address: SavedAddress | null) => void;
  onSignOut: () => void;
  onChange: (patch: Partial<DeliveryFormValues>) => void;
  onBlur: (field: FieldKey) => void;
  onResetFields?: (fields: FieldKey[]) => void;
}) {
  const [editingSaved, setEditingSaved] = useState(false);
  const selectedSaved = account?.addresses.find((a) => a.id === savedAddressId) ?? null;
  const showManualFields = !account || !selectedSaved || editingSaved;

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <div className="flex w-full items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <p className="type-eyebrow text-accent-deep">02</p>
          <p className="type-h3 text-ink">Delivery Address</p>
        </div>
      </div>

      {account && (
        <div className="flex w-full flex-col items-start gap-3">
          <div className="flex w-full items-center justify-between">
            <p className="type-caption text-ink">Signed in as {account.email}</p>
            <button type="button" onClick={onSignOut} className="type-caption text-ink underline decoration-from-font">
              Not you?
            </button>
          </div>
          {account.addresses.map((address) => {
            const selected = address.id === savedAddressId;
            return (
              <label
                key={address.id}
                className={`flex min-h-[86px] w-full cursor-pointer items-center gap-4 rounded-[20px] border bg-surface py-5 pl-5 pr-6 ${
                  selected ? "border-[1.5px] border-ink" : "border-line hover:bg-blob"
                }`}
              >
                <input
                  type="radio"
                  name="saved-address"
                  className="sr-only"
                  checked={selected}
                  onChange={() => {
                    onSelectSaved(address);
                    setEditingSaved(false);
                  }}
                />
                <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-ink" : "border-ink-muted"}`}>
                  {selected && <span className="size-2.5 rounded-full bg-ink" />}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="type-h4 text-ink">{addressTitle(address)}</span>
                  <span className="type-caption text-ink-muted">
                    {address.address1}
                    {address.address2 ? `, ${address.address2}` : ""}, {formatCityLine(address)}
                    {address.country !== HOME_COUNTRY ? `, ${countryName(address.country)}` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectSaved(address);
                    setEditingSaved(true);
                  }}
                  className="type-caption text-ink underline decoration-from-font"
                >
                  Edit
                </button>
              </label>
            );
          })}
          <Button
            variant="text"
            showArrow={false}
            onClick={() => {
              onSelectSaved(null);
              setEditingSaved(true);
            }}
          >
            Add a new address
          </Button>
        </div>
      )}

      {showManualFields && (
        <AddressFields
          values={values}
          errors={errors}
          onChange={onChange}
          onBlur={onBlur}
          onResetFields={onResetFields}
          helperText="We’ll only call if there’s a question about your delivery."
        />
      )}
    </div>
  );
}
