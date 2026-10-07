import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResultsView } from "@/components/search/SearchResultsView";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return {
    title: q ? `Search: "${q.slice(0, 60)}"` : "Search",
    description: "Search the COACH collection.",
    robots: { index: false, follow: false },
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-hidden="true" />}>
      <SearchResultsView />
    </Suspense>
  );
}
