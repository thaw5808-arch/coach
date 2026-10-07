import { getCountry, hasRegions, isKnownCountry, isValidPhone, regionLabel, regionRequired, regionsOf } from "@/lib/address/countries";

/** `country` is an ISO code ("TH"), `state` the region code within it ("10" = Bangkok), `zip` the postal code. */
export type DeliveryFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export type FieldKey = keyof DeliveryFormValues;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** One validation rule set per field, reused by Delivery, Payment (billing) and Account → Addresses.
 * Region, postal-code and phone rules come from the selected country (lib/address/countries.ts). */
const rules: Partial<Record<FieldKey, (value: string, values: DeliveryFormValues) => string | null>> = {
  email: (v) => (!v.trim() ? "Please enter your email address." : !EMAIL_RE.test(v.trim()) ? "Enter a valid email address." : null),
  firstName: (v) => (!v.trim() ? "Please enter your first name." : null),
  lastName: (v) => (!v.trim() ? "Please enter your last name." : null),
  address1: (v) => (!v.trim() ? "Please enter a street address." : null),
  city: (v) => (!v.trim() ? "Please enter a city." : null),
  state: (v, values) => {
    const country = getCountry(values.country);
    if (!hasRegions(country)) return null;
    const label = regionLabel(country).toLowerCase();
    if (!v) return regionRequired(country) ? `Please select a ${label}.` : null;
    return regionsOf(country).some((r) => r.code === v) ? null : `Please select a ${label}.`;
  },
  zip: (v, values) => {
    const { postal } = getCountry(values.country);
    if (!v.trim()) return `Please enter a ${postal.label === "ZIP code" ? "ZIP or postal code" : postal.label.toLowerCase()}.`;
    return postal.pattern.test(v.trim()) ? null : postal.invalid;
  },
  country: (v) => (!v.trim() ? "Please select a country." : !isKnownCountry(v) ? "We don’t deliver to this country yet." : null),
  phone: (v, values) => {
    if (!v.trim()) return "Please enter a phone number.";
    const { phone, name } = getCountry(values.country);
    return isValidPhone(v, values.country) ? null : `Enter a valid ${name} number, like ${phone.placeholder} or with +${phone.dial}.`;
  },
};

const BASE_LABELS: Record<FieldKey, string> = {
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  address1: "Address",
  address2: "Apartment, suite",
  city: "City",
  state: "State",
  zip: "ZIP code",
  country: "Country",
  phone: "Phone",
};

/** Field labels follow the country: State / Province / Prefecture / County, ZIP code / Postal code / Postcode. */
export function fieldLabel(key: FieldKey, countryCode: string): string {
  const country = getCountry(countryCode);
  if (key === "state") return regionLabel(country) || BASE_LABELS.state;
  if (key === "zip") return country.postal.label;
  return BASE_LABELS[key];
}

/** Fields validated for the "Collect in Store" method — no shipping address needed. */
export const STORE_REQUIRED_FIELDS: FieldKey[] = ["email", "firstName", "lastName", "phone"];
export const SHIPPING_REQUIRED_FIELDS: FieldKey[] = ["email", "firstName", "lastName", "address1", "city", "state", "zip", "country", "phone"];
/** Billing address (Payment step) — no email/phone, those come from the contact step. */
export const BILLING_REQUIRED_FIELDS: FieldKey[] = ["firstName", "lastName", "address1", "city", "state", "zip", "country"];

export function validateField(key: FieldKey, values: DeliveryFormValues): string | null {
  const rule = rules[key];
  return rule ? rule(values[key], values) : null;
}

export function validateAll(values: DeliveryFormValues, requiredFields: FieldKey[]): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const key of requiredFields) {
    const message = validateField(key, values);
    if (message) errors[key] = message;
  }
  return errors;
}

export function isComplete(values: DeliveryFormValues, requiredFields: FieldKey[]): boolean {
  return Object.keys(validateAll(values, requiredFields)).length === 0;
}
