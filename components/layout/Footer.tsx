"use client";

import Link from "@/components/ui/SiteLink";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { EmailField } from "@/components/ui/EmailField";
import { PlusIcon } from "@/components/ui/Icons";

const shopLinks = [
  { label: "New Arrival", href: "/new-arrivals" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Bags", href: "/bags" },
];
const clientCareLinks = [
  { label: "Contact Us", href: "/client-care#contact" },
  { label: "Shipping & Returns", href: "/client-care#shipping" },
  { label: "Leather Care", href: "/client-care#leather-care" },
  { label: "FAQ", href: "/client-care#faq" },
];
const houseLinks = [
  { label: "Our Story", href: "/the-house#story" },
  { label: "Craftsmanship", href: "/the-house#craftsmanship" },
  { label: "Stores", href: "/the-house#stores" },
  { label: "Careers", href: "/the-house#careers" },
];
const socials = ["Instagram", "Pinterest", "YouTube"];

function LinkColumn({ title, links }: { title: string; links: typeof shopLinks }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="type-eyebrow text-ink">{title}</p>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="type-body text-ink-muted hover:text-ink">
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function MobileAccordion({ title, links }: { title: string; links: typeof shopLinks }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-14 w-full items-center justify-between"
      >
        <span className="type-eyebrow text-ink">{title}</span>
        <PlusIcon size={16} className={`text-ink transition-transform duration-150 ${open ? "rotate-45" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col items-start gap-4 pb-5">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="type-body text-ink-muted hover:text-ink">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Figma "Footer / Desktop" (14:7) + mobile accordion footer (103:1407). Hidden on Home (103:29), which has no footer. */
export function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="bg-surface">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-[1440px] flex-col gap-16 px-[clamp(24px,6.667vw,96px)] pb-12 pt-24 desk:flex">
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-start gap-5">
            <Link href="/" className="type-logo text-ink">
              COACH
            </Link>
            <p className="type-italic text-accent-deep">Carried through every chapter.</p>
            <EmailField className="w-[380px]" />
            <p className="type-caption text-ink-muted">Early access to every new chapter. No noise, ever.</p>
          </div>
          <div className="flex gap-24">
            <LinkColumn title="SHOP" links={shopLinks} />
            <LinkColumn title="CLIENT CARE" links={clientCareLinks} />
            <LinkColumn title="THE HOUSE" links={houseLinks} />
          </div>
        </div>
        <div className="flex items-start justify-between border-t border-line pt-6">
          <p className="type-caption text-ink-muted">© 2026 Coach — concept study. Not affiliated.</p>
          <div className="flex gap-8">
            {socials.map((s) => (
              <span key={s} className="type-caption text-ink">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col items-start gap-8 px-4 pb-8 pt-12 desk:hidden">
        <div className="flex w-full flex-col items-start gap-3">
          <Link href="/" className="type-logo text-ink">
            COACH
          </Link>
          <p className="type-italic text-accent-deep">Carried through every chapter.</p>
          <EmailField className="w-full" />
        </div>
        <div className="flex w-full flex-col items-start">
          <MobileAccordion title="SHOP" links={shopLinks} />
          <MobileAccordion title="CLIENT CARE" links={clientCareLinks} />
          <MobileAccordion title="THE HOUSE" links={houseLinks} />
        </div>
        <div className="flex w-full flex-col items-start gap-3 border-t border-line pt-5">
          <div className="flex gap-6">
            {socials.map((s) => (
              <span key={s} className="type-caption text-ink">
                {s}
              </span>
            ))}
          </div>
          <p className="type-caption text-ink-muted">© 2026 Coach — concept study. Not affiliated.</p>
        </div>
      </div>
    </footer>
  );
}
