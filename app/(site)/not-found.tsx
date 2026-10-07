import type { Metadata } from "next";
import { NotFoundContent } from "@/components/errors/NotFoundContent";

/** 404 responses also get `noindex` from Next automatically. */
export const metadata: Metadata = { title: "Page not found" };

/** notFound() inside the site (unknown product, malformed order number, dead shared wishlist) — header + footer stay. */
export default function SiteNotFound() {
  return (
    <>
      <NotFoundContent />
    </>
  );
}
