import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/errors/NotFoundContent";

/** 404 responses also get `noindex` from Next automatically. */
export const metadata: Metadata = { title: "Page not found" };

/**
 * Unmatched URLs anywhere (rendered inside the root layout only, so it brings the site header + footer itself).
 * Next.js answers 404 and adds `noindex` automatically.
 */
export default function NotFound() {
  return (
    <div className="relative overflow-x-clip">
      <Header />
      <main id="main">
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}
