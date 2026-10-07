"use client";

import { useState, type FormEvent } from "react";
import { AddressFields } from "@/components/checkout/AddressFields";
import { FormField } from "@/components/checkout/FormField";
import { Button } from "@/components/ui/Button";
import { countryName, DEFAULT_COUNTRY, formatCityLine, normalisePostal } from "@/lib/address/countries";
import { useSession, type SavedAddress } from "@/lib/auth/SessionContext";
import { BILLING_REQUIRED_FIELDS, validateAll, type DeliveryFormValues, type FieldKey } from "@/lib/checkout/validation";

const EMPTY: DeliveryFormValues = { email: "", firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", zip: "", country: DEFAULT_COUNTRY, phone: "" };

function toValues(a: SavedAddress): DeliveryFormValues {
  return { ...EMPTY, firstName: a.firstName, lastName: a.lastName, address1: a.address1, address2: a.address2 ?? "", city: a.city, state: a.state, zip: a.zip, country: a.country };
}

/** Add / edit form — same fields + validation rules as checkout's delivery address (BILLING_REQUIRED_FIELDS = no email/phone). */
function AddressForm({ initial, onDone }: { initial: SavedAddress | null; onDone: () => void }) {
  const { saveAddress, account } = useSession();
  const [label, setLabel] = useState(initial?.label ?? (account?.addresses.length ? "" : "Home"));
  const [values, setValues] = useState<DeliveryFormValues>(
    initial ? toValues(initial) : { ...EMPTY, firstName: account?.firstName ?? "", lastName: account?.lastName ?? "" },
  );
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [labelError, setLabelError] = useState<string | undefined>();

  const errors = validateAll(values, BILLING_REQUIRED_FIELDS);
  // Submit touches every field; a country change un-touches region / postal code so their old errors go away.
  const visible = Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k as FieldKey])) as Partial<Record<FieldKey, string>>;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(Object.fromEntries(BILLING_REQUIRED_FIELDS.map((f) => [f, true])));
    const lErr = label.trim() ? undefined : "Give this address a name, like Home or Studio.";
    setLabelError(lErr);
    const firstInvalid = lErr ? "address-label" : BILLING_REQUIRED_FIELDS.find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid === "address-label" ? firstInvalid : `acct-${firstInvalid}`)?.focus();
      return;
    }
    saveAddress({
      id: initial?.id,
      label: label.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      address1: values.address1.trim(),
      address2: values.address2.trim() || undefined,
      city: values.city.trim(),
      state: values.state,
      zip: normalisePostal(values.zip, values.country),
      country: values.country,
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-start gap-5 rounded-[24px] bg-surface p-6 desk:p-8" aria-label={initial ? "Edit address" : "Add an address"}>
      <p className="type-h3 text-ink">{initial ? "Edit Address" : "Add an Address"}</p>
      <FormField
        id="address-label"
        label="Address name"
        placeholder="Home, Studio…"
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          setLabelError(undefined);
        }}
        error={labelError}
      />
      <AddressFields
        idPrefix="acct-"
        values={values}
        errors={visible}
        onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        onBlur={(f) => setTouched((t) => ({ ...t, [f]: true }))}
        onResetFields={(fields) => setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, false])) }))}
        showPhoneField={false}
      />
      <div className="flex w-full flex-col items-start gap-3 desk:flex-row desk:items-center desk:gap-6">
        <Button type="submit" showArrow={false} className="w-full desk:w-auto">
          {initial ? "Save address" : "Add address"}
        </Button>
        <Button type="button" variant="text" showArrow={false} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Account → Addresses. Not drawn in Figma beyond the overview card — built from its card + checkout's saved-address patterns. */
export function AddressBook() {
  const { account, deleteAddress, setDefaultAddress } = useSession();
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  if (!account) return null;

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <p className="type-eyebrow text-accent-deep">MY COACH</p>
        <h1 className="type-h1-mobile text-ink desk:type-h1">Addresses</h1>
        <p className="type-body text-ink-muted">Saved here, ready at checkout.</p>
      </div>

      {editing ? (
        <AddressForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <>
          {account.addresses.length === 0 && (
            <div className="flex w-full flex-col items-start gap-2 rounded-[24px] bg-surface p-6 desk:p-8">
              <p className="type-h3 text-ink">No saved addresses</p>
              <p className="type-caption text-ink-muted">Add one and it’ll be waiting for you at checkout.</p>
            </div>
          )}
          <ul className="grid w-full gap-4 desk:grid-cols-2 desk:gap-6">
            {account.addresses.map((a) => {
              const isDefault = a.id === account.defaultAddressId;
              return (
                <li key={a.id} data-address-id={a.id} className="flex flex-col items-start gap-2.5 rounded-[24px] bg-surface p-7">
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="type-badge text-accent-deep">{a.label.toUpperCase()}</p>
                    {isDefault && <span className="type-badge rounded-pill bg-blob px-3 py-1.5 text-accent-deep">DEFAULT</span>}
                  </div>
                  <div className="type-body flex-1 text-ink">
                    <p>
                      {a.firstName} {a.lastName}
                    </p>
                    <p>
                      {a.address1}
                      {a.address2 ? `, ${a.address2}` : ""}
                    </p>
                    <p>{formatCityLine(a)}</p>
                    <p className="text-ink-muted">{countryName(a.country)}</p>
                  </div>
                  {confirmDelete === a.id ? (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1" role="group" aria-label={`Delete ${a.label}?`}>
                      <p className="type-caption text-ink">Delete this address?</p>
                      <Button
                        variant="text"
                        showArrow={false}
                        onClick={() => {
                          deleteAddress(a.id);
                          setConfirmDelete(null);
                        }}
                        className="!text-error"
                      >
                        Delete
                      </Button>
                      <Button variant="text" showArrow={false} onClick={() => setConfirmDelete(null)}>
                        Keep
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                      <Button variant="text" showArrow={false} onClick={() => setEditing(a)} aria-label={`Edit ${a.label}`}>
                        Edit
                      </Button>
                      {!isDefault && (
                        <Button variant="text" showArrow={false} onClick={() => setDefaultAddress(a.id)} aria-label={`Set as default: ${a.label}`}>
                          Set as default
                        </Button>
                      )}
                      <Button variant="text" showArrow={false} onClick={() => setConfirmDelete(a.id)} aria-label={`Delete ${a.label}`}>
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" onClick={() => setEditing("new")}>
            Add an address
          </Button>
        </>
      )}
    </>
  );
}
