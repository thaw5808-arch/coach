import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { getProductById } from "@/lib/products";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The pieces you’ve saved for later.",
  robots: { index: false, follow: false },
};

export default async function WishlistPage({ searchParams }: { searchParams: Promise<{ items?: string | string[] }> }) {
  // A shared link (?items=) where nothing is a real product → a real 404 with the shared not-found design.
  const items = (await searchParams).items;
  if (items !== undefined && !String(items).split(",").some((id) => getProductById(id.trim()))) notFound();
  return (
    <Suspense fallback={<div className="min-h-svh" aria-hidden="true" />}>
      <WishlistView />
    </Suspense>
  );
}
