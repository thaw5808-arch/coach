import type { Metadata } from "next";
import { connection } from "next/server";
import { NewArrivalDesktop } from "@/components/new-arrivals/NewArrivalDesktop";
import { NewArrivalMobile } from "@/components/new-arrivals/NewArrivalMobile";
import { ogImagePath, pageMetadata } from "@/lib/seo";

// ?type= / ?sort= views canonicalise to the clean /new-arrivals.
export const metadata: Metadata = pageMetadata({
  title: "New Arrivals",
  description: "Twenty-four new pieces, cut from glove-tanned leather and finished by hand — the Autumn Chapter 2026 collection.",
  path: "/new-arrivals",
  image: ogImagePath("new-arrivals"),
  imageAlt: "New-season COACH bags on a pale blue stage",
});

export default async function NewArrivalsPage() {
  // Per-request render so ?type=/sort= filtered grids are server-rendered (the collection reads search params).
  await connection();
  return (
    <div className="bg-bg">
      <NewArrivalDesktop />
      <NewArrivalMobile />
    </div>
  );
}
