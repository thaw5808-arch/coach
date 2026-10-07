import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

/**
 * Indexable pages only — every page here has a canonical URL and its own OG card. The noindex routes (bag, checkout,
 * order, account, wishlist, search) and the dev-only /__test/* hooks are left out on purpose.
 */
const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/new-arrivals", priority: 0.9, changeFrequency: "daily" },
  { path: "/women", priority: 0.9, changeFrequency: "weekly" },
  { path: "/men", priority: 0.9, changeFrequency: "weekly" },
  { path: "/bags", priority: 0.9, changeFrequency: "weekly" },
  { path: "/the-house", priority: 0.5, changeFrequency: "monthly" },
  { path: "/client-care", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
