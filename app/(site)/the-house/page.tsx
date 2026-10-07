import type { Metadata } from "next";
import { TheHouseView } from "@/components/the-house/TheHouseView";
import { stores, type DayHours } from "@/lib/stores";
import { SITE_URL, ogImagePath, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The House",
  description: "Our story since 1941, the craftsmanship behind every piece, our New York boutiques and careers at the workshop.",
  path: "/the-house",
  image: ogImagePath("the-house"),
  imageAlt: "COACH leather bags on a pale blue stage",
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const openingHours = (hours: DayHours[]) =>
  hours.flatMap((d, i) => (d ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_NAMES[i], opens: hhmm(d.open), closes: hhmm(d.close) }] : []));

/**
 * Concept-study structured data: a fictional organisation (no real logo, phone or social profiles) and one Store per
 * boutique with locality + hours only — street addresses are omitted because some Figma addresses look real.
 */
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "COACH — concept study",
    url: SITE_URL,
    description: "A design concept study of a leather-goods house. Not affiliated with any real brand.",
    foundingDate: "1941",
    email: "care@coach.example",
  },
  ...stores.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Store",
    name: s.name,
    url: `${SITE_URL}/the-house#stores`,
    address: { "@type": "PostalAddress", addressLocality: s.city, addressRegion: s.region, addressCountry: "US" },
    openingHoursSpecification: openingHours(s.hours),
  })),
];

export default function TheHousePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <TheHouseView />
    </>
  );
}
