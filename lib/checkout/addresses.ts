export type AddressSuggestion = {
  /** ISO country code — suggestions only ever come from the selected country. */
  country: string;
  line1: string;
  city: string;
  /** Region code within the country ("NY", "10" = Bangkok); "" where the country has no regions. */
  state: string;
  zip: string;
};

/** Mock autocomplete source — no external API. Figma "Address — Autocomplete" (54:177). */
const MOCK_ADDRESSES: AddressSuggestion[] = [
  { country: "US", line1: "214 Mercer Street", city: "New York", state: "NY", zip: "10012" },
  { country: "US", line1: "214 Mercer Avenue", city: "Hoboken", state: "NJ", zip: "07030" },
  { country: "US", line1: "214 Mercer Road", city: "Princeton", state: "NJ", zip: "08540" },
  // No boutique addresses here (old store lines were real-looking — see lib/stores.ts).
  { country: "US", line1: "88 Greene Street", city: "New York", state: "NY", zip: "10012" },
  { country: "TH", line1: "991 Rama I Road", city: "Bangkok", state: "10", zip: "10330" },
  { country: "TH", line1: "999 Rama I Road", city: "Bangkok", state: "10", zip: "10330" },
  { country: "TH", line1: "1 Sukhumvit Road", city: "Bangkok", state: "10", zip: "10110" },
  { country: "TH", line1: "45 Nimmanhaemin Road", city: "Chiang Mai", state: "50", zip: "50200" },
  { country: "TH", line1: "18 Thaweewong Road", city: "Patong", state: "83", zip: "83150" },
  { country: "GB", line1: "1 Sloane Street", city: "London", state: "greater-london", zip: "SW1X 9LA" },
  { country: "GB", line1: "10 New Bond Street", city: "London", state: "greater-london", zip: "W1S 3SR" },
  { country: "CA", line1: "100 Bloor Street West", city: "Toronto", state: "ON", zip: "M5S 1M8" },
  { country: "AU", line1: "100 Collins Street", city: "Melbourne", state: "VIC", zip: "3000" },
  { country: "AU", line1: "52 Kellerman Lane", city: "Sydney", state: "NSW", zip: "2000" },
  { country: "JP", line1: "3-6-1 Ginza", city: "Chuo-ku", state: "13", zip: "104-0061" },
  { country: "SG", line1: "2 Orchard Turn", city: "Singapore", state: "", zip: "238801" },
  { country: "FR", line1: "10 Rue Saint-Honoré", city: "Paris", state: "", zip: "75001" },
  { country: "DE", line1: "10 Friedrichstraße", city: "Berlin", state: "", zip: "10117" },
];

const MIN_QUERY_LENGTH = 3;

export function searchAddresses(query: string, country: string): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];
  return MOCK_ADDRESSES.filter((a) => a.country === country && a.line1.toLowerCase().startsWith(q)).slice(0, 5);
}
