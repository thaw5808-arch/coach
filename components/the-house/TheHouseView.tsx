"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/ui/SiteLink";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { OPENINGS } from "@/lib/careers";
import { hoursLabel, stores, type Store } from "@/lib/stores";
import { BookingDialog } from "./BookingDialog";
import { StoreLocator } from "./StoreLocator";

const shell = "mx-auto w-full max-w-[1440px] px-4 desk:px-[clamp(24px,6.667vw,96px)]";
const SECTIONS = ["story", "craftsmanship", "stores", "careers"] as const;

/** Figma "House / Chapters" (99:358). */
const CHAPTERS = [
  { tag: "1941", title: "A Manhattan Workshop", body: "A handful of artisans cut and stitched leather goods by hand in a New York loft." },
  { tag: "GLOVE LEATHER", title: "Softer With Time", body: "Inspired by the baseball glove: a leather that grows richer the more it is carried." },
  { tag: "THE SIGNATURE", title: "The C Pattern", body: "Our interlocking C becomes a canvas carried on totes, briefcases and everything between." },
  { tag: "TODAY", title: "Repaired, Re-loved", body: "Every piece can come home to our artisans — cleaned, conditioned and made ready again." },
];

/** Figma "Stats" (99:389) — the frame's own numbers, nothing added. */
const STATS = [
  { value: "40+", label: "pairs of hands per bag" },
  { value: "3 wks", label: "for a full restoration" },
  { value: "For life", label: "complimentary leather care" },
];

/** Figma "Hero / Stage" (99:353 desktop 680×440, 99:451 mobile 358×280) — positions as % of the stage. */
function HeroStage() {
  // Above the fold: all eager; the centre (largest) bag is the LCP.
  const img = (src: string, cls: string, rotate: number, sizes: string) => (
    <div className={`absolute ${cls}`} style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}>
      <SafeImage src={src} alt="" fill sizes={sizes} className="object-contain" loading="eager" fetchPriority={src.endsWith("bag-black.png") ? "high" : "auto"} />
    </div>
  );
  return (
    <div aria-hidden="true" className="relative aspect-[358/280] w-full desk:aspect-[680/440] desk:min-w-0 desk:flex-1">
      <span className="absolute left-[10.89%] top-[5%] h-[90%] w-[78.21%] rounded-[50%] bg-blob desk:left-[13.24%] desk:top-[2.95%] desk:h-[94.09%] desk:w-[67.65%]" />
      {img("/images/home/bag-signature-pink.png", "left-[5.5%] top-[42.75%] h-[53.6%] w-[41.9%] desk:left-[8.26%] desk:top-[34.41%] desk:h-[56.82%] desk:w-[36.76%]", -8, "250px")}
      {img("/images/home/bag-bow-pink.png", "left-[62.1%] top-[49.1%] h-[52.5%] w-[41.06%] desk:left-[50.1%] desk:top-[49.9%] desk:h-[56.82%] desk:w-[36.76%]", 16, "250px")}
      {img("/images/home/bag-black.png", "left-[25.14%] top-[7.14%] h-[67.86%] w-[53.07%] desk:left-[25%] desk:top-[4.55%] desk:h-[72.73%] desk:w-[47.06%]", 0, "320px")}
    </div>
  );
}

