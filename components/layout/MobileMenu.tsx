"use client";

import Link from "@/components/ui/SiteLink";
import { useEffect, useRef } from "react";
import { isActivePath, primaryNav, secondaryNav } from "@/lib/nav";
import { CloseIcon } from "@/components/ui/Icons";

/* Figma "P / Overlay / Mobile Menu" (103:2702). */
export function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="menu-fade fixed inset-0 z-50 flex flex-col gap-8 overflow-y-auto bg-bg px-4 pt-2 pb-8"
    >
      <div className="flex h-11 shrink-0 items-center justify-between">
        <button ref={closeRef} type="button" onClick={onClose} className="flex size-11 items-center justify-center" aria-label="Close menu">
          <CloseIcon />
        </button>
        <Link href="/" onClick={onClose} className="type-logo-mobile">
          COACH
        </Link>
        <span className="size-11" aria-hidden="true" />
      </div>

      <nav aria-label="Primary">
        <ul>
          {primaryNav.map(({ href, label }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`type-h1-mobile flex h-16 items-center justify-between border-b border-line ${active ? "text-accent-deep" : "text-ink hover:text-accent-deep"}`}
                >
                  {label}
                  {active && <span aria-hidden="true" className="size-2 rounded-full bg-accent-deep" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Secondary">
        <ul className="flex flex-col gap-4">
          {secondaryNav.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} onClick={onClose} className="type-body text-ink-muted hover:text-ink">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="type-italic-sm mt-auto text-accent-deep">Carried through every chapter.</p>
    </div>
  );
}
