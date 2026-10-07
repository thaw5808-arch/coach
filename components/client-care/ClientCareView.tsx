"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/ui/SiteLink";
import { AccordionItem } from "@/components/ui/AccordionItem";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/Icons";
import { CARE_GUIDE, FAQ_CATEGORIES, FAQS, PERSONALISABLE, type CarePanel, type ContactTopic } from "@/lib/clientCare";
import { CARE_CONTACT, CARE_HOURS, POLICY_COPY, RETURN_DAYS, RETURN_STEPS, deliveryRows } from "@/lib/policies";
import { ContactForm } from "./ContactForm";

const shell = "mx-auto w-full max-w-[1440px] px-4 desk:px-[clamp(24px,6.667vw,96px)]";

const TOPICS: { n: string; panel: CarePanel | "faq"; title: string; body: string; cta: string }[] = [
  { n: "01", panel: "contact", title: "Contact Us", body: `Call, chat or write — a person answers, every day ${CARE_HOURS}.`, cta: "Get in touch" },
  { n: "02", panel: "shipping", title: "Shipping & Returns", body: `Complimentary delivery, ${RETURN_DAYS}-day returns and how to send a piece back.`, cta: "Delivery details" },
  { n: "03", panel: "leather-care", title: "Leather Care", body: "Keep nappa, pebble and canvas looking their best — and when to bring them in.", cta: "Care guide" },
  { n: "04", panel: "faq", title: "FAQ", body: "Orders, payments, personalisation and repairs, answered.", cta: "Read answers" },
];

const PANELS: CarePanel[] = ["contact", "shipping", "leather-care"];
const FAQ_IDS = FAQS.map((f) => f.id);

