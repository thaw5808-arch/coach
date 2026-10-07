/*
 * Boutiques — one list for Checkout "Collect in Store", order pages, Client Care and The House locator / booking.
 *
 * Concept data. Names, neighbourhoods and hours follow Figma (The House 99:408 / 100:173); the street addresses are
 * deliberately invented (no such streets) so nothing points at a real boutique. No phone numbers, no maps links, and
 * streets stay out of structured data.
 */

/** Minutes from midnight; `null` = closed that day. Index 0 = Sunday. */
export type DayHours = { open: number; close: number } | null;
export type AppointmentService = "styling" | "repair" | "personalisation";

export type Store = {
  id: string;
  /** Full name used in checkout / order confirmation. */
  name: string;
  /** Short name used on The House cards, locator and booking. */
  shortName: string;
  /** "48 Linden Mews, New York" — checkout / order line. */
  address: string;
  /** "48 Linden Mews, SoHo" — The House line. */
  street: string;
  neighbourhood: string;
  city: string;
  region: string;
  postalCode: string;
  /** Approximate map position (for the locator illustration and distance sorting only). */
  lat: number;
  lng: number;
  readiness: string;
  hours: DayHours[];
  services: AppointmentService[];
  /** Appointment slots: every `stepMinutes`, from `firstAfterOpen` after opening until `lastBeforeClose` before closing. */
  appointments: { stepMinutes: number; firstAfterOpen: number; lastBeforeClose: number; daysAhead: number };
};

const h = (open: number, close: number): DayHours => ({ open: open * 60, close: close * 60 });
const SLOTS = { stepMinutes: 90, firstAfterOpen: 60, lastBeforeClose: 90, daysAhead: 14 };

export const stores: Store[] = [
  {
    id: "mercer-street",
    name: "Mercer Street Boutique",
    shortName: "Mercer Street",
    address: "48 Linden Mews, New York",
    street: "48 Linden Mews, SoHo",
    neighbourhood: "SoHo",
    city: "New York",
    region: "NY",
    postalCode: "10012",
    lat: 40.7262,
    lng: -73.9967,
    readiness: "Ready today by 4pm",
    // Closed Sundays (not in Figma — a concept assumption so bookings can show a closed day).
    hours: [null, h(10, 20), h(10, 20), h(10, 20), h(10, 20), h(10, 20), h(10, 20)],
    services: ["styling", "repair", "personalisation"],
    appointments: SLOTS,
  },
  {
    id: "fifth-avenue",
    name: "Fifth Avenue Boutique",
    shortName: "Fifth Avenue",
    address: "9 Halloway Place, New York",
    street: "9 Halloway Place, Midtown",
    neighbourhood: "Midtown",
    city: "New York",
    region: "NY",
    postalCode: "10022",
    lat: 40.7605,
    lng: -73.9749,
    readiness: "Ready tomorrow",
    hours: [h(11, 19), h(10, 21), h(10, 21), h(10, 21), h(10, 21), h(10, 21), h(10, 21)],
    services: ["styling", "repair", "personalisation"],
    appointments: SLOTS,
  },
  {
    id: "hudson-yards",
    name: "Hudson Yards Boutique",
    shortName: "Hudson Yards",
    address: "3 Wharfside Row, New York",
    street: "3 Wharfside Row, Level 2",
    neighbourhood: "Hudson Yards",
    city: "New York",
    region: "NY",
    postalCode: "10001",
    lat: 40.7537,
    lng: -74.0016,
    readiness: "Ready tomorrow",
    hours: [h(11, 19), h(10, 20), h(10, 20), h(10, 20), h(10, 20), h(10, 20), h(10, 20)],
    services: ["styling", "personalisation"],
    appointments: SLOTS,
  },
];

export function getStoreById(id: string) {
  return stores.find((s) => s.id === id);
}

/** Checkout lists distances from Manhattan's centre (no geolocation there). */
export const CITY_CENTRE = { lat: 40.7359, lng: -73.9911 };

/** Great-circle distance in miles. */
export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const distanceLabel = (miles: number) => `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;

/** "10am", "8pm", "12:30pm" */
export function formatMinutes(min: number, withSuffix = true): string {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  const h12 = hh % 12 || 12;
  return `${h12}${mm ? `:${String(mm).padStart(2, "0")}` : withSuffix ? "" : ":00"}${withSuffix ? (hh < 12 ? "am" : "pm") : ""}`;
}

export const hoursLabel = (d: DayHours) => (d ? `${formatMinutes(d.open)} – ${formatMinutes(d.close)}` : "Closed");

/** "Open · closes 8pm" / "Closed · opens 10am tomorrow" — Figma locator status line. */
export function openStatus(store: Store, now: Date): { open: boolean; label: string } {
  const today = store.hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (today && mins >= today.open && mins < today.close) return { open: true, label: `Open · closes ${formatMinutes(today.close)}` };
  if (today && mins < today.open) return { open: false, label: `Closed · opens ${formatMinutes(today.open)}` };
  for (let i = 1; i <= 7; i++) {
    const day = store.hours[(now.getDay() + i) % 7];
    if (day) return { open: false, label: `Closed · opens ${formatMinutes(day.open)} ${i === 1 ? "tomorrow" : new Date(now.getTime() + i * 864e5).toLocaleDateString("en-US", { weekday: "long" })}` };
  }
  return { open: false, label: "Closed" };
}

/** Bookable start times (minutes) for a store on a given date; past times today are dropped. */
export function appointmentSlots(store: Store, date: Date, now: Date = new Date()): number[] {
  const day = store.hours[date.getDay()];
  if (!day) return [];
  const { stepMinutes, firstAfterOpen, lastBeforeClose } = store.appointments;
  const slots: number[] = [];
  for (let t = day.open + firstAfterOpen; t <= day.close - lastBeforeClose; t += stepMinutes) slots.push(t);
  const sameDay = date.toDateString() === now.toDateString();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return sameDay ? slots.filter((t) => t > nowMins + 60) : slots;
}

/** One deterministic "already booked" slot per store and day, so availability looks real without a server. */
export function isSlotTaken(store: Store, date: Date, minutes: number): boolean {
  const seed = [...`${store.id}${date.toDateString()}`].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const slots = appointmentSlots(store, date, new Date(0));
  return slots.length > 2 && slots[seed % slots.length] === minutes;
}
