"use client";

import Link from "@/components/ui/SiteLink";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isActivePath, primaryNav } from "@/lib/nav";
import { useBag } from "@/lib/bag/BagContext";
import { AccountIcon, BagIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { MegaMenu } from "./MegaMenu";
import { NavItem } from "./NavItem";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "@/components/search/SearchOverlay";

function BagLink({ size, className = "" }: { size: number; className?: string }) {
  const { count } = useBag();
  return (
    <Link href="/bag" aria-label={count ? `Shopping bag, ${count} item${count === 1 ? "" : "s"}` : "Shopping bag"} className={`relative ${className}`}>
      <BagIcon size={size} />
      {count > 0 && (
        <span className="type-badge absolute -top-1 left-6 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-deep px-[5px] py-[2px] text-surface">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/*
 * Desktop: Figma "Nav / Desktop" (13:51) — 1248 content width, 96px margins, 80px tall.
 * Mobile:  Figma "Nav / Mobile" (13:76) — 44px touch targets, centred wordmark, 52px tall.
 */
export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const isHome = pathname === "/";

  useEffect(() => setMenuOpen(false), [pathname]);

  // Search overlay — from either header icon, or "/" on desktop when not typing somewhere.
  const [searchOpen, setSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLButtonElement>(null);
  const mobileSearchRef = useRef<HTMLButtonElement>(null);
  const searchReturn = useRef<HTMLElement | null>(null);
  const openSearch = useCallback((from: React.RefObject<HTMLButtonElement | null>) => {
    searchReturn.current = from.current;
    setMenuOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  useEffect(() => setSearchOpen(false), [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      e.preventDefault();
      openSearch(desktopSearchRef);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <header className={`relative z-40 ${isHome ? "intro-header" : ""}`}>
      {/* Desktop */}
      <div className="mx-auto hidden h-20 max-w-[1440px] items-end px-[clamp(24px,6.667vw,96px)] desk:flex">
        {/* `relative` anchors the mega-menu panel to this 1248px row. */}
        <div className="relative flex w-full items-center justify-between">
          <Link href="/" className="type-logo shrink-0" aria-label="COACH home">
            COACH
          </Link>
          <nav aria-label="Primary" className="mx-6 flex h-[53px] max-w-[730px] flex-1 items-center justify-between rounded-pill bg-surface px-[15px]">
            {primaryNav.map(({ href, label, menu }) => {
              // Home frame in Figma shows no active pill on HOME — keep that.
              const active = href !== "/" && isActivePath(pathname, href);
              return menu ? (
                <MegaMenu key={`${href}:${pathname}`} href={href} label={label} active={active} menu={menu} />
              ) : (
                <NavItem key={href} href={href} label={label} active={active} />
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-[clamp(20px,2.9vw,42px)]">
            <button
              ref={desktopSearchRef}
              type="button"
              onClick={() => openSearch(desktopSearchRef)}
              aria-label="Search"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              aria-keyshortcuts="/"
              className="text-ink hover:text-accent-deep"
            >
              <SearchIcon size={38} />
            </button>
            <Link href="/account" aria-label="Account" className="text-ink hover:text-accent-deep">
              <AccountIcon size={38} />
            </Link>
            <BagLink size={38} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex h-[52px] items-center justify-between px-4 pt-2 desk:hidden">
        <div className="flex h-11 w-[88px] items-center">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-11 items-center justify-center"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <MenuIcon />
          </button>
          <button
            ref={mobileSearchRef}
            type="button"
            onClick={() => openSearch(mobileSearchRef)}
            aria-label="Search"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            className="flex h-11 items-center"
          >
            <SearchIcon />
          </button>
        </div>
        <Link href="/" className="type-logo-mobile" aria-label="COACH home">
          COACH
        </Link>
        <div className="flex h-11 w-[88px] items-center justify-end">
          <BagLink size={28} className="flex size-11 items-center justify-center" />
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} pathname={pathname} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} returnFocus={searchReturn} />
    </header>
  );
}
