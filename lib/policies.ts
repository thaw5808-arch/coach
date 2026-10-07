import { HOME_COUNTRY } from "@/lib/address/countries";
import { DELIVERY_PRICE, EXPRESS_CUTOFF_LABEL, getTransitDays } from "@/lib/checkout/delivery";
import { formatPrice, numberWord } from "@/lib/format";
import { MANAGE_WINDOW_MS } from "@/lib/orderStatus";
import { stores } from "@/lib/stores";

/*
 * Customer-facing policies in one place. Everything that checkout actually does (prices, transit windows, the
 * express cut-off, the one-hour manage window) is read from the checkout's own modules, so Client Care, the product
 * page, the bag and checkout can never disagree.
 */

export const RETURN_DAYS = 30;
export const REFUND_BUSINESS_DAYS = 5;
export const PERSONALISATION_EXTRA_DAYS = 1;
export const DISPATCH_DAYS: [number, number] = [1, 2];
export const CARE_HOURS = "9am – 9pm";

/**
 * Client Care contact details. Deliberately fictional: 555-01xx numbers are reserved for fiction and `.example` is a
 * reserved domain — this concept site must never point at a real support line or inbox.
 */
export const CARE_CONTACT = { phone: "+1 212 555 0100", phoneHref: "tel:+12125550100", email: "care@coach.example", emailHref: "mailto:care@coach.example" };

/** "2pm" */
export const EXPRESS_CUTOFF = EXPRESS_CUTOFF_LABEL;
/** "one hour" — the edit / cancel window after placing an order (lib/orderStatus.ts). */
const MANAGE_HOURS = MANAGE_WINDOW_MS / 3_600_000;
export const MANAGE_WINDOW = `${numberWord(MANAGE_HOURS).toLowerCase()} hour${MANAGE_HOURS === 1 ? "" : "s"}`;

const priceLabel = (n: number) => (n === 0 ? "Complimentary" : formatPrice(n));
const range = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);
const days = (r: [number, number]) => `${range(r)} business day${r[1] === 1 ? "" : "s"}`;

export type PolicyRow = { key: string; title: string; detail: string; price: string };

/** Figma "Shipping & Returns — Detail" (98:271) delivery rows — the same methods, prices and timings as checkout. */
export function deliveryRows(): PolicyRow[] {
  const home = getTransitDays(HOME_COUNTRY);
  const abroad = getTransitDays("TH"); // any non-home country — international windows are shared
  // "Ready today by 4pm" / "Ready tomorrow" → "today or tomorrow"
  const readiness = [...new Set(stores.map((s) => s.readiness.replace(/^ready\s+/i, "").replace(/ by .*/, "").toLowerCase()))];
  return [
    { key: "standard", title: "Standard", detail: days(home.standard), price: priceLabel(DELIVERY_PRICE.standard) },
    {
      key: "express",
      title: "Express",
      detail: home.express[1] === 1 ? `Next business day, order before ${EXPRESS_CUTOFF}` : `${days(home.express)}, order before ${EXPRESS_CUTOFF}`,
      price: priceLabel(DELIVERY_PRICE.express),
    },
    { key: "international", title: "International", detail: `Tracked, ${days(abroad.standard)}`, price: priceLabel(DELIVERY_PRICE.standard) },
    { key: "store", title: "Collect in Store", detail: `Ready ${readiness.join(" or ")}`, price: priceLabel(DELIVERY_PRICE.store) },
  ];
}

export const RETURN_STEPS = [
  "Start a return in your account or from your delivery email.",
  "Pack the piece in its dust bag and original box.",
  `Drop it at any courier point within ${RETURN_DAYS} days — it’s free.`,
  `Refunds reach your card within ${REFUND_BUSINESS_DAYS} business days of arrival.`,
];

/** Short lines reused across the site. */
export const POLICY_COPY = {
  freeReturns: `Free returns within ${RETURN_DAYS} days`,
  careHours: `Questions? Client Care, ${CARE_HOURS} daily`,
  ships: `Ships in ${days(DISPATCH_DAYS)}`,
  deliveryReturns: `${priceLabel(DELIVERY_PRICE.standard)} delivery in ${days(getTransitDays(HOME_COUNTRY).standard)}. Returns are free within ${RETURN_DAYS} days of delivery.`,
  personalisedFinal: "Personalised pieces can’t be returned unless they arrive damaged.",
};
