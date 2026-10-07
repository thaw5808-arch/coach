import type { ComponentProps, ReactNode } from "react";
import { SelectField } from "@/components/ui/SelectField";
import {
  COUNTRY_LIST,
  getCountry,
  hasRegions,
  normalisePostal,
  regionLabel,
  regionRequired,
} from "@/lib/address/countries";
import type { AddressSuggestion } from "@/lib/checkout/addresses";
import type { DeliveryFormValues, FieldKey } from "@/lib/checkout/validation";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { FormField } from "./FormField";

/** Fields whose rules depend on the country — their "touched" state is reset when it changes. */
export const COUNTRY_DEPENDENT_FIELDS: FieldKey[] = ["state", "zip", "phone"];

/**
 * Shared street-address field group (name, country/phone, autocompleted address line, city/region/postal code).
 * Used by Delivery's shipping address, Payment's billing address and Account → Addresses.
 *
 * Everything country-specific (region list + label, postal label + rule, phone hint, autocomplete) comes from
 * lib/address/countries.ts. Layout responds to the width of the form itself (container queries), so the same
 * component fits the 744px checkout column, the 1024 two-column layout, the account panel and a 320px phone.
 */
export function AddressFields({
  values,
  errors,
  onChange,
  onBlur,
  onResetFields,
  idPrefix = "",
  showNameFields = true,
  showPhoneField = true,
  helperText,
}: {
  values: DeliveryFormValues;
  errors: Partial<Record<FieldKey, string>>;
  onChange: (patch: Partial<DeliveryFormValues>) => void;
  onBlur: (field: FieldKey) => void;
  /** Called with COUNTRY_DEPENDENT_FIELDS when the country changes, so the parent can clear their stale errors. */
  onResetFields?: (fields: FieldKey[]) => void;
  /** Namespaces field ids so this can render alongside another instance on the same page. */
  idPrefix?: string;
  showNameFields?: boolean;
  showPhoneField?: boolean;
  helperText?: string;
}) {
  const country = getCountry(values.country);
  const withRegion = hasRegions(country);

  function field(
    key: FieldKey,
    label: string,
    extra?: Partial<ComponentProps<typeof FormField>>,
  ) {
    return (
      <FormField
        label={label}
        id={`${idPrefix}${key}`}
        name={key}
        value={values[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
        onBlur={() => onBlur(key)}
        error={errors[key]}
        {...extra}
      />
    );
  }

  function handleCountryChange(code: string) {
    // New country → its own regions, postal rule and phone format: drop the old region and any stale errors.
    onChange({ country: code, state: "" });
    onResetFields?.(COUNTRY_DEPENDENT_FIELDS);
  }

  function handleAddressSelect(suggestion: AddressSuggestion) {
    onChange({
      address1: suggestion.line1,
      city: suggestion.city,
      state: suggestion.state,
      zip: suggestion.zip,
    });
  }

  const regionField = withRegion && (
    <SelectField
      label={
        regionRequired(country)
          ? regionLabel(country)
          : `${regionLabel(country)} — optional`
      }
      id={`${idPrefix}state`}
      name="state"
      value={values.state}
      onChange={(e) => onChange({ state: e.target.value })}
      onBlur={() => onBlur("state")}
      error={errors.state}
      autoComplete="address-level1"
    >
      <option value="">Select {regionLabel(country).toLowerCase()}</option>
      {country.region.kind === "list" &&
        country.region.regions.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      {country.region.kind === "groups" &&
        country.region.groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </optgroup>
        ))}
    </SelectField>
  );

  // The helper ("We'll only call…") is about the phone, so it travels with the Country / Phone row.
  const countryRow: ReactNode = (
    <>
      <Row>
        <SelectField
          label="Country"
          id={`${idPrefix}country`}
          name="country"
          value={values.country}
          onChange={(e) => handleCountryChange(e.target.value)}
          onBlur={() => onBlur("country")}
          error={errors.country}
          autoComplete="country"
        >
          {COUNTRY_LIST.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectField>
        {showPhoneField &&
          field("phone", "Phone", {
            type: "tel",
            autoComplete: "tel",
            inputMode: "tel",
            placeholder: country.phone.placeholder,
          })}
      </Row>
      {helperText && (
        <p className="type-caption text-ink-muted">{helperText}</p>
      )}
    </>
  );

  return (
    <div className="@container w-full">
      <div className="flex w-full flex-col items-start gap-4">
        {showNameFields && (
          <Row>
            {field("firstName", "First name", { autoComplete: "given-name" })}
            {field("lastName", "Last name", { autoComplete: "family-name" })}
          </Row>
        )}
        {/* Country first: it drives autocomplete, the region list, postal format and phone format below. */}
        {countryRow}
        <AddressAutocomplete
          idPrefix={idPrefix}
          country={values.country}
          value={values.address1}
          onChange={(v) => onChange({ address1: v })}
          onSelect={handleAddressSelect}
          onBlur={() => onBlur("address1")}
          error={errors.address1}
        />
        {field("address2", "Apartment, suite — optional", {
          placeholder: "Apartment, suite, floor",
        })}
        <div
          data-row="city-region-postal"
          className={
            withRegion
              ? "grid w-full grid-cols-1 gap-x-3 gap-y-4 @min-[420px]:grid-cols-[minmax(16.5rem,1.4fr)_minmax(7.5rem,1fr)] @min-[680px]:grid-cols-[minmax(0,1fr)_minmax(16.5rem,1.25fr)_minmax(0,0.75fr)] @min-[680px]:gap-x-4"
              : "grid w-full grid-cols-1 gap-x-3 gap-y-4 @min-[420px]:grid-cols-[minmax(0,2fr)_minmax(7.5rem,1fr)] @min-[680px]:gap-x-4"
          }
        >
          <div
            className={`min-w-0 ${withRegion ? "@min-[420px]:col-span-2 @min-[680px]:col-span-1" : ""}`}
          >
            {field("city", "City", { autoComplete: "address-level2" })}
          </div>
          {regionField && <div className="min-w-0">{regionField}</div>}
          <div className="min-w-0">
            {field("zip", country.postal.label, {
              autoComplete: "postal-code",
              placeholder: country.postal.example,
              onBlur: () => {
                const normalised = normalisePostal(values.zip, values.country);
                if (normalised !== values.zip) onChange({ zip: normalised });
                onBlur("zip");
              },
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Two equal columns when the form is ≥ 480px wide (Figma desktop), stacked below (Figma mobile). */
function Row({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 @min-[480px]:grid-cols-2 [&>*]:min-w-0">
      {children}
    </div>
  );
}
