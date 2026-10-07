/**
 * "$295" for whole amounts, "$24.50" / "$374.50" whenever there are cents — never a single decimal.
 * Amounts are rounded to the cent first so float noise (24.499999…) can't leak through.
 */
export function formatPrice(price: number, currency: "USD" = "USD") {
  const cents = Math.round(price * 100);
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/** "Four" — Figma copy spells small counts out ("Four pieces, kept for later."); larger ones stay numeric. */
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);
