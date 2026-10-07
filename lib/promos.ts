export type Promo = { code: string; type: "percent" | "free-delivery"; value: number; description: string };

/** Mock promo list for the front-end-only checkout flow (Shopping Bag States & Overlays, 45:326). */
const promos: Promo[] = [
  { code: "AUTUMN10", type: "percent", value: 10, description: "10% off your order" },
  { code: "FREESHIP", type: "free-delivery", value: 0, description: "Free delivery" },
];

/** Codes that exist but no longer work, with the message Figma shows for each. */
const expiredCodes: Record<string, string> = {
  SPRING24: "This code has expired. Codes can’t be combined with gift cards.",
};

export type PromoResult = { ok: true; promo: Promo } | { ok: false; message: string };

export function validatePromo(input: string): PromoResult {
  const code = input.trim().toUpperCase();
  const expired = expiredCodes[code];
  if (expired) return { ok: false, message: expired };
  const promo = promos.find((p) => p.code === code);
  if (promo) return { ok: true, promo };
  return { ok: false, message: "We couldn’t find that code. Check it and try again." };
}

export function getPromoByCode(code: string): Promo | undefined {
  return promos.find((p) => p.code === code);
}
