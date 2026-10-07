"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { ArrowIcon } from "@/components/ui/Icons";
import { CutoutImage } from "@/components/ui/CutoutImage";
import type { MegaMenuContent } from "@/lib/categories";
import { navItemClass } from "./NavItem";

/** Hover intent before opening, and grace period after the pointer leaves both the item and the panel. */
const OPEN_DELAY = 150;
const CLOSE_DELAY = 150;

/**
 * Figma "Nav — Women Menu Open" (73:336) / "Nav — Men Menu Open" (80:613): a nav item that discloses a
 * full-width panel under the nav pill.
 *
 * Mouse: opens after 150ms of hover; closes 150ms after the pointer has left BOTH the item and the panel
 * (tracked on the document too, so a missed `pointerleave` can never leave it hanging). Clicking the item
 * while it's hover-open goes to the category.
 * Keyboard: Enter / Space / ArrowDown open (ArrowDown also focuses the first link); Tab walks the links.
 * Esc, click outside, focus leaving, scrolling and route changes close it immediately.
 *
 * The panel is always mounted but `invisible` + transparent + inert to the pointer while closed, so nothing
 * (not even its shadow) shows; it fades in/out over 150ms, instantly with prefers-reduced-motion.
 * It positions against the header row (`relative`, 1248 wide); the Header is `relative z-40`, panel `z-50`.
 */
