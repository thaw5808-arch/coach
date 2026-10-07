# COACH — concept study

> **A design concept study. Not affiliated with, endorsed by or connected to Coach, Inc. or Tapestry, Inc.**
> “Coach” is used only as the subject of a portfolio exercise. Every store address, phone number, e-mail address,
> order, account and payment on this site is fictional or mocked — nothing is sold, sent or stored on a server.
> The same note is in the footer of every page (on Home, under its call-to-action) and on every social card.

Luxury bag e-commerce front end built from the COACH Figma file (`osZMOGTCVoymj8QPqbcZhP`, page ★ Prototype):
16 pages, desktop 1440 → mobile 320, statically rendered wherever possible, with a scripted audit that crawls,
clicks, accessibility-tests and SEO-checks every page.

## Setup

Requires Node ≥ 22.18 (scripts use Node's built-in TypeScript type-stripping).

```bash
npm install
cp .env.example .env.local        # optional — see below
npm run dev                       # http://localhost:3000
```

| variable | used for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public origin, no trailing slash (e.g. `https://coach.example.dev`). Feeds `metadataBase` (absolute OG / Twitter image URLs), canonical links, `sitemap.xml`, `robots.txt` and JSON-LD; an `https://` value also adds `upgrade-insecure-requests` to the CSP. Empty / unset → `http://localhost:3000` (leave it empty for local `next start`). |

There are no secrets — the app has no backend. `.env.example` also lists the optional audit / Lighthouse variables.

## Scripts

| script | what it does |
| --- | --- |
| `npm run dev` | dev server on :3000 |
| `npm run build` / `npm start` | production build / serve it |
| `npm run lint` | `tsc --noEmit` (strict) |
| `npm run audit` | `next build`, then `scripts/audit.ts` against `next start` on :3100 — exits non-zero on any failure |
| `npm run audit:run` | the audit against an existing build (`AUDIT_BASE_URL=…` to target a running server) |
| `npm run lighthouse` | Lighthouse mobile + desktop on the launch pages against a running server (`LH_BASE_URL`, default :3200) → `.qa/launch/lighthouse` |
| `npm run og` | regenerates the static 1200×630 Open Graph cards in `public/og/` (pages + every product) |

## Audit

```bash
npx playwright install chromium   # once
npm run audit
```

`scripts/audit.ts` places a real order through checkout, then runs seven passes (filter with `AUDIT_ONLY=…`):

1. **purchase** — a successful card order, so the order page can be audited.
2. **crawl** — every page × 1440 / 393: zero console output of any kind, no hydration warnings, no failed requests,
   no horizontal overflow at 1440 / 1024 / 393 / 320, badges fit, prices formatted, the concept-study note visible,
   and no old store address or real Coach / Tapestry address, phone or domain in the rendered HTML.
3. **links** — every internal href returns 200 (or is a known unbuilt page → "pending"); hash targets exist;
   category filter params are recognised and applied.
4. **buttons** — every visible button has an accessible name and, clicked on a fresh page, does something observable.
5. **flows** — scripted journeys (`AUDIT_FLOW=<regex>`): nav, mega-menus, categories, PDP, bag, checkout, order,
   account, wishlist, search, Client Care, The House, errors, persistence; plus a source scan for real addresses.
6. **a11y** — axe-core (WCAG 2.2 A/AA + best practice) on every page × 1440 / 393; serious / critical violations fail.
   A contrast miss between two Figma colours is *flagged* in the report instead (the design isn't changed without
   sign-off). Also: the skip link is the first Tab stop and lands in `<main>`; the first 25 Tab stops are visible,
   show a focus indicator and follow the DOM; nothing animates under `prefers-reduced-motion`.
7. **seo** — canonical on every indexable page (filter / sort params dropped), Open Graph + Twitter tags with a real
   1200×630 JPEG card, `noindex` on transactional pages, `sitemap.xml` / `robots.txt`, security headers.

Report: `.qa/audit/report.md` (+ `report.json`). Links to unbuilt pages are listed as "pending" from `lib/routes.ts`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Fontsource (Bona Nova / Bona Nova SC,
self-hosted) · Playwright + axe-core + Lighthouse for QA. No backend, no third-party scripts.

## Architecture

- **Rendering.** Every page is static except where it reads the URL on the server: `/new-arrivals`, `/women`, `/men`,
  `/bags` (filtered grids are server-rendered from `?type=` / `?sort=`), `/search`, `/wishlist` (shared `?items=`) and
  `/order/[id]`. Products are prerendered with `generateStaticParams`.
- **State** lives on the device: bag, wishlist, orders, accounts, appointments in `localStorage`; checkout in
  `sessionStorage` (never card data). Client-only views reserve a viewport of height until storage loads, so the
  footer never jumps (CLS 0).
- **Design tokens** are the Figma variables, mirrored 1:1 in `app/globals.css` `@theme`; type styles are Tailwind
  utilities named after the Figma text styles. Desktop and mobile Figma frames that differ structurally are separate
  component trees switched at 1024px (`desk:`).
- **SEO** — `lib/seo.ts` `pageMetadata()` gives each indexable page its canonical, Open Graph and Twitter tags and
  its static card from `public/og/`; `app/sitemap.ts`, `app/robots.ts`; JSON-LD for products, categories
  (breadcrumbs), Client Care (FAQPage) and The House (fictional Organization + Store hours, no street addresses).
- **Security headers** — `next.config.ts`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  (`geolocation=(self)`, camera / microphone / payment / usb off), `X-Frame-Options`, HSTS; `X-Powered-By` off.

## Structure

```
app/(site)/            site pages — Home, New Arrival, Women, Product Detail, Shopping Bag (site Header/Footer)
app/(checkout)/        checkout pages — Delivery, Payment (CheckoutHeader + CheckoutFooterStrip, no site nav)
components/layout/     Header, NavItem, MegaMenu (desktop category panel, driven by lib/nav `menu`), MobileMenu, Footer
components/checkout/   CheckoutHeader, CheckoutFooterStrip, CheckoutDeliveryView, ContactSection,
                       AddressSection, AddressFields (shared street-address group), AddressAutocomplete,
                       DeliveryMethodSection, DeliveryOption, ErrorSummary, SummaryToggle, FormField,
                       CheckoutPaymentView, ReviewRow, PaymentMethodSection, CardForm, CvcHelpPopover,
                       GiftCardField
components/ui/         Button, Icons, Blob, SafeImage, ProductCard, FilterChip, WishlistButton, EmailField,
                       ColorSwatch, AccordionItem, SortMenu, IconButton, GalleryThumbnail, QuantityStepper,
                       Checkbox, TextField, SelectField, CheckoutSteps, Overlay (scrim+drawer/sheet/lightbox, focus trap)
components/home/       HomeDesktop, HomeMobile, heroBags
components/collection/ ProductCollection (shared filter row, applied-filter tags, grid with editorial slots, loading,
                       no-results, load more — state in the URL via history.pushState), FiltersOverlay (drawer/sheet,
                       draft until "Show N pieces"), NoResults
components/category/   CategoryPage (shared Women/Men/Bags template + metadata + breadcrumb JSON-LD), CutoutStage
                       (blob + cut-outs for heroes and editorial images), SilhouetteTiles, EditorialBlocks (feature + promo)
components/new-arrivals/  NewArrivalDesktop/Mobile, CollectionSection (New Arrival config for ProductCollection), Promises
components/products/   ProductDetailView, ProductGallery(+Mobile), GalleryLightbox, ProductPurchasePanel,
                       MiniBagDrawer, MobileAddedSheet, CraftSection, RelatedProducts (shared w/ Bag)
components/bag/        BagView, BagLineItem, SavedForLaterItem, PromoCodeField, GiftOption,
                       QuickCheckoutCard, EmptyBag
components/order/      OrderSummary — shared by Bag and Checkout Delivery (composition-based: items/promo/
                       cta/footer are opt-in slots so each page supplies only what it needs)
lib/routes.ts          routes linked before their page exists (no prefetch; audit "pending")
lib/nav.ts             navigation config + active-route helper; a NavLink with `menu` gets a desktop mega-menu
components/ui/CutoutImage  cut-out with optional Figma image-fill crop (cards, PDP gallery, stages, tiles, mega-menu)
lib/products.ts        product data model (shared by every grid/card/PDP) — 13 products, each `type: "bag"`;
                       getRelatedProducts() feeds "Complete the Chapter", the mini bag and the bag page; `alsoIn` cross-lists a piece
                       on other category pages, `cardDetail` is the card subtitle
lib/collection.ts      collection model: facets (type, audience ?for=, edit ?edit=, colour, grouped materials, price),
                       sort, URL parse/serialise, filtering
lib/categories.ts      category page configs (hero, silhouette tiles, facets, editorial blocks, SEO, mega-menu)
lib/format.ts          shared Intl.NumberFormat price formatter
lib/promos.ts          mock promo codes (AUTUMN10 10% off, FREESHIP, SPRING24 expired)
lib/bag/               bag state (context + localStorage: lines, saved-for-later, gift, promo, subtotal/total)
lib/wishlist/          wishlist state (context + localStorage; merged into the signed-in account so it follows you)
lib/checkout/          CheckoutContext (sessionStorage — never raw card data, see Security below), validation
                       schema, mock address autocomplete, delivery pricing/ETA (computed from today), card
                       brand/Luhn/expiry/CVC validation + formatting, gift card lookup, state tax rate table
lib/orders.ts          order creation/persistence (localStorage) — payment field stores only {brand, last4}
lib/address/countries.ts  country-driven address data: per-country region list + label (State / Province / Prefecture /
                       County / none), postal label + rule, phone dial code + format; migrateAddress() maps legacy names → codes.
                       Add a country = one entry here (+ optional mock autocomplete / tax rate)
lib/auth/SessionContext.tsx  the only auth module — SessionProvider + useSession(): mock sign-in / create account /
                       sign out / password reset, accounts registry (coach.accounts.v1) with saved addresses + default,
                       session (coach.session.v1: {email, firstName, lastName, createdAt}), safeNextPath() for ?next=
components/errors/     ErrorState / ErrorStage (Figma 404 / 500 / Offline stage), NotFoundContent (404, also order + shared
                       wishlist misses), ServerErrorCard (every error boundary, never shows the error), OfflineNotice
                       (online/offline events, auto-recovers), DevErrorTrigger (dev only: /__test/global-error)
app/not-found.tsx, app/(site)/not-found.tsx, app/error.tsx, app/(site|checkout)/error.tsx, app/global-error.tsx
app/(site)/%5F%5Ftest/*  /__test/error, /__test/offline, /__test/global-error — development only, 404 in production
components/the-house/  TheHouseView (#story #craftsmanship #stores #careers; state-settled anchor scroll), StoreLocator
                       (search by name / ZIP / neighbourhood, distance sort, illustrated map with linked pins),
                       BookingDialog (reason / day / time from store hours, country-aware phone, AP- reference)
lib/stores.ts          the one boutique list — checkout Collect in Store, orders, The House (hours, services, slots)
lib/storeLocator.ts    store search + a small New York gazetteer (no geocoding service); lib/careers.ts openings;
                       lib/appointments.ts (coach.appointments.v1)
components/client-care/  ClientCareView (topic cards → Contact / Shipping & Returns / Leather Care panels, FAQ accordions,
                       hash anchors #contact #shipping #leather-care #faq #personalisation), ContactForm (validation,
                       signed-in prefill, CO- order numbers, sent state + reference, stored in coach.contact.v1)
lib/policies.ts        delivery / returns / hours / contact policies — read from checkout's own config so Client Care,
                       PDP, bag and checkout never disagree; contact details are deliberately fictional (555-01xx, .example)
lib/clientCare.ts      FAQ (+ FAQPage JSON-LD source), care guide, contact topics + validation
components/search/     SearchOverlay (header icon + "/": combobox/listbox suggestions, products, collections, recent,
                       focus trap, never stacked with mega-menus), SearchResultsView (/search?q= on the shared
                       ProductCollection: For Her/For Him + sort, no-results with spelling help), SearchDefaults
lib/search.ts          catalogue search: accent/case-insensitive, plural + prefix matching, ranked name > type > colour >
                       other; phrase/collection suggestions, highlight, "did you mean", recent searches (localStorage)
components/ui/FitBadge  product-card badge that measures its room and steps down Figma styles instead of truncating
components/wishlist/   WishlistView — saved pieces grid (compact/medium cards + Move to bag), remove/move toasts with
                       8 s Undo, signed-out save prompt, empty state, Share (?items= link → read-only shared view)
components/account/    AccountView (?next= / ?tab=), SignedOutView (Sign In + Create Account cards, error,
                       reset-sent), AccountDashboard (overview, orders, details), AddressBook (CRUD + default)
lib/share.ts           Web Share API helper with clipboard fallback
lib/seo.ts             SITE_URL (from NEXT_PUBLIC_SITE_URL), pageMetadata() (canonical + OG + Twitter), OG card registry
app/sitemap.ts, app/robots.ts  indexable pages + every product; noindex routes stay out of the sitemap
public/og/             static 1200×630 social cards (scripts/og.ts — pages + one per product)
scripts/               audit.ts (7-pass QA), lighthouse.ts (mobile + desktop scores), og.ts (social cards)
app/globals.css        Figma tokens (@theme), type styles, intro animation
```

## Pages

- [x] 1. Foundations + Home
- [x] 2. New Arrival (incl. States & Overlays: sort dropdown, filters drawer/sheet, loading skeleton, no results)
- [x] 3. Product Detail (incl. States & Overlays: add-to-bag states, mini bag drawer, sold-out/notify, personalise, gallery zoom, mobile sticky bar + added sheet)
- [x] 4. Shopping Bag (incl. States & Overlays: promo open/applied/error, gift selected, line removed+undo, sold-out & qty limit, empty bag, checkout states, mobile sticky checkout)
- [x] 5a. Checkout Delivery (incl. States & Overlays: validation errors, address autocomplete, delivery option states, collect-in-store, signed-in saved addresses, continue button states, mobile summary expanded)
- [x] 5b. Checkout Payment (incl. States & Overlays: card validation, CVC help popover, billing-different-address, declined → success, PayPal/Apple Pay selection, gift card apply/remove, place-order guards, mobile sticky bar)
- [x] 6. Order Confirmation (progress by stage, details, manage-order window, create account from the order, resend e-mail, loading skeleton, not-found)
- [x] 7a. Women (incl. States & Overlays: mega-menu, filters applied, no results, card hover, mobile menu, filter sheet)
- [x] 7b. Men (same template + config; States & Overlays incl. Men mega-menu)
- [x] 7c. Bags (cross-category: every `type: "bag"`; For Her / For Him chips, grouped Leather material, curated edits)
- [x] 11. Account (sign in / error / reset sent / create account, signed-in overview, orders, address book, details; ?next= returns to checkout)
- [x] 12. Wishlist (Move to bag, remove + undo, signed-out prompt, empty state, share link, account sync)
- [x] 13. Search (overlay with suggestions + keyboard, results page with filters/sort, no-results, recent searches)
- [x] 14. Client Care (contact form + sent, shipping & returns from policies, leather care, FAQ, anchors)
- [x] 15. The House (story, craftsmanship, store locator + booking, careers; no pending routes left)
- [x] 16. 404 & Errors (real 404s, 500 boundaries with retry, global error, offline state; dev-only test hooks)

## Security

Card number, expiry, and CVC are kept only in `CheckoutPaymentView`'s local component state (`useState`) —
never written to `localStorage`, `sessionStorage`, the URL, or `console`. The persisted `CheckoutContext`
(sessionStorage) and the saved `Order` record (`lib/orders.ts`, localStorage) only ever receive the selected
payment method and, for completed card orders, the card brand + last 4 digits.

Accounts are a **front-end demo, not real security**. Passwords are never stored: `lib/auth/SessionContext.tsx`
keeps only a salted SHA-256 digest (Web Crypto) so a sign-in can be checked. Failed sign-ins show one generic
message, password-reset always shows the same confirmation (no account enumeration), and `?next=` only accepts
same-site paths (no open redirects). The audit asserts that no plain-text password appears anywhere in storage.

## Decisions

Design fidelity first: nothing visual changes without sign-off; where Figma and an accessibility or honesty rule
disagree, the conflict is flagged or decided explicitly. Launch-prep decisions:

- **Concept-study note on Home.** Home has no footer in Figma; the note is a caption under the CTAs (mobile) / under
  the intro copy (desktop), in the footer caption style.
- **PDP mobile gallery dots** keep Figma's look but sit in transparent 24×24 buttons (WCAG 2.2 target size), so the
  dots are 24px apart instead of 12px.
- **Checkout CTAs are always full contrast.** "Continue to payment" and "Place order" (incl. the mobile sticky bar)
  are always usable — pressing them with gaps shows the validation errors — so they render in the normal primary
  style at all times. Figma's dimmed disabled style (ink at 35%, 2.47:1) is kept only for buttons that genuinely can't
  be used (e.g. a sold-out Add to Bag), which are `disabled` and exempt from contrast rules.
- **No real Coach details anywhere.** Store streets are invented, contact details are `555-01xx` / `.example`, the
  footer's Instagram / Pinterest / YouTube are plain text (no links), mock autocomplete avoids real Coach store
  addresses, and the audit scans pages, source and this README for real Coach / Tapestry addresses, phone and domains.
- **CSP without nonces.** A nonce would force every page to render per request; the static CSP keeps the pages static.
  `'unsafe-inline'` is needed for Next's inline bootstrap scripts and inline style attributes; everything else is
  `'self'`, no `'unsafe-eval'` in production, no framing.
- **robots.txt doesn't Disallow noindex pages.** A disallowed URL can't be fetched, so its `noindex` is never read and
  the bare URL can be indexed from links (every header links to bag / account / wishlist). They carry `noindex`
  instead and are left out of the sitemap.
- **Static OG cards** are generated once (`npm run og`) and committed, rather than rendered per request.
- **LCP images** use `loading="eager"` + `fetchPriority="high"` on the one LCP candidate per tree instead of Next 16's
  deprecated `priority` (whose `<head>` preload also fired for the CSS-hidden desktop / mobile twin).
- **Home fade-in** starts at opacity 0.01, not 0 — identical to the eye, but Chrome doesn't count paints at opacity 0,
  so Home reported no First Contentful Paint at all on mobile.

## Known limitations

- Front-end only: accounts, orders, payments, appointments and contact messages are mocked in browser storage —
  nothing reaches a server and nothing syncs between devices. Accounts are a demo, not real security (see Security).
- Search, store distances and address autocomplete use small local datasets (13 products, a New York gazetteer).
- Lighthouse SEO is 66 on Bag, Checkout and Search by design — they are `noindex` (the only failing audit is
  "page is blocked from indexing").
- Desktop and mobile hero trees are both in the HTML (CSS-switched), so a phone also downloads the desktop hero images.

## Deploy (Vercel)

1. Push the repo to GitHub / GitLab / Bitbucket and **Import** it in Vercel — the Next.js preset is detected
   (build `next build`, output `.next`, install `npm install`). Node 22+.
2. **Settings → Environment Variables:** `NEXT_PUBLIC_SITE_URL` = the production origin (e.g. `https://coach.example.dev`)
   for **Production**. For **Preview**, leave it unset or set the preview domain.
3. **Deploy.** Then check: `/robots.txt` and `/sitemap.xml` show the production origin; `curl -I /` shows the CSP and
   other security headers; a product URL's OG card renders in a link-preview debugger.
4. Optionally run the audit against the deployment: `AUDIT_BASE_URL=https://… npm run audit:run`.
5. Add the custom domain under **Settings → Domains**, update `NEXT_PUBLIC_SITE_URL` to it, and redeploy (it is
   inlined at build time).
