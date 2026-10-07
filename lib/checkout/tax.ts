import { HOME_COUNTRY } from "@/lib/address/countries";

/**
 * Estimated tax — a reasonable approximation, not a real tax service. US orders use a state sales-tax table
 * (region codes); international orders use that country's headline VAT / GST / consumption-tax rate.
 */
const US_RATE_BY_STATE: Record<string, number> = {
  NY: 0.08875,
  NJ: 0.06625,
  CA: 0.0725,
  IL: 0.0625,
  TX: 0.0625,
};
const US_DEFAULT_RATE = 0.07;

const RATE_BY_COUNTRY: Record<string, { rate: number; label: string }> = {
  TH: { rate: 0.07, label: "VAT" },
  GB: { rate: 0.2, label: "VAT" },
  CA: { rate: 0.05, label: "GST" },
  AU: { rate: 0.1, label: "GST" },
  JP: { rate: 0.1, label: "Consumption tax" },
  SG: { rate: 0.09, label: "GST" },
  FR: { rate: 0.2, label: "VAT" },
  DE: { rate: 0.19, label: "VAT" },
};
/** Any country added to lib/address/countries.ts without a rate here still gets a sensible estimate. */
const INTERNATIONAL_DEFAULT = { rate: 0.1, label: "Duties & taxes" };

export type TaxInfo = { rate: number; label: string };

/** `country` / `region` are codes; Collect in Store (a New York boutique) passes the home country and no region. */
export function getTax(country: string, region: string): TaxInfo {
  if (!country || country === HOME_COUNTRY) return { rate: US_RATE_BY_STATE[region] ?? US_DEFAULT_RATE, label: "Tax" };
  return RATE_BY_COUNTRY[country] ?? INTERNATIONAL_DEFAULT;
}

export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(3).replace(/\.?0+$/, "")}%`;
}

/** "Tax (8.875%)" / "VAT (7%)" */
export const taxLabel = (t: TaxInfo) => `${t.label} (${formatTaxRate(t.rate)})`;

export function calculateTax(taxableAmount: number, tax: TaxInfo): number {
  return Math.round(taxableAmount * tax.rate * 100) / 100;
}
