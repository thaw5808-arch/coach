import { products } from "@/lib/products";
import { MANAGE_WINDOW, PERSONALISATION_EXTRA_DAYS, POLICY_COPY, RETURN_DAYS } from "@/lib/policies";
import { numberWord } from "@/lib/format";

/** Hash anchors other pages link to (footer, checkout strip, bag, order page, search, Women "Make It Yours"). */
export type CarePanel = "contact" | "shipping" | "leather-care";

export type FaqCategory = { key: string; label: string; hash: string };
export type Faq = { id: string; category: string; question: string; answer: string };

/** Figma "Categories" (97:389) — each opens its question; Personalisation also answers `#personalisation`. */
export const FAQ_CATEGORIES: FaqCategory[] = [
  { key: "orders", label: "Orders", hash: "faq-orders" },
  { key: "delivery", label: "Delivery & Returns", hash: "faq-delivery" },
  { key: "personalisation", label: "Personalisation", hash: "personalisation" },
  { key: "care", label: "Care & Repair", hash: "faq-care" },
  { key: "payments", label: "Payments", hash: "faq-payments" },
];

const extra = PERSONALISATION_EXTRA_DAYS;

/** Figma "Questions" (97:400) — answers read the same policy values checkout uses. */
export const FAQS: Faq[] = [
  {
    id: "faq-orders",
    category: "orders",
    question: "Can I change or cancel my order?",
    answer: `You can edit or cancel within ${MANAGE_WINDOW} of placing an order from your confirmation email or your account. After that, Client Care can help with delivery changes.`,
  },
  {
    id: "personalisation",
    category: "personalisation",
    question: "How long does personalisation take?",
    answer: `Hot-stamped initials add ${numberWord(extra).toLowerCase()} business day${extra === 1 ? "" : "s"}. ${POLICY_COPY.personalisedFinal}`,
  },
  {
    id: "faq-care",
    category: "care",
    question: "Do you repair Coach bags?",
    answer: "Yes — our artisans clean, condition and repair any Coach piece. Bring it to a boutique or book a mail-in repair.",
  },
  {
    id: "faq-payments",
    category: "payments",
    question: "Which payment methods do you accept?",
    answer: "Visa, Mastercard, American Express, PayPal, Apple Pay and Coach gift cards.",
  },
  {
    id: "faq-delivery",
    category: "delivery",
    question: "How do I return a piece?",
    answer: `Start a return in your account or with the link in your delivery email. Drop it at any courier point within ${RETURN_DAYS} days — returns are free.`,
  },
];

/** Pieces that take hot-stamped initials (product data `personalise: true`). */
export const PERSONALISABLE = products.filter((p) => p.personalise);

/** Figma "Leather Care — Guide" (98:307). */
export const CARE_GUIDE = [
  { n: "01", title: "Let It Breathe", body: "Store your bag in its dust bag, lightly stuffed, away from direct sunlight and heat." },
  { n: "02", title: "Treat Gently", body: "Wipe with a soft, dry cloth. Avoid water, alcohol and household cleaners." },
  { n: "03", title: "Return to Us", body: "Our artisans clean, condition and repaint edges — complimentary, for life." },
];

// ───────────────────────── contact form ─────────────────────────

export type ContactTopic = "order" | "delivery" | "personalisation" | "care" | "other";
export const CONTACT_TOPICS: { key: ContactTopic; label: string; needsOrder: boolean }[] = [
  { key: "order", label: "An existing order", needsOrder: true },
  { key: "delivery", label: "Delivery & returns", needsOrder: true },
  { key: "personalisation", label: "Personalisation", needsOrder: false },
  { key: "care", label: "Care & repair", needsOrder: false },
  { key: "other", label: "Something else", needsOrder: false },
];

export type ContactValues = { topic: ContactTopic | ""; orderNumber: string; name: string; email: string; message: string };
export type ContactField = keyof ContactValues;
export const CONTACT_LABELS: Record<ContactField, string> = { topic: "Topic", orderNumber: "Order number", name: "Name", email: "Email", message: "Message" };
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 1000;

/** Order ids from lib/orders.ts: "CO-" + 6 of A–Z (no I/O) and 2–9. */
export const ORDER_NUMBER_RE = /^CO-[A-HJ-NP-Z2-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(v: ContactValues): Partial<Record<ContactField, string>> {
  const e: Partial<Record<ContactField, string>> = {};
  if (!v.topic) e.topic = "Please choose a topic.";
  const topic = CONTACT_TOPICS.find((t) => t.key === v.topic);
  if (topic?.needsOrder && v.orderNumber.trim() && !ORDER_NUMBER_RE.test(v.orderNumber.trim().toUpperCase()))
    e.orderNumber = "Order numbers look like CO-7K2M9Q — check your confirmation email.";
  if (!v.name.trim()) e.name = "Please enter your name.";
  if (!v.email.trim()) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (v.message.trim().length < MESSAGE_MIN) e.message = `Tell us a little more — at least ${MESSAGE_MIN} characters.`;
  return e;
}

export type ContactSubmission = ContactValues & { reference: string; createdAt: string };
const CONTACT_KEY = "coach.contact.v1";

/** Stored on this device only — there is no support inbox behind this concept site. */
export function saveContact(values: ContactValues): ContactSubmission {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const reference = `CC-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
  const entry: ContactSubmission = { ...values, orderNumber: values.orderNumber.trim().toUpperCase(), reference, createdAt: new Date().toISOString() };
  try {
    const list = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "[]") as ContactSubmission[];
    localStorage.setItem(CONTACT_KEY, JSON.stringify([...(Array.isArray(list) ? list : []), entry]));
  } catch {
    /* storage blocked — the confirmation still shows */
  }
  return entry;
}
