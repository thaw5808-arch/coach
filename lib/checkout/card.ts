export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export function detectBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "unknown";
}

export const BRAND_LABEL: Record<CardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", unknown: "Card" };

export function cardDigitLength(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

/** Strips non-digits and caps at the brand's digit length. */
export function sanitizeCardDigits(value: string, brand: CardBrand): string {
  return value.replace(/\D/g, "").slice(0, cardDigitLength(brand));
}

/** Formats digits into the brand's grouping — 4-6-5 for Amex, 4-4-4-4 otherwise. */
export function formatCardNumber(digits: string, brand: CardBrand): string {
  if (brand === "amex") {
    const groups = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean);
    return groups.join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function last4(digits: string): string {
  return digits.slice(-4);
}

export function maskedCardLabel(digits: string, brand: CardBrand): string {
  return `${BRAND_LABEL[brand]} ending in ${last4(digits)}`;
}

/** MM/YY → null (valid) or an error message. Not-in-the-past uses the end of the expiry month. */
export function validateExpiry(mmYy: string): string | null {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(mmYy.trim());
  if (!match) return "Enter the expiry as MM/YY.";
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return "Enter a valid month.";
  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59);
  if (expiry < now) return "This card has expired.";
  return null;
}

export function validateCardNumber(digits: string, brand: CardBrand): string | null {
  const expectedLength = cardDigitLength(brand);
  if (digits.length < expectedLength) return "This card number looks incomplete — check the digits.";
  if (!luhnValid(digits)) return "This card number doesn’t look right. Check the digits.";
  return null;
}

export function validateCvc(cvc: string, brand: CardBrand): string | null {
  const expected = cvcLength(brand);
  if (cvc.length !== expected) return `Enter the ${expected}-digit security code.`;
  return null;
}

/** Stripe's well-known "always declined" test number — used to demo the decline state. */
export const DECLINED_TEST_CARD = "4000000000000002";
