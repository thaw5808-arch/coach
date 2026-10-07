import { getCountry, HOME_COUNTRY } from "@/lib/address/countries";

export type DeliveryMethod = "standard" | "express" | "store";

function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export const EXPRESS_CUTOFF_HOUR = 14;
/** "2pm" — the cut-off as customers read it (checkout copy + Client Care policies). */
export const EXPRESS_CUTOFF_LABEL = `${EXPRESS_CUTOFF_HOUR % 12 || 12}${EXPRESS_CUTOFF_HOUR < 12 ? "am" : "pm"}`;

/** Express cuts off at 2pm local time — matches the Figma "Disabled" example copy. */
export function isExpressAvailable(now: Date = new Date()): boolean {
  return now.getHours() < EXPRESS_CUTOFF_HOUR;
}

/** Business-day transit windows — domestic from the New York atelier, or tracked international. */
export function getTransitDays(country: string): { standard: [number, number]; express: [number, number] } {
  return country === HOME_COUNTRY || !country ? { standard: [2, 4], express: [1, 1] } : { standard: [5, 8], express: [2, 4] };
}

export function getDeliveryDetail(method: DeliveryMethod, address: { country: string; zip: string }, now: Date = new Date()) {
  const domestic = address.country === HOME_COUNTRY || !address.country;
  const { standard, express } = getTransitDays(address.country);
  const range = ([a, b]: [number, number]) => `${formatShortDate(addBusinessDays(now, a))} – ${formatShortDate(addBusinessDays(now, b))}`;
  if (method === "standard") {
    return domestic ? `Arrives ${range(standard)} · Signature on delivery` : `Arrives ${range(standard)} · Tracked, duties shown at payment`;
  }
  if (method === "express") {
    if (!isExpressAvailable(now)) {
      if (domestic) return `Unavailable for ZIP ${address.zip || "your area"} after ${EXPRESS_CUTOFF_LABEL} today`;
      return address.zip ? `Unavailable for ${getCountry(address.country).postal.label.toLowerCase()} ${address.zip} after 2pm today` : `Unavailable in your area after ${EXPRESS_CUTOFF_LABEL} today`;
    }
    return domestic ? `Arrives ${formatShortDate(addBusinessDays(now, express[0]))} if ordered before ${EXPRESS_CUTOFF_LABEL}` : `Arrives ${range(express)} if ordered before ${EXPRESS_CUTOFF_LABEL}`;
  }
  return "Choose a boutique below";
}

export const DELIVERY_PRICE: Record<DeliveryMethod, number> = { standard: 0, express: 25, store: 0 };
export const DELIVERY_TITLE: Record<DeliveryMethod, string> = { standard: "Standard Delivery", express: "Express Delivery", store: "Collect in Store" };