export function MegaMenu({ href, label, active, menu }: { href: string; label: string; active: boolean; menu: MegaMenuContent }) {
  const router = useRouter();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  /** "pointer" = opened by mouse hover/click → closes when the pointer leaves; "keyboard" stays until dismissed. */
  const openedBy = useRef<"pointer" | "keyboard" | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusFirst = useRef(false);
  /** After an explicit close, ignore a resting pointer until it genuinely leaves and re-enters. */
  const suppressHover = useRef(false);

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    openTimer.current = undefined;
    closeTimer.current = undefined;
  }, []);

  const show = useCallback(
    (by: "pointer" | "keyboard") => {
      clearTimers();
      openedBy.current = by;
      setCurrentUrl(window.location.pathname + window.location.search);
      setOpen(true);
      // Never stack with the search overlay: tell it to close (components/search/SearchOverlay.tsx).
      window.dispatchEvent(new Event("coach:menu-open"));
    },
    [clearTimers],
  );

  const hide = useCallback(
    (returnFocus = false) => {
      clearTimers();
      openedBy.current = null;
      suppressHover.current = true;
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [clearTimers],
  );

  // Unmount (the Header remounts this per pathname, so this also covers route changes): no stray timers.
  useEffect(() => clearTimers, [clearTimers]);

  // …and the search overlay opening closes this menu.
  useEffect(() => {
    const onSearchOpen = () => hide();
    window.addEventListener("coach:search-open", onSearchOpen);
    return () => window.removeEventListener("coach:search-open", onSearchOpen);
  }, [hide]);

  const scheduleOpen = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
    if (openTimer.current) return;
    openTimer.current = setTimeout(() => {
      openTimer.current = undefined;
      show("pointer");
    }, OPEN_DELAY);
  }, [show]);

  const scheduleClose = useCallback(() => {
    clearTimeout(openTimer.current);
    openTimer.current = undefined;
    if (openedBy.current !== "pointer" || closeTimer.current) return;
    closeTimer.current = setTimeout(() => hide(), CLOSE_DELAY);
  }, [hide]);

  const cancelClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  };

  // While open: Esc, click outside, scroll, and a document-level pointer check (backstop for pointerleave).
  useEffect(() => {
    if (!open) return;
    if (focusFirst.current) {
      focusFirst.current = false;
      wrapperRef.current?.querySelector<HTMLAnchorElement>(`[id="${panelId}"] a[href]`)?.focus();
    }
    const inside = (t: EventTarget | null) => !!t && !!wrapperRef.current?.contains(t as Node);
    function onPointerDown(e: globalThis.PointerEvent) {
      if (!inside(e.target)) hide();
    }
    function onPointerMove(e: globalThis.PointerEvent) {
      if (e.pointerType !== "mouse") return;
      if (inside(e.target)) cancelClose();
      else scheduleClose();
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") hide(wrapperRef.current?.contains(document.activeElement) ?? false);
    }
    // Ignore scrolls caused by the opening itself (e.g. focus scrolling the header into view); real scrolling closes.
    const openedAt = performance.now();
    const onScroll = () => {
      if (performance.now() - openedAt > 100) hide();
    };
    // Pointer left the window entirely (no element gets a pointerleave in some browsers).
    function onMouseOut(e: globalThis.MouseEvent) {
      if (!e.relatedTarget) scheduleClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    const onWindowBlur = () => hide();
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [open, hide, panelId, scheduleClose]);

  // Hover intent — real mice only; touch taps go through onClick.
  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    suppressHover.current = false;
    if (open) cancelClose();
    else scheduleOpen();
  };
  // The pointer can already be resting on the item when it mounts (e.g. right after navigating) — no enter fires.
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !open && !suppressHover.current) scheduleOpen();
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (open) scheduleClose();
    else {
      clearTimeout(openTimer.current);
      openTimer.current = undefined;
    }
  };

  const onTriggerClick = (e: MouseEvent) => {
    const byPointer = e.detail > 0; // keyboard-activated clicks report detail 0
    if (open && openedBy.current === "pointer" && byPointer) {
      hide();
      router.push(href);
    } else if (open) hide();
    else show(byPointer ? "pointer" : "keyboard");
  };

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusFirst.current = true;
      if (open) wrapperRef.current?.querySelector<HTMLAnchorElement>(`[id="${panelId}"] a[href]`)?.focus();
      else show("keyboard");
    }
  };

  // Arrow keys move between panel links (Tab still works for everything).
  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = Array.from(wrapperRef.current?.querySelectorAll<HTMLAnchorElement>(`[id="${panelId}"] a[href]`) ?? []);
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (i === -1) return;
    e.preventDefault();
    links[(i + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus();
  };

  return (
    <div
      ref={wrapperRef}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onBlur={(e) => {
        // Focus moved somewhere outside (e.g. Tab past the last link). Null targets are handled by click-outside.
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) hide();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={active ? "page" : undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        className={navItemClass(active, open)}
      >
        {label}
      </button>

      {/* `top-full` + pt-4 is a transparent hover bridge across the 16px gap between the pill and the panel. */}
      <div
        id={panelId}
        role="region"
        aria-label={`${label} menu`}
        onKeyDown={onPanelKeyDown}
        // Visibility flips instantly on open (so links are focusable right away) and only fades on close.
        className={`absolute inset-x-0 top-full z-50 pt-4 duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible opacity-100 transition-opacity" : "pointer-events-none invisible opacity-0 transition-[opacity,visibility]"
        }`}
      >
        <div className="flex gap-16 rounded-pill bg-surface px-12 py-10 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
          {menu.columns.map((col) => (
            <div key={col.heading} className="flex shrink-0 flex-col items-start gap-3.5">
              <p className="type-eyebrow text-accent-deep" id={`${panelId}-${col.heading}`}>
                {col.heading}
              </p>
              <ul aria-labelledby={`${panelId}-${col.heading}`} className="flex flex-col items-start gap-3.5">
                {col.links.map((link) => {
                  const current = link.href === currentUrl;
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => hide()}
                        aria-current={current ? "page" : undefined}
                        className={`type-body whitespace-nowrap transition-colors duration-150 hover:text-ink ${current ? "text-ink" : "text-ink-muted"}`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
            <Link href={menu.featured.href} onClick={() => hide()} tabIndex={-1} aria-hidden="true" className="relative block h-[220px] w-full overflow-hidden rounded-pill bg-bg">
              <span className="absolute left-1/2 top-[20px] h-[181px] w-[200px] -translate-x-1/2 rounded-[50%] bg-blob" />
              <span className="absolute left-1/2 top-[10px] size-[200px] -translate-x-1/2">
                <CutoutImage image={menu.featured.image} sizes="200px" />
              </span>
            </Link>
            <p className="type-h4 text-ink">{menu.featured.title}</p>
            <Link href={menu.featured.href} onClick={() => hide()} className="type-button inline-flex items-center gap-3 py-2 text-ink hover:text-accent-deep">
              {menu.featured.cta}
              <span className="sr-only"> {menu.featured.title}</span>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
