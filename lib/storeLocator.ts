import { normalise } from "@/lib/search";
import { haversineMiles, stores, type Store } from "@/lib/stores";

/*
 * Store search without a geocoding service: a store matches on its own words (name, street, neighbourhood, city,
 * ZIP), and a few New York place names / ZIPs resolve to a point so nearby boutiques are listed by distance.
 */
type Place = { names: string[]; lat: number; lng: number };
const PLACES: Place[] = [
  { names: ["new york", "new york ny", "nyc", "ny", "manhattan"], lat: 40.7359, lng: -73.9911 },
  { names: ["soho", "10012", "10013", "greenwich village", "tribeca"], lat: 40.7233, lng: -74.003 },
  { names: ["midtown", "10022", "10019", "fifth avenue", "central park"], lat: 40.7586, lng: -73.9776 },
  { names: ["chelsea", "10001", "10011", "hudson yards", "west side"], lat: 40.7465, lng: -74.0014 },
  { names: ["brooklyn", "11201", "dumbo"], lat: 40.6937, lng: -73.9897 },
];
const RADII = [1, 2, 5, 10, 25];
export const NEARBY_MILES = 25;

export type LocatorResult = { store: Store; miles: number | null };
export type Locator = { results: LocatorResult[]; summary: string };

const storeWords = (s: Store) => normalise(`${s.shortName} ${s.name} ${s.street} ${s.neighbourhood} ${s.city} ${s.region} ${s.postalCode}`);

export function locateStores(query: string): Locator {
  const q = normalise(query);
  if (!q) return { results: stores.map((store) => ({ store, miles: null })), summary: `${stores.length} boutiques in New York` };
  const place = PLACES.find((p) => p.names.some((n) => n === q || (q.length >= 3 && n.startsWith(q))));
  if (place) {
    const results = stores
      .map((store) => ({ store, miles: haversineMiles(place, store) }))
      .filter((r) => r.miles <= NEARBY_MILES)
      .sort((a, b) => a.miles - b.miles);
    const max = Math.max(0, ...results.map((r) => r.miles));
    const radius = RADII.find((r) => max <= r) ?? NEARBY_MILES;
    return { results, summary: `${results.length} ${results.length === 1 ? "boutique" : "boutiques"} within ${radius} miles` };
  }
  const words = q.split(" ");
  const results = stores.filter((s) => words.every((w) => storeWords(s).split(" ").some((sw) => sw.startsWith(w)))).map((store) => ({ store, miles: null }));
  return { results, summary: `${results.length} ${results.length === 1 ? "boutique" : "boutiques"} matching “${query.trim()}”` };
}