/** /the-house — Figma "The House — Desktop 1440" (99:30) / "Mobile 390" (99:131) + States (100:169). */
export function TheHouseView() {
  const [now, setNow] = useState<Date | null>(null);
  const [locatorOpen, setLocatorOpen] = useState(false);
  const [openingsOpen, setOpeningsOpen] = useState(false);
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [applyNote, setApplyNote] = useState<string | null>(null);
  const [booking, setBooking] = useState<Store | null>(null);
  const instant = useRef(true);
  const [scrollReq, setScrollReq] = useState<{ id: string; seq: number } | null>(null);
  const requestScroll = useCallback((id: string) => setScrollReq((r) => ({ id, seq: (r?.seq ?? 0) + 1 })), []);
  useEffect(() => setNow(new Date()), []);

  // Same approach as Client Care: the hash → state → scroll after that commit (first load jumps, clicks glide).
  const syncFromHash = useCallback(
    (hash: string = window.location.hash) => {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      if ((SECTIONS as readonly string[]).includes(id)) requestScroll(id);
    },
    [requestScroll],
  );
  useEffect(() => {
    if (!window.location.hash) instant.current = false;
    syncFromHash();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) window.setTimeout(() => syncFromHash(url.hash), 0);
    };
    const onHistory = () => syncFromHash();
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHistory);
    window.addEventListener("popstate", onHistory);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHistory);
      window.removeEventListener("popstate", onHistory);
    };
  }, [syncFromHash]);
  useEffect(() => {
    if (!scrollReq) return;
    const behavior: ScrollBehavior = instant.current ? "auto" : "smooth";
    instant.current = false;
    document.getElementById(scrollReq.id)?.scrollIntoView({ behavior, block: "start" });
  }, [scrollReq]);

  const setHash = (id: string) => window.history.replaceState(window.history.state, "", `${window.location.pathname}#${id}`);
  const closeBooking = useCallback(() => setBooking(null), []);

  return (
    <div className="relative">
      {/* Hero — #story (Figma "House / Hero" 99:345) */}
      <section id="story" aria-labelledby="story-heading" className={`${shell} relative scroll-mt-6`}>
        <Blob className="-top-[142px] right-[-90px] h-[199px] w-[220px] desk:-top-[190px] desk:right-[-254px] desk:h-[359px] desk:w-[397px]" />
        <div className="relative z-10 flex flex-col gap-6 pt-6 desk:flex-row desk:items-center desk:gap-12 desk:pt-12">
          <div className="flex flex-col items-start gap-4 desk:w-[520px] desk:shrink-0">
            <nav aria-label="Breadcrumb">
              <ol className="type-caption flex gap-2">
                <li>
                  <Link href="/" className="text-ink-muted hover:text-ink">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-ink-muted">
                  /
                </li>
                <li aria-current="page" className="text-ink">
                  The House
                </li>
              </ol>
            </nav>
            <div className="flex flex-col items-start gap-2">
              <p className="type-eyebrow text-accent-deep">THE HOUSE · SINCE 1941</p>
              <h1 id="story-heading" className="type-display-mobile text-ink desk:type-display-xl">
                Our Story
              </h1>
              <p className="type-italic-sm text-accent-deep desk:type-italic">A New York workshop, carried through every chapter.</p>
            </div>
            <p className="type-body text-ink-muted desk:type-body-lg">
              It began with a small family workshop in Manhattan and a leather that softened like a well-worn baseball glove. The tools have changed; the hands, and the patience, have not.
            </p>
          </div>
          <HeroStage />
        </div>
      </section>

      {/* Chapters (99:358) */}
      <section aria-labelledby="chapters-heading" className={`${shell} pt-16 desk:pt-32`}>
        <div className="flex flex-col gap-2">
          <p className="type-eyebrow text-accent-deep">CHAPTERS</p>
          <h2 id="chapters-heading" className="type-h1-mobile text-ink desk:type-h1">
            Eight Decades, One Craft
          </h2>
        </div>
        <ol className="grid grid-cols-1 pt-6 desk:grid-cols-4 desk:gap-8 desk:pt-12">
          {CHAPTERS.map((c, i) => (
            <li key={c.title} className={`flex flex-col gap-2.5 border-t-2 pb-6 pt-6 desk:pb-0 ${i === CHAPTERS.length - 1 ? "border-accent-deep" : "border-line"}`}>
              <p className="type-badge text-accent-deep">{c.tag}</p>
              <h3 className="type-h3 text-ink">{c.title}</h3>
              <p className="type-body text-ink-muted">{c.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Craftsmanship — #craftsmanship (99:379) */}
      <section id="craftsmanship" aria-labelledby="craft-heading" className={`${shell} scroll-mt-6 pt-16 desk:pt-32`}>
        <div className="flex flex-col gap-6 rounded-[24px] bg-surface px-6 py-8 desk:flex-row desk:items-center desk:gap-16 desk:p-16">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
            <p className="type-eyebrow text-accent-deep">CRAFTSMANSHIP</p>
            <h2 id="craft-heading" className="type-h1-mobile text-ink desk:type-h1">
              Forty Pairs of Hands
            </h2>
            <p className="type-body text-ink-muted">
              From the first cut to the final polish of the hardware, each bag passes slowly through a line of specialists — edge painters, stitchers, finishers — who sign off one step at a
              time.
            </p>
            <Button href="/products/quilted-tabby-20#craft" variant="text">
              How a Tabby is made
            </Button>
          </div>
          <ul className="flex flex-col gap-4 desk:flex-row desk:gap-6">
            {STATS.map((s) => (
              <li key={s.value} className="flex flex-col gap-1.5 rounded-[20px] bg-bg p-6 desk:w-[190px]">
                <span className="type-h1-mobile text-ink desk:type-h1">{s.value}</span>
                <span className="type-caption text-ink-muted">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stores — #stores (99:399) + Locator (100:170) */}
      <section id="stores" aria-labelledby="stores-heading" className={`${shell} scroll-mt-6 pt-16 desk:pt-32`}>
        <div className="flex flex-col items-start gap-1 desk:flex-row desk:items-end desk:justify-between">
          <div className="flex flex-col gap-2">
            <p className="type-eyebrow text-accent-deep">STORES</p>
            <h2 id="stores-heading" className="type-h1-mobile text-ink desk:type-h1">
              Visit a Boutique
            </h2>
          </div>
          <Button
            variant="text"
            aria-expanded={locatorOpen}
            aria-controls="store-locator"
            onClick={() => {
              setLocatorOpen((o) => !o);
              setHash("stores");
            }}
          >
            {locatorOpen ? "Hide store finder" : "Find a store near you"}
          </Button>
        </div>
        <div id="store-locator" className="pt-6 desk:pt-8">
          {locatorOpen ? (
            <StoreLocator onBook={setBooking} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 desk:grid-cols-3 desk:gap-6">
              {stores.map((s) => {
                const today = now ? s.hours[now.getDay()] : undefined;
                return (
                  <li key={s.id} data-store-card={s.id} className="flex flex-col items-start gap-2 rounded-[24px] bg-surface p-7">
                    <h3 className="type-h3 text-ink">{s.shortName}</h3>
                    <p className="type-body text-ink-muted">{s.street}</p>
                    <p className={`type-caption min-h-[21px] ${today === null ? "text-ink-muted" : "text-accent-deep"}`}>
                      {today === undefined ? "" : today === null ? "Closed today" : `Open today · ${hoursLabel(today)}`}
                    </p>
                    <Button variant="text" onClick={() => setBooking(s)} aria-label={`Book an appointment at ${s.shortName}`}>
                      Book an appointment
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Careers — #careers (99:433) + Openings (100:252) */}
      <section id="careers" aria-labelledby="careers-heading" className={`${shell} scroll-mt-6 py-16 desk:py-32`}>
        <div className="flex flex-col items-start gap-6 rounded-[24px] bg-blob p-6 desk:flex-row desk:items-center desk:gap-8 desk:p-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="type-eyebrow text-accent-deep">CAREERS</p>
            <h2 id="careers-heading" className="type-h1-mobile text-ink desk:type-h1">
              Join the Workshop
            </h2>
            <p className="type-body text-ink-muted">Artisans, client advisors and designers — find a role that suits your hands.</p>
          </div>
          <Button
            aria-expanded={openingsOpen}
            aria-controls="openings"
            onClick={() => {
              setOpeningsOpen((o) => !o);
              setHash("careers");
            }}
          >
            {openingsOpen ? "Hide openings" : "View openings"}
          </Button>
        </div>
        {openingsOpen && (
          <div id="openings" className="mt-6 flex flex-col rounded-[24px] bg-surface p-6 desk:mx-auto desk:max-w-[720px] desk:p-8">
            <h3 className="type-h1-mobile pb-4 text-ink desk:type-h1">Open Roles</h3>
            <ul>
              {OPENINGS.map((o) => {
                const open = openRole === o.id;
                return (
                  <li key={o.id} className="border-t border-line">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`role-${o.id}`}
                      onClick={() => {
                        setOpenRole(open ? null : o.id);
                        setApplyNote(null);
                      }}
                      className="flex w-full items-center gap-4 py-[18px] text-left"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="type-h4 text-ink">{o.title}</span>
                        <span className="type-caption text-ink-muted">
                          {o.location} · {o.team} · {o.type}
                        </span>
                      </span>
                      <span aria-hidden="true" className={`type-button text-ink transition-transform ${open ? "rotate-90" : ""}`}>
                        →
                      </span>
                    </button>
                    <div id={`role-${o.id}`} hidden={!open} className="flex flex-col items-start gap-3 pb-6">
                      <p className="type-body text-ink-muted">{o.summary}</p>
                      <ul className="type-caption list-disc pl-5 text-ink">
                        {o.details.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                      <Button variant="secondary" showArrow={false} onClick={() => setApplyNote(o.id)} className="border border-line">
                        Apply
                      </Button>
                      {applyNote === o.id && (
                        <p role="status" className="type-caption text-accent-deep">
                          This site is a concept study — applications aren’t accepted and nothing is sent.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <BookingDialog store={booking} onClose={closeBooking} />
    </div>
  );
}
