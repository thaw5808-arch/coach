import Link from "@/components/ui/SiteLink";

/** Figma "Checkout Footer" (Checkout Delivery 51:3 node 51:211 / 52:105 node 52:236). */
export function CheckoutFooterStrip() {
  return (
    <footer className="border-t border-line px-4 py-8 desk:px-[clamp(24px,6.667vw,96px)] desk:py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col-reverse items-center gap-3 desk:flex-row desk:items-center desk:justify-between">
        <p className="type-caption text-ink-muted">© 2026 Coach — concept study. Not affiliated.</p>
        <div className="type-caption flex gap-6 text-ink desk:gap-8">
          <Link href="/client-care#shipping" className="hover:text-accent-deep">
            Shipping &amp; Returns
          </Link>
          <span>Privacy</span>
          <span>Terms</span>
          <Link href="/client-care#contact" className="hover:text-accent-deep">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
