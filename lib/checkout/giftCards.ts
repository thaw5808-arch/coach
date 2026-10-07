export type GiftCard = { code: string; last4: string; balance: number };

/** Mock gift card list — no external API. Figma "State / Gift Card — Applied" (59:133). */
const GIFT_CARDS: GiftCard[] = [
  { code: "COACH-GIFT-7712", last4: "7712", balance: 100 },
  { code: "COACH-GIFT-3390", last4: "3390", balance: 45.5 },
];

export type GiftCardResult = { ok: true; card: GiftCard } | { ok: false; message: string };

export function validateGiftCard(input: string): GiftCardResult {
  const code = input.trim().toUpperCase();
  const card = GIFT_CARDS.find((c) => c.code === code || c.code.endsWith(code));
  if (!card) return { ok: false, message: "We couldn’t find that gift card. Check the code and try again." };
  return { ok: true, card };
}
