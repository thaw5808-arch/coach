import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Crawl everything public. Bag / checkout / order / account / wishlist / search are kept out of the index with a
 * `noindex` robots meta instead of a Disallow — a disallowed URL can't be fetched, so its noindex is never seen and the
 * bare URL can still be indexed from links (every header links to the bag, account and wishlist).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/__test/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