/** What a URL hash asks for: one of the detail panels, or a FAQ question (`#faq` = the first one). */
function parseHash(hash: string): { panel: CarePanel | null; faq: string | null } {
  const h = decodeURIComponent(hash.replace(/^#/, ""));
  if ((PANELS as string[]).includes(h)) return { panel: h as CarePanel, faq: null };
  if (h === "faq") return { panel: null, faq: FAQ_IDS[0] };
  if (FAQ_IDS.includes(h)) return { panel: null, faq: h };
  return { panel: null, faq: null };
}

function setHash(hash: string | null) {
  const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
  window.history.replaceState(window.history.state, "", url);
}

/** Figma "Shipping & Returns — Detail" (98:271) — rows read lib/policies.ts, i.e. what checkout really does. */
function ShippingPanel() {
  return (
    <div className="flex w-full flex-col gap-10 rounded-[24px] bg-surface p-6 desk:flex-row desk:gap-12 desk:p-10">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="type-h3 text-ink">Delivery</h3>
        <ul>
          {deliveryRows().map((r) => (
            <li key={r.key} data-policy={r.key} className="flex items-center gap-4 border-b border-line py-4">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="type-h4 text-ink">{r.title}</span>
                <span className="type-caption text-ink-muted">{r.detail}</span>
              </span>
              <span className="type-price-sm shrink-0 text-ink">{r.price}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="type-h3 text-ink">Returns</h3>
        <ol className="flex flex-col gap-3">
          {RETURN_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span className="type-badge pt-1.5 text-accent-deep">{String(i + 1).padStart(2, "0")}</span>
              <span className="type-body flex-1 text-ink">{step}</span>
            </li>
          ))}
        </ol>
        <p className="type-caption text-ink-muted">{POLICY_COPY.personalisedFinal}</p>
      </div>
    </div>
  );
}

/** Figma "Leather Care — Guide" (98:307): three habits + the repair service. */
function LeatherCarePanel({ onBookRepair }: { onBookRepair: () => void }) {
  return (
    <ul className="grid w-full grid-cols-1 gap-4 desk:grid-cols-4 desk:gap-6">
      {CARE_GUIDE.map((c) => (
        <li key={c.n} className="flex flex-col gap-2.5 rounded-[24px] bg-surface px-7 py-8">
          <span className="type-badge text-accent-deep">{c.n}</span>
          <h3 className="type-h3 text-ink">{c.title}</h3>
          <p className="type-body text-ink-muted">{c.body}</p>
        </li>
      ))}
      <li className="flex flex-col items-start gap-2.5 rounded-[24px] bg-blob px-7 py-8">
        <span className="type-badge text-accent-deep">SERVICE</span>
        <h3 className="type-h3 text-ink">Book a Repair</h3>
        <p className="type-body text-ink-muted">In a boutique or by prepaid mail — usually back within three weeks.</p>
        <Button variant="text" onClick={onBookRepair}>
          Book now
        </Button>
      </li>
    </ul>
  );
}

/** /client-care — Figma "Client Care — Desktop 1440" (97:30) / "Mobile 390" (97:131) + States (98:222). */
export function ClientCareView() {
  const [panel, setPanel] = useState<CarePanel | null>(null);
  const [faqOpen, setFaqOpen] = useState<string | null>(FAQ_IDS[0]);
  const [contactTopic, setContactTopic] = useState<ContactTopic | null>(null);
  // A scroll request is state, so it lands in the same commit as the panel / question it targets — the effect below
  // then runs after that layout (e.g. after the default-open first answer has collapsed).
  const [scrollReq, setScrollReq] = useState<{ id: string; seq: number } | null>(null);
  const requestScroll = useCallback((id: string) => setScrollReq((r) => ({ id, seq: (r?.seq ?? 0) + 1 })), []);
  /** Arriving on a URL with a hash jumps straight there; in-page choices scroll smoothly. */
  const instant = useRef(true);

  // Arriving with (or navigating to) a hash opens the matching panel / question, then scrolls to it.
  const syncFromHash = useCallback((hash: string = window.location.hash) => {
    const { panel: p, faq } = parseHash(hash);
    if (p) {
      setPanel(p);
      requestScroll(p);
    } else if (faq) {
      setFaqOpen(faq);
      requestScroll(faq === FAQ_IDS[0] && hash === "#faq" ? "faq" : faq);
    }
  }, [requestScroll]);

  useEffect(() => {
    if (!parseHash(window.location.hash).panel && !parseHash(window.location.hash).faq) instant.current = false;
    syncFromHash();
    // Next's <Link> to a hash on this same page updates the URL itself (no hashchange, and not yet when the click
    // fires) — so read the hash straight from the clicked link when it points at this page.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) window.setTimeout(() => syncFromHash(url.hash), 0);
    };
    const onHistory = () => syncFromHash();
    window.addEventListener("hashchange", onHistory);
    window.addEventListener("popstate", onHistory);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHistory);
      window.removeEventListener("popstate", onHistory);
      document.removeEventListener("click", onClick);
    };
  }, [syncFromHash]);

  // After the panel / question renders, bring it into view (scroll-margin keeps the heading clear of the header).
  useEffect(() => {
    if (!scrollReq) return;
    const behavior: ScrollBehavior = instant.current ? "auto" : "smooth";
    instant.current = false;
    document.getElementById(scrollReq.id)?.scrollIntoView({ behavior, block: "start" });
  }, [scrollReq]);

  const openPanel = (p: CarePanel, topic?: ContactTopic) => {
    if (topic) setContactTopic(topic);
    setPanel(p);
    setHash(p);
    requestScroll(p);
  };
  const openFaq = (id: string, hash = id) => {
    setFaqOpen(id);
    setHash(hash);
    requestScroll(id);
  };
  const closePanel = () => {
    setPanel(null);
    setContactTopic(null);
    setHash(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCategory = FAQS.find((f) => f.id === faqOpen)?.category;

  return (
    <div className="relative">
      {/* Hero — Figma "Care / Hero" (97:345) */}
      <div className={`${shell} relative`}>
        <Blob className="-top-[142px] right-[-90px] h-[199px] w-[220px] desk:-top-[190px] desk:right-[-254px] desk:h-[359px] desk:w-[397px]" />
        <div className="relative z-10 flex flex-col items-start gap-3 pt-6 desk:gap-4 desk:pt-12">
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
                Client Care
              </li>
            </ol>
          </nav>
          <div className="flex flex-col items-start gap-2">
            <p className="type-eyebrow text-accent-deep">CLIENT CARE</p>
            <h1 className="type-display-mobile text-ink desk:type-display-xl">How Can We Help?</h1>
            <p className="type-italic-sm text-accent-deep desk:type-italic">Real people, every day from 9am to 9pm.</p>
          </div>
        </div>
      </div>

      {/* Topics — Figma "Care / Topics" (97:351) */}
      <div className={`${shell} pt-8 desk:pt-16`}>
        <ul className="grid grid-cols-1 gap-3 desk:grid-cols-4 desk:gap-6">
          {TOPICS.map((t) => {
            const active = t.panel !== "faq" && panel === t.panel;
            return (
              <li key={t.n}>
                <a
                  href={`#${t.panel}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (t.panel === "faq") openFaq(FAQ_IDS[0], "faq");
                    else openPanel(t.panel);
                  }}
                  aria-expanded={t.panel === "faq" ? undefined : active}
                  aria-controls={t.panel === "faq" ? "faq" : "care-panel"}
                  className={`group flex h-full flex-col items-start gap-3 rounded-[24px] bg-surface px-6 py-6 transition-shadow desk:min-h-[226px] desk:px-7 desk:py-8 ${
                    active ? "ring-[1.5px] ring-accent-deep" : "hover:ring-1 hover:ring-line"
                  }`}
                >
                  <span className="type-badge text-accent-deep">{t.n}</span>
                  <span className="type-h3 text-ink">{t.title}</span>
                  <span className="type-caption text-ink-muted">{t.body}</span>
                  <span className="type-button mt-auto flex items-center gap-3 py-2 text-ink group-hover:text-accent-deep">
                    {t.cta}
                    <ArrowIcon aria-hidden="true" />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Detail panel — Figma States 98:222 (Contact form / Shipping & Returns / Leather Care) */}
      <div id="care-panel" className={shell}>
        {panel && (
          <section id={panel} aria-labelledby={`${panel}-heading`} className="scroll-mt-24 pt-12 desk:pt-16">
            <div className="flex items-end justify-between gap-4 pb-5">
              <div className="flex flex-col gap-2">
                <p className="type-eyebrow text-accent-deep">{panel === "contact" ? "CONTACT US" : panel === "shipping" ? "SHIPPING & RETURNS" : "LEATHER CARE"}</p>
                <h2 id={`${panel}-heading`} className="type-h1-mobile text-ink desk:type-h1">
                  {panel === "contact" ? "Write or Call" : panel === "shipping" ? "Delivery & Returns" : "Care for Your Piece"}
                </h2>
              </div>
              <Button variant="text" showArrow={false} onClick={closePanel}>
                Close
              </Button>
            </div>
            {panel === "contact" && (
              <div className="flex flex-col gap-6 desk:flex-row desk:items-start desk:gap-12">
                <div className="w-full desk:max-w-[600px]">
                  <ContactForm initialTopic={contactTopic} onDone={closePanel} />
                </div>
                <div className="flex flex-col gap-3 desk:pt-10">
                  <p className="type-badge text-ink-muted">OR REACH US DIRECTLY</p>
                  <a href={CARE_CONTACT.phoneHref} className="type-body text-ink underline-offset-4 hover:underline">
                    {CARE_CONTACT.phone}
                  </a>
                  <a href={CARE_CONTACT.emailHref} className="type-body text-ink underline-offset-4 hover:underline">
                    {CARE_CONTACT.email}
                  </a>
                  <p className="type-caption text-ink-muted">Every day, {CARE_HOURS}</p>
                </div>
              </div>
            )}
            {panel === "shipping" && <ShippingPanel />}
            {panel === "leather-care" && <LeatherCarePanel onBookRepair={() => openPanel("contact", "care")} />}
          </section>
        )}
      </div>

      {/* FAQ — Figma "Care / FAQ" (97:384) */}
      <section id="faq" aria-labelledby="faq-heading" className={`${shell} scroll-mt-24 pt-16 desk:pt-32`}>
        <div className="flex flex-col gap-4 desk:flex-row desk:gap-16">
          <div className="flex flex-col items-start gap-3 desk:w-[360px] desk:shrink-0">
            <p className="type-eyebrow text-accent-deep">FREQUENTLY ASKED</p>
            <h2 id="faq-heading" className="type-h1-mobile text-ink desk:type-h1">
              Quick Answers
            </h2>
            <p className="type-body text-ink-muted">Can’t find yours? Client Care replies within the hour.</p>
            <ul className="flex flex-wrap gap-2 pt-2 desk:flex-col desk:gap-1 desk:pt-4" aria-label="Question topics">
              {FAQ_CATEGORIES.map((c) => {
                const q = FAQS.find((f) => f.category === c.key)!;
                const active = activeCategory === c.key;
                return (
                  <li key={c.key}>
                    <a
                      href={`#${c.hash}`}
                      onClick={(e) => {
                        e.preventDefault();
                        openFaq(q.id, c.hash);
                      }}
                      aria-current={active ? "true" : undefined}
                      className={`type-nav flex h-[42px] items-center rounded-pill px-4 desk:h-auto desk:py-2.5 ${
                        active ? "bg-blob text-accent-deep" : "bg-surface text-ink hover:text-accent-deep desk:bg-transparent"
                      }`}
                    >
                      {c.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex min-w-0 flex-1 flex-col pt-2 desk:pt-0">
            {FAQS.map((f) => (
              <AccordionItem key={f.id} id={f.id} title={f.question} open={faqOpen === f.id} onOpenChange={(o) => (o ? openFaq(f.id) : setFaqOpen(null))}>
                <p>{f.answer}</p>
                {f.category === "personalisation" && (
                  <div className="flex flex-col gap-2 pt-4">
                    <p className="type-badge text-ink">PIECES YOU CAN PERSONALISE</p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {PERSONALISABLE.map((p) => (
                        <li key={p.id}>
                          <Link href={`/products/${p.slug}`} className="type-caption text-ink underline decoration-from-font underline-offset-2 hover:text-accent-deep">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AccordionItem>
            ))}
            <div className="border-t border-line" />
          </div>
        </div>
      </section>

      {/* Contact band — Figma "Care / Contact" (97:431) */}
      <div className={`${shell} py-16 desk:py-32`}>
        <div className="flex flex-col gap-6 rounded-[24px] bg-blob p-6 desk:flex-row desk:items-start desk:gap-8 desk:p-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="type-eyebrow text-accent-deep">STILL NEED US?</p>
            <h2 className="type-h1-mobile text-ink desk:type-h1">Speak to Client Care</h2>
            <p className="type-body text-ink-muted">
              {/* Fictional placeholders (555-01xx, .example) — safe to link. */}
              <a href={CARE_CONTACT.phoneHref} className="hover:text-ink">
                {CARE_CONTACT.phone}
              </a>{" "}
              ·{" "}
              <a href={CARE_CONTACT.emailHref} className="hover:text-ink">
                {CARE_CONTACT.email}
              </a>
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 desk:flex-row desk:items-center">
            <Button onClick={() => openPanel("contact")}>Start a chat</Button>
            <Button href="/the-house#stores" variant="secondary" showArrow={false}>
              Book an appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
