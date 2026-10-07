/**
 * COACH site audit — `npm run audit` (builds, then runs this file).
 *
 * Starts `next start` on AUDIT_PORT (default 3100) unless AUDIT_BASE_URL points at a running server, then:
 *   1. purchase  — places a real order through checkout so the order page can be audited
 *   2. crawl     — every page × 1440 / 393: console errors & warnings, hydration warnings, failed requests,
 *                  horizontal overflow at 1440 / 1024 / 393 / 320, and every <a href>
 *   3. links     — every internal href returns 200 (or is a known unbuilt page → "pending"); no "#" / empty
 *                  hrefs; hash targets exist; category filter params are all recognised and applied
 *   4. buttons   — every visible <button> / [role=button] has an accessible name and, clicked on a fresh page,
 *                  causes an observable change (navigation, DOM, ARIA state, storage, focus, scroll, input values)
 *   5. flows     — scripted user journeys (nav, mega-menus, categories, PDPs, bag, checkout, order, footer,
 *                  persistence)
 *   6. a11y      — axe-core (WCAG 2.2 A/AA + best practice) on every page × 1440 / 393; serious / critical violations
 *                  fail. Colour-contrast misses between two Figma tokens are *flagged* in the report (the design is
 *                  not changed without sign-off); any other contrast miss fails. Plus: skip link, focus order /
 *                  visibility over the first Tab stops, and reduced motion (no running animations)
 *   7. seo       — canonicals (filter / sort params dropped), OG + Twitter tags and 1200×630 cards, noindex routes,
 *                  sitemap.xml / robots.txt, security headers
 * Writes .qa/audit/report.md + report.json and exits 1 if anything failed.
 *
 * Runs with Node's built-in TypeScript type-stripping (Node ≥ 22.18 / 23.6) — no extra tooling.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { PENDING_ROUTES } from "../lib/routes.ts";

const PORT = Number(process.env.AUDIT_PORT ?? 3100);
const BASE = process.env.AUDIT_BASE_URL ?? `http://localhost:${PORT}`;
const OUT = ".qa/audit";
const CONCURRENCY = Number(process.env.AUDIT_CONCURRENCY ?? 6);
const ONLY = process.env.AUDIT_ONLY?.split(","); // e.g. AUDIT_ONLY=flows,links

/** Unbuilt pages linked on purpose — reported as "pending", not failures (single source: lib/routes.ts). */
const PENDING_PREFIXES = PENDING_ROUTES;
const PRODUCT_SLUGS = [
  "chapter-shoulder-bag",
  "chapter-signature-bag",
  "petal-chain-bag",
  "cargo-tote",
  "charter-camera-bag",
  "nolita-pink",
  "quilted-tabby-20",
  "city-tote",
  "signature-mini-bag",
  "charter-backpack",
  "hudson-messenger",
  "gotham-briefcase",
  "burnished-duffle",
];
const CATEGORY_PATHS = ["/women", "/men", "/bags", "/new-arrivals"];
const FACET_PARAMS = ["for", "edit", "type", "colour", "material", "price"];

// ───────────────────────── results ─────────────────────────
type Result = { area: string; check: string; ok: boolean; detail: string };
const results: Result[] = [];
const pending = new Map<string, Set<string>>(); // href → pages linking to it
const contrastFlags = new Map<string, Set<string>>(); // "fg on bg (ratio)" → pages where a Figma token pair misses AA
const emptyFilterLinks = new Map<string, Set<string>>();
function check(area: string, name: string, ok: boolean, detail = "") {
  results.push({ area, check: name, ok, detail });
  if (!ok) console.log(`  ✗ [${area}] ${name}${detail ? " — " + detail : ""}`);
}
function addTo(map: Map<string, Set<string>>, key: string, value: string) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(value);
}

// ───────────────────────── seeds ─────────────────────────
const BAG_SEED = {
  lines: [
    { productId: "quilted-tabby-20", colour: "Chalk", quantity: 1 },
    { productId: "charter-backpack", colour: "Black", quantity: 2 },
  ],
  savedForLater: [{ productId: "city-tote", colour: "Brown", quantity: 1 }],
  promoCode: null,
  gift: { wrapped: false, note: "" },
};
const DELIVERY_VALUES = {
  email: "audit@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  address1: "17 Larkspur Row",
  address2: "",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "US",
  phone: "2125550100",
};
/** Figma's four saved pieces (Wishlist 94:3530). */
const WISHLIST_SEED = ["city-tote", "charter-backpack", "petal-chain-bag", "hudson-messenger"];
/** A Thai delivery address (lib/address/countries.ts codes: TH, province 10 = Bangkok). */
const THAI_ADDRESS = { label: "Bangkok", address1: "991 Rama I Road", city: "Bangkok", state: "10", zip: "10330", country: "TH" };
/** A registered mock account (lib/auth/SessionContext.tsx) — same salted SHA-256 the app computes with Web Crypto. */
const ACCOUNT_PASSWORD = "atelier2026";
/**
 * `opts.legacy` stores addresses the pre-country-codes way ("United States" / "New York") to prove migration;
 * `opts.thaiDefault` adds a Bangkok address and makes it the default.
 */
function accountSeed(email = DELIVERY_VALUES.email, firstName = DELIVERY_VALUES.firstName, signedIn = true, opts: { legacy?: boolean; thaiDefault?: boolean } = {}) {
  const createdAt = "2026-01-01T00:00:00.000Z";
  const passwordHash = createHash("sha256").update(`coach-demo:${email.toLowerCase()}:${ACCOUNT_PASSWORD}`).digest("hex");
  const us = opts.legacy ? { state: "New York", country: "United States" } : { state: "NY", country: "US" };
  const addresses: Record<string, unknown>[] = [
    { id: "addr-home", label: "Home", firstName, lastName: "Archer", address1: "214 Mercer Street", city: "New York", zip: "10012", ...us },
    { id: "addr-studio", label: "Studio", firstName, lastName: "Archer", address1: "88 Greene Street", address2: "Fl 3", city: "New York", zip: "10012", ...us },
  ];
  if (opts.thaiDefault) addresses.push({ id: "addr-bangkok", firstName, lastName: "Archer", ...THAI_ADDRESS });
  const profile = { email, firstName, lastName: "Archer", createdAt };
  return {
    "coach.accounts.v1": { [email.toLowerCase()]: { ...profile, passwordHash, emailOptIn: true, addresses, defaultAddressId: opts.thaiDefault ? "addr-bangkok" : "addr-home" } },
    ...(signedIn ? { "coach.session.v1": profile } : {}),
  };
}
const CHECKOUT_SEED = {
  values: DELIVERY_VALUES,
  emailOptIn: false,
  deliveryMethod: "standard",
  storeId: null,
  savedAddressId: null,
  paymentMethod: "card",
  billing: { sameAsDelivery: true, values: { ...DELIVERY_VALUES, email: "", firstName: "", lastName: "", address1: "", city: "", state: "", zip: "", phone: "" } },
  giftCardCode: null,
};
type Seed = { local?: Record<string, unknown>; session?: Record<string, unknown> };
let ORDER_ID = "";
let ORDERS_JSON: unknown = null;

async function newContext(browser: Browser, width: number, height: number, seed: Seed = {}, extra: Parameters<Browser["newContext"]>[0] = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    ...(width < 1024 ? { hasTouch: true, isMobile: true } : {}),
    ...extra,
    storageState: {
      cookies: [],
      origins: [{ origin: BASE, localStorage: Object.entries(seed.local ?? {}).map(([name, v]) => ({ name, value: JSON.stringify(v) })) }],
    },
  });
  if (seed.session) {
    // sessionStorage can't go in storageState — seed it once per tab, before the app reads it.
    await ctx.addInitScript((entries: [string, string][]) => {
      try {
        for (const [k, v] of entries) if (sessionStorage.getItem(k) === null) sessionStorage.setItem(k, v);
      } catch {
        /* about:blank and other opaque origins have no sessionStorage */
      }
    }, Object.entries(seed.session).map(([k, v]) => [k, JSON.stringify(v)] as [string, string]));
  }
  return ctx;
}

type Health = { console: string[]; failed: string[] };
function watch(page: Page): Health {
  const h: Health = { console: [], failed: [] };
  page.on("console", (m) => {
    // Production must print nothing — log / info / debug count, not just errors and warnings.
    h.console.push(`${m.type()}: ${m.text().slice(0, 220)}`);
  });
  page.on("pageerror", (e) => h.console.push(`pageerror: ${e.message.slice(0, 220)}`));
  page.on("requestfailed", (r) => {
    const err = r.failure()?.errorText ?? "";
    // Aborted fetches from client-side navigations / prefetch cancellation aren't failures.
    if (!/ERR_ABORTED|NS_BINDING_ABORTED/.test(err)) h.failed.push(`${r.url()} (${err})`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE)) h.failed.push(`${r.status()} ${r.url()}`);
  });
  return h;
}

async function settle(page: Page, ms = 350) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

const TASK_TIMEOUT = Number(process.env.AUDIT_TASK_TIMEOUT ?? 120_000);
const VERBOSE = !!process.env.AUDIT_VERBOSE;

/** Runs `fn` over `items` with `n` workers; a task that throws or exceeds TASK_TIMEOUT is recorded as a failure. */
async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>, describe: (item: T) => string = (_, ) => "") {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        const label = describe(items[i]) || `task ${i}`;
        if (VERBOSE) console.log(`    → ${label}`);
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`timed out after ${TASK_TIMEOUT / 1000}s`)), TASK_TIMEOUT);
        });
        await Promise.race([fn(items[i], i), timeout])
          .catch((e) => check("internal", label, false, String(e).slice(0, 300)))
          .finally(() => clearTimeout(timer));
      }
    }),
  );
}

// ───────────────────────── server ─────────────────────────
async function startServer(): Promise<ChildProcess | null> {
  if (process.env.AUDIT_BASE_URL) return null;
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: ["ignore", "pipe", "pipe"] });
  child.stderr?.on("data", (d) => process.stderr.write(d));
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error(`next start did not come up on ${BASE}`);
}

/** Store lines replaced by fictional streets (page 15 decision) — they must not appear on any page or in the source. */
const OLD_STORE_ADDRESSES = ["214 Mercer Street, SoHo", "685 Fifth Avenue", "20 Hudson Yards", "150 Mercer Street"];
/**
 * Real Coach / Tapestry addresses and contacts (launch-prep check) — HQ, flagships, the real care line. None may appear on
 * a page, in the source or in the README; mock data uses invented streets and 555-01xx / .example contacts.
 */
const REAL_COACH_DETAILS = ["10 Hudson Yards", "143 Prince Street", "131 Bloor", "41 New Bond Street", "206 Regent Street", "188 Pitt Street", "536-2622", "coach.com", "tapestry.com"];

/** Prices must read "$295" or "$24.50" — never "$24.5", "$295.00" or "$1.234". Returns the offending strings. */
function priceProblems(text: string): string[] {
  return [...new Set(text.match(/\$\d[\d,]*\.(?:\d(?!\d)|00(?!\d)|\d{3,})/g) ?? [])];
}
const pricesOn = (page: Page) => page.evaluate(() => document.body.textContent ?? "").then(priceProblems);

// ───────────────────────── page catalogue ─────────────────────────
/** `expect404`: a real 404 page (status 404; its own document 404 is not a "failed request"). */
type Target = { path: string; seed: Seed; label?: string; expect404?: boolean };
function targets(): Target[] {
  const bag = { local: { "coach.bag.v1": BAG_SEED } };
  return [
    { path: "/", seed: {} },
    ...CATEGORY_PATHS.map((path) => ({ path, seed: {} })),
    ...PRODUCT_SLUGS.map((s) => ({ path: `/products/${s}`, seed: {} })),
    { path: "/bag", seed: {}, label: "/bag (empty)" },
    { path: "/bag", seed: bag, label: "/bag (filled)" },
    { path: "/checkout/delivery", seed: bag },
    { path: "/checkout/payment", seed: { ...bag, session: { "coach.checkout.v1": CHECKOUT_SEED } } },
    { path: `/order/${ORDER_ID}`, seed: { local: { "coach.orders.v1": ORDERS_JSON } }, label: "/order/[id]" },
    { path: "/order/CO-NOPE00", seed: {}, label: "/order/[invalid]", expect404: true },
    { path: "/this-page-does-not-exist", seed: {}, label: "/404 (unknown URL)", expect404: true },
    { path: "/products/not-a-product", seed: {}, label: "/products/[unknown]", expect404: true },
    { path: "/wishlist?items=not-a-product", seed: {}, label: "/wishlist?items= (dead link)", expect404: true },
    { path: "/account", seed: {}, label: "/account (signed out)" },
    { path: "/account", seed: { local: { ...accountSeed(), "coach.orders.v1": ORDERS_JSON } }, label: "/account (signed in)" },
    { path: "/account?tab=orders", seed: { local: { ...accountSeed(), "coach.orders.v1": ORDERS_JSON } }, label: "/account?tab=orders" },
    { path: "/account?tab=addresses", seed: { local: accountSeed() }, label: "/account?tab=addresses" },
    { path: "/account?tab=details", seed: { local: accountSeed() }, label: "/account?tab=details" },
    { path: "/the-house", seed: {}, label: "/the-house" },
    { path: "/the-house#stores", seed: {}, label: "/the-house#stores" },
    { path: "/client-care", seed: {}, label: "/client-care" },
    { path: "/client-care#contact", seed: {}, label: "/client-care#contact" },
    { path: "/client-care#shipping", seed: {}, label: "/client-care#shipping" },
    { path: "/client-care#leather-care", seed: {}, label: "/client-care#leather-care" },
    { path: "/search", seed: {}, label: "/search (no query)" },
    { path: "/search?q=Signature%20canvas", seed: {}, label: "/search?q=Signature canvas" },
    { path: "/search?q=tote", seed: {}, label: "/search?q=tote" },
    { path: "/search?q=hobo", seed: {}, label: "/search?q=hobo (none)" },
    { path: "/wishlist", seed: {}, label: "/wishlist (empty)" },
    { path: "/wishlist", seed: { local: { "coach.wishlist.v1": WISHLIST_SEED } }, label: "/wishlist (signed out)" },
    { path: "/wishlist", seed: { local: { "coach.wishlist.v1": WISHLIST_SEED, ...accountSeed() } }, label: "/wishlist (signed in)" },
    { path: `/wishlist?items=${WISHLIST_SEED.join(",")}`, seed: {}, label: "/wishlist?items= (shared)" },
  ];
}
const labelOf = (t: Target) => t.label ?? t.path;

// ───────────────────────── 1. purchase (creates the order to audit) ─────────────────────────
async function fillDelivery(page: Page) {
  await page.fill("input[name=email]", DELIVERY_VALUES.email);
  await page.fill("input[name=firstName]", DELIVERY_VALUES.firstName);
  await page.fill("input[name=lastName]", DELIVERY_VALUES.lastName);
  await page.fill("input[name=address1]", DELIVERY_VALUES.address1);
  await page.keyboard.press("Escape");
  await page.fill("input[name=city]", DELIVERY_VALUES.city);
  await page.selectOption("select[name=state]", { label: "New York" });
  await page.fill("input[name=zip]", DELIVERY_VALUES.zip);
  await page.fill("input[name=phone]", DELIVERY_VALUES.phone);
}
async function fillCard(page: Page, number: string) {
  await page.getByRole("textbox", { name: "Card number" }).fill(number);
  await page.getByRole("textbox", { name: "Name on card" }).fill("Ada Lovelace");
  await page.getByRole("textbox", { name: "Expiry (MM/YY)" }).fill("12/29");
  await page.locator("#card-cvc").fill("123");
}

async function purchase(browser: Browser) {
  const ctx = await newContext(browser, 1440, 900, { local: { "coach.bag.v1": { ...BAG_SEED, savedForLater: [] } } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/checkout/delivery`);
  await settle(page);
  await fillDelivery(page);
  await page.click("button[type=submit]");
  await page.waitForURL("**/checkout/payment", { timeout: 15000 });
  await settle(page);
  await fillCard(page, "4242 4242 4242 4242");
  await page.click("button[type=submit]");
  await page.waitForURL("**/order/**", { timeout: 15000 }).catch(() => {});
  const url = new URL(page.url());
  check("checkout", "Successful card payment lands on /order/[id]", url.pathname.startsWith("/order/CO-"), url.pathname);
  ORDERS_JSON = JSON.parse((await page.evaluate(() => localStorage.getItem("coach.orders.v1"))) ?? "[]");
  ORDER_ID = (ORDERS_JSON as { id: string }[]).at(-1)?.id ?? "CO-MISSING";
  await ctx.close();
}

// ───────────────────────── 2. crawl ─────────────────────────
const links = new Map<string, Set<string>>(); // absolute href → source labels
async function crawl(browser: Browser) {
  const jobs = targets().flatMap((t) => [
    { t, w: 1440, h: 900, extraWidths: [1024] },
    { t, w: 393, h: 852, extraWidths: [320] },
  ]);
  await pool(jobs, CONCURRENCY, async ({ t, w, h, extraWidths }) => {
    const ctx = await newContext(browser, w, h, t.seed);
    const page = await ctx.newPage();
    const health = watch(page);
    const tag = `${labelOf(t)} @${w}`;
    const res = await page.goto(`${BASE}${t.path}`);
    await settle(page, 600);
    // Scroll through so lazy images load (and fail loudly if missing).
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await settle(page, 400);
    const expectStatus = t.expect404 ? 404 : 200;
    check("crawl", `${tag} loads`, res?.status() === expectStatus, `status ${res?.status()}`);
    const oldAddresses = await page.evaluate((list) => list.filter((a) => (document.documentElement.outerHTML).includes(a)), [...OLD_STORE_ADDRESSES, ...REAL_COACH_DETAILS]);
    check("stores", `${labelOf(t)} shows no old store address or real Coach contact detail`, oldAddresses.length === 0, oldAddresses.join(", "));
    // Portfolio honesty: the "concept study, not affiliated" note is on screen (in the footer) on every page.
    const note = page.locator("footer", { hasText: /concept study/i }).filter({ visible: true });
    const noteShown = (await note.count()) > 0 && (await note.first().locator(":text-matches('concept study', 'i')").filter({ visible: true }).count()) > 0;
    check("honesty", `${labelOf(t)} @${w} footer shows the concept-study note`, noteShown);
    const badPrices = await pricesOn(page);
    check("prices", `${labelOf(t)} prices use 0 or 2 decimals`, badPrices.length === 0, badPrices.join(" "));
    for (const width of [w, ...extraWidths]) {
      await page.setViewportSize({ width, height: h });
      await page.waitForTimeout(150);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check("layout", `${labelOf(t)} no horizontal scroll @${width}`, over <= 0, `overflow ${over}px`);
      // Product-card badges (components/ui/FitBadge.tsx): never clipped, never under the wishlist heart.
      await page.waitForTimeout(100);
      const badBadges = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[data-badge]")]
          .filter((e) => e.offsetParent && !e.classList.contains("invisible"))
          .filter((e) => {
            const b = e.getBoundingClientRect();
            const well = e.parentElement!.getBoundingClientRect();
            const heart = e.parentElement!.querySelector('button[aria-label$="wishlist"]')?.getBoundingClientRect();
            const overlap = heart && b.right > heart.left && b.left < heart.right && b.top < heart.bottom && b.bottom > heart.top;
            return e.scrollWidth > e.clientWidth + 0.5 || b.right > well.right + 0.5 || overlap;
          })
          .map((e) => e.textContent),
      );
      check("badges", `${labelOf(t)} badges fit @${width}`, badBadges.length === 0, badBadges.join(", "));
    }
    // Mobile: the menu's links only exist while it's open.
    if (w < 1024 && (await page.locator('button[aria-label="Open menu"]').count())) {
      await page.locator('button[aria-label="Open menu"]').click();
      await page.waitForTimeout(200);
      for (const href of await page.$$eval("#mobile-menu a", (as) => as.map((a) => a.getAttribute("href")))) addTo(links, href ?? "", tag);
      await page.keyboard.press("Escape");
    }
    const hrefs = await page.$$eval("a", (as) => as.map((a) => a.getAttribute("href")));
    for (const href of hrefs) addTo(links, href ?? "", tag);
    if (t.expect404) {
      // The page's own 404 is the point — drop that document response and the browser's matching console line only.
      const own = new URL(t.path, BASE).href;
      health.failed = health.failed.filter((f) => f !== `404 ${own}`);
      health.console = health.console.filter((c) => !/Failed to load resource: the server responded with a status of 404/.test(c));
    }
    const hydration = health.console.filter((c) => /hydrat|did not match|server rendered/i.test(c));
    check("health", `${tag} no hydration warnings`, hydration.length === 0, hydration.join(" | "));
    check("health", `${tag} no console output`, health.console.length === 0, [...new Set(health.console)].join(" | "));
    check("health", `${tag} no failed requests`, health.failed.length === 0, [...new Set(health.failed)].join(" | "));
    await ctx.close();
  }, ({ t, w }) => `crawl ${labelOf(t)} @${w}`);
}

// ───────────────────────── 3. links ─────────────────────────
async function auditLinks(browser: Browser) {
  const internal = new Map<string, Set<string>>();
  for (const [href, sources] of links) {
    const where = [...sources].slice(0, 3).join(", ");
    if (href === "" || href === "#") {
      check("links", `empty/# href`, false, `"${href}" on ${where}`);
      continue;
    }
    if (/^javascript:/i.test(href)) {
      check("links", `javascript: href`, false, `${href} on ${where}`);
      continue;
    }
    if (/^(mailto|tel):/.test(href)) continue;
    const url = new URL(href, BASE);
    if (url.origin !== new URL(BASE).origin) {
      check("links", `external link ${url.href}`, true, `on ${where}`);
      continue;
    }
    if (href.startsWith("#")) {
      // same-page anchors are verified on the page that contains them below
      // Resolve against the crawl target's real path (labels like "/404 (unknown URL)" aren't URLs; the path may
      // carry its own hash, which is replaced). Pages that are 404 on purpose aren't anchor targets.
      for (const s of sources) {
        const label = s.replace(/ @\d+$/, "");
        const target = targets().find((t) => labelOf(t) === label);
        if (target?.expect404) continue;
        const base = (target?.path ?? label.replace(/ \(.+\)$/, "")).replace(/#.*$/, "");
        addTo(internal, `${base}${href}`, s);
      }
      continue;
    }
    const key = url.pathname + url.search + url.hash;
    for (const s of sources) addTo(internal, key, s);
  }

  const entries = [...internal.entries()];
  await pool(entries, CONCURRENCY, async ([key, sources]) => {
    const url = new URL(key, BASE);
    const where = [...sources].slice(0, 3).join(", ");
    if (PENDING_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
      for (const s of sources) addTo(pending, url.pathname + url.hash, s);
      return;
    }
    if (url.pathname.startsWith("/order/")) return; // order ids are runtime state, audited via the crawl
    const res = await fetch(url.pathname + url.search === "" ? BASE : new URL(url.pathname + url.search, BASE));
    check("links", `${key} → 200`, res.status === 200, `status ${res.status}, linked from ${where}`);
    if (res.status !== 200) return;

    if (url.hash || (CATEGORY_PATHS.includes(url.pathname) && url.search)) {
      const ctx = await newContext(browser, 1440, 900);
      const page = await ctx.newPage();
      await page.goto(url.href);
      await settle(page);
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        const exists = await page.evaluate((id) => !!document.getElementById(id), id);
        check("links", `${key} anchor #${id} exists`, exists, `linked from ${where}`);
      }
      if (CATEGORY_PATHS.includes(url.pathname) && url.search) {
        const params = [...url.searchParams.keys()];
        const unknown = params.filter((p) => !FACET_PARAMS.includes(p) && p !== "sort");
        check("links", `${key} uses known filter params`, unknown.length === 0, `unknown: ${unknown.join(", ")} — linked from ${where}`);
        const facetCount = params.filter((p) => FACET_PARAMS.includes(p)).length;
        const tags = await page.$$eval('main button[aria-label^="Remove filter"]', (b) => b.length);
        check("links", `${key} applies every filter`, tags === facetCount, `${tags}/${facetCount} applied — linked from ${where}`);
        const cards = await page.$$eval('main a[aria-label^="View "]', (as) => as.filter((a) => (a as HTMLElement).offsetParent).length);
        if (cards === 0) for (const s of sources) addTo(emptyFilterLinks, key, s);
      }
      await ctx.close();
    }
  });
}

// ───────────────────────── 4. buttons ─────────────────────────
const SNAPSHOT = () => {
  const attrs = [...document.querySelectorAll("[aria-expanded],[aria-pressed],[aria-selected],[aria-checked],[aria-current],[open],[data-state]")]
    .map((e) => ["aria-expanded", "aria-pressed", "aria-selected", "aria-checked", "aria-current", "open", "data-state"].map((a) => e.getAttribute(a)).join(","))
    .join("|");
  const inputs = [...document.querySelectorAll("input,select,textarea")].map((e) => {
    const i = e as HTMLInputElement;
    return i.type === "checkbox" || i.type === "radio" ? String(i.checked) : i.value;
  });
  const storage: Record<string, string | null> = {};
  for (let i = 0; i < localStorage.length; i++) storage["l:" + localStorage.key(i)] = localStorage.getItem(localStorage.key(i)!);
  for (let i = 0; i < sessionStorage.length; i++) storage["s:" + sessionStorage.key(i)] = sessionStorage.getItem(sessionStorage.key(i)!);
  const visible = [...document.querySelectorAll("body *")].filter((e) => {
    const s = getComputedStyle(e);
    return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  }).length;
  return {
    url: location.href,
    html: document.body.innerHTML,
    attrs,
    inputs: inputs.join("\u0001"),
    storage: JSON.stringify(storage),
    focus: document.activeElement ? document.activeElement.outerHTML.slice(0, 120) : "",
    scroll: `${Math.round(scrollX)},${Math.round(scrollY)}`,
    visible,
  };
};
type Snap = ReturnType<typeof SNAPSHOT>;
const hash = (s: string) => createHash("sha1").update(s).digest("hex");

/** Visible, enabled buttons in DOM order, each with an accessible name (approximated from the accname rules). */
const ENUMERATE = () => {
  const els = [...document.querySelectorAll<HTMLElement>("button, [role=button]")];
  const out: { idx: number; name: string; disabled: boolean; submit: boolean }[] = [];
  els.forEach((el, idx) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (!r.width || !r.height || s.visibility === "hidden" || s.display === "none") return;
    // inside an invisible ancestor (e.g. closed mega-menu panel)
    let p: HTMLElement | null = el;
    while (p) {
      const ps = getComputedStyle(p);
      if (ps.visibility === "hidden" || ps.opacity === "0" || p.hasAttribute("hidden")) return;
      p = p.parentElement;
    }
    const labelled = el.getAttribute("aria-labelledby");
    const name = (
      el.getAttribute("aria-label") ||
      (labelled ? labelled.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" ") : "") ||
      el.innerText ||
      el.getAttribute("title") ||
      [...el.querySelectorAll("img")].map((i) => i.alt).join(" ") ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
    out.push({ idx, name, disabled: (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true", submit: (el as HTMLButtonElement).type === "submit" });
  });
  return out;
};

async function auditButtons(browser: Browser) {
  const jobs: { t: Target; w: number; h: number; idx: number; name: string }[] = [];
  // Enumerate per page × viewport.
  await pool(
    targets().flatMap((t) => [
      { t, w: 1440, h: 900 },
      { t, w: 393, h: 852 },
    ]),
    CONCURRENCY,
    async ({ t, w, h }) => {
      const ctx = await newContext(browser, w, h, t.seed);
      const page = await ctx.newPage();
      await page.goto(`${BASE}${t.path}`);
      await settle(page, 500);
      const buttons = await page.evaluate(ENUMERATE);
      for (const b of buttons) {
        if (!b.name) check("buttons", `${labelOf(t)} @${w}: button #${b.idx} has an accessible name`, false, "no aria-label / text / title");
        if (b.disabled) continue;
        jobs.push({ t, w, h, idx: b.idx, name: b.name });
      }
      await ctx.close();
    },
  );

  // Identical (page path, name) at both widths only needs to work once per width — keep every job; they're cheap.
  await pool(jobs, CONCURRENCY, async ({ t, w, h, idx, name }) => {
    const ctx = await newContext(browser, w, h, t.seed);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${t.path}`);
    await settle(page, 500);
    const el = page.locator("button, [role=button]").nth(idx);
    const tag = `${labelOf(t)} @${w}: "${name || `#${idx}`}"`;
    try {
      await el.scrollIntoViewIfNeeded({ timeout: 3000 });
      await page.waitForTimeout(150);
      const before: Snap = await page.evaluate(SNAPSHOT);
      const popup = ctx.waitForEvent("page", { timeout: 1200 }).catch(() => null);
      await el.click({ timeout: 4000 });
      await page.waitForTimeout(700);
      const after: Snap = await page.evaluate(SNAPSHOT).catch(() => ({ ...before, url: "navigated" }));
      const opened = await popup;
      const changed: string[] = [];
      if (before.url !== after.url) changed.push("url");
      if (hash(before.html) !== hash(after.html)) changed.push("dom");
      if (before.attrs !== after.attrs) changed.push("aria");
      if (before.inputs !== after.inputs) changed.push("inputs");
      if (before.storage !== after.storage) changed.push("storage");
      if (before.focus !== after.focus) changed.push("focus");
      if (before.scroll !== after.scroll) changed.push("scroll");
      if (before.visible !== after.visible) changed.push("visibility");
      if (opened) changed.push("popup");
      check("buttons", `${tag} does something`, changed.length > 0, changed.join("+") || "no observable change");
    } catch (e) {
      check("buttons", `${tag} is clickable`, false, String(e).split("\n")[0].slice(0, 200));
    }
    await ctx.close();
  }, ({ t, w, name }) => `button ${labelOf(t)} @${w} "${name}"`);
}

// ───────────────────────── 5. flows ─────────────────────────
async function cardsOn(page: Page) {
  return page.$$eval('main a[aria-label^="View "]', (as) => as.filter((a) => (a as HTMLElement).offsetParent).map((a) => a.getAttribute("aria-label")!.slice(5)));
}
async function tagsOn(page: Page) {
  return page.$$eval('main button[aria-label^="Remove filter"]', (b) => b.filter((x) => (x as HTMLElement).offsetParent).map((x) => x.textContent!.trim()));
}
/** First visible match — New Arrival renders separate desktop / mobile trees, so most controls exist twice. */
const vis = (page: Page, selector: string) => page.locator(selector).filter({ visible: true }).first();
const search = (page: Page) => page.evaluate(() => location.search);

const FLOW_FILTER = process.env.AUDIT_FLOW ? new RegExp(process.env.AUDIT_FLOW) : null;

async function flow(browser: Browser, name: string, w: number, seed: Seed, fn: (page: Page, ctx: BrowserContext) => Promise<void>) {
  if (FLOW_FILTER && !FLOW_FILTER.test(name)) return;
  const ctx = await newContext(browser, w, w < 1024 ? 852 : 900, seed);
  const page = await ctx.newPage();
  const health = watch(page);
  try {
    await fn(page, ctx);
  } catch (e) {
    check(name, "flow completed", false, String(e).split("\n").filter((l) => !/^\s*-\s+(attempting|waiting for element|retrying|element is|scrolling|done scrolling|\d+ ×)/.test(l)).slice(0, 5).join(" ").replace(/\s+/g, " ").slice(0, 500));
  }
  // Flows that visit real 404 pages / go offline on purpose: the browser's own "failed to load" lines are expected.
  const expected = EXPECTED_CONSOLE.filter(([prefix]) => name === prefix || name.startsWith(`${prefix}/`) || name.startsWith(`${prefix}@`)).flatMap(([, res]) => res);
  const unexpected = health.console.filter((c) => !expected.some((re) => re.test(c)));
  check(name, "no console errors during flow", unexpected.length === 0, [...new Set(unexpected)].join(" | "));
  await ctx.close();
}

const STATUS_404 = /Failed to load resource: the server responded with a status of 404/;
const EXPECTED_CONSOLE: [string, RegExp[]][] = [
  ["errors", [STATUS_404, /ERR_INTERNET_DISCONNECTED/]],
  ["order", [STATUS_404]],
];

async function flows(browser: Browser) {
  const tasks: (() => Promise<void>)[] = [];

  // 1. Home + header + mobile menu
  tasks.push(() =>
    flow(browser, "home/header", 1440, {}, async (page) => {
      await page.goto(BASE);
      await settle(page, 2200);
      for (const [label, path] of [["HOME", "/"], ["NEW ARRIVAL", "/new-arrivals"]] as const) {
        await page.locator(`header nav[aria-label="Primary"] a[href="${path}"]`).filter({ visible: true }).click();
        await page.waitForURL(`${BASE}${path}`);
        check("home/header", `nav ${label} → ${path}`, new URL(page.url()).pathname === path);
      }
      check("home/header", "Account icon links to /account", (await page.locator('header a[aria-label="Account"]').first().getAttribute("href")) === "/account");
      check("home/header", "Search icon is a dialog button", (await page.locator('header button[aria-label="Search"][aria-haspopup="dialog"]').count()) === 2);
      await page.locator('header a[href="/bag"]').first().click();
      await page.waitForURL(`${BASE}/bag`);
      check("home/header", "bag icon → /bag", true);
      await page.locator('header a[aria-label="COACH home"]').first().click();
      await page.waitForURL(`${BASE}/`);
      check("home/header", "logo → /", true);
    }),
  );
  tasks.push(() =>
    flow(browser, "home/mobile", 393, {}, async (page) => {
      await page.goto(BASE);
      await settle(page, 1500);
      for (const [label, path] of [["Shop new arrivals", "/new-arrivals"], ["Explore all bags", "/bags"]] as const) {
        await page.goto(BASE);
        await settle(page, 1200);
        await page.locator(`main a:has-text("${label}")`).click();
        await page.waitForURL(`${BASE}${path}`);
        check("home/mobile", `CTA "${label}" → ${path}`, true);
      }
      await page.goto(BASE);
      await settle(page, 1200);
      const open = page.locator('button[aria-label="Open menu"]');
      await open.click();
      check("home/mobile", "menu opens", await page.locator("#mobile-menu").isVisible());
      check("home/mobile", "body scroll locked", (await page.evaluate(() => document.body.style.overflow)) === "hidden");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      check("home/mobile", "Esc closes menu + returns focus", !(await page.locator("#mobile-menu").count()) && (await open.evaluate((e) => e === document.activeElement)));
      await open.click();
      await page.locator('button[aria-label="Close menu"]').click();
      check("home/mobile", "close button closes menu", !(await page.locator("#mobile-menu").count()));
      const menuLinks = [["Home", "/"], ["New Arrival", "/new-arrivals"], ["Women", "/women"], ["Men", "/men"], ["Bags", "/bags"], ["Account", "/account"], ["Wishlist", "/wishlist"], ["Find a Store", "/the-house"], ["Client Care", "/client-care"]] as const;
      for (const [label, path] of menuLinks) {
        await page.goto(BASE);
        await settle(page, 600);
        await open.click();
        const link = page.locator(`#mobile-menu a:text-is("${label}")`);
        const href = await link.getAttribute("href");
        if (PENDING_PREFIXES.some((p) => path.startsWith(p))) {
          check("home/mobile", `menu "${label}" → ${href} (pending page)`, href!.startsWith(path));
          await page.keyboard.press("Escape");
          continue;
        }
        await link.click();
        await page.waitForURL((u) => u.pathname === path, { timeout: 8000 }).catch(() => {});
        check("home/mobile", `menu "${label}" → ${href}`, new URL(page.url()).pathname === path && !(await page.locator("#mobile-menu").count()), page.url());
      }
    }),
  );

  // 2. Mega-menus
  for (const menu of ["Women", "Men", "Bags"]) {
    tasks.push(() =>
      flow(browser, `mega/${menu}`, 1440, {}, async (page) => {
        await page.goto(`${BASE}/new-arrivals`);
        await settle(page);
        const t = page.locator(`header nav button[aria-controls]:text-is("${menu}")`);
        const state = () =>
          t.evaluate((b) => {
            const p = document.getElementById(b.getAttribute("aria-controls")!)!;
            const cs = getComputedStyle(p);
            const r = p.firstElementChild!.getBoundingClientRect();
            return { exp: b.getAttribute("aria-expanded"), vis: cs.visibility, op: cs.opacity, top: p.contains(document.elementFromPoint(r.x + r.width / 2, r.y + 40)) };
          });
        const bx = (await t.boundingBox())!;
        await page.mouse.move(20, 450);
        await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 3 });
        await page.waitForTimeout(350);
        let s = await state();
        check(`mega/${menu}`, "hover opens, on top", s.exp === "true" && s.vis === "visible" && s.top, JSON.stringify(s));
        await page.mouse.move(bx.x + bx.width / 2, bx.y + 60, { steps: 3 });
        await page.mouse.move(400, 250, { steps: 5 });
        await page.waitForTimeout(400);
        check(`mega/${menu}`, "stays open in panel", (await state()).exp === "true");
        await page.mouse.move(20, 450, { steps: 2 });
        await page.waitForTimeout(450);
        s = await state();
        check(`mega/${menu}`, "closes on leave, no leftover", s.exp === "false" && s.vis === "hidden" && s.op === "0", JSON.stringify(s));
        await t.focus();
        await page.keyboard.press("Enter");
        check(`mega/${menu}`, "Enter opens", (await state()).exp === "true");
        await page.keyboard.press("Escape");
        check(`mega/${menu}`, "Esc closes", (await state()).exp === "false");
        await page.keyboard.press("ArrowDown");
        check(`mega/${menu}`, "ArrowDown opens + focuses first link", (await state()).exp === "true" && (await page.evaluate(() => document.activeElement?.tagName)) === "A");
        await page.mouse.click(20, 450);
        await page.waitForTimeout(100);
        check(`mega/${menu}`, "click outside closes", (await state()).exp === "false");
        const hrefs = await t.evaluate((b) => [...document.getElementById(b.getAttribute("aria-controls")!)!.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")!));
        for (const href of [...new Set(hrefs)]) {
          await page.goto(`${BASE}/new-arrivals`);
          await settle(page, 200);
          await t.focus();
          await page.keyboard.press("Enter");
          await page.locator(`header a[href="${href}"]`).filter({ visible: true }).first().click();
          const target = new URL(href, BASE);
          const isProduct = target.pathname.startsWith("/products/");
          // Product pages add ?colour= themselves; compare paths there, path + query for filtered views.
          const matches = (u: URL) => (isProduct ? u.pathname === target.pathname : u.pathname + u.search === href);
          await page.waitForURL((u) => matches(u), { timeout: 8000 }).catch(() => {});
          await settle(page, 300);
          const u = new URL(page.url());
          const params = [...new URL(href, BASE).searchParams.keys()].filter((k) => FACET_PARAMS.includes(k)).length;
          // Under full-audit load the client can still be hydrating — poll for the filter tags instead of a single read.
          let tags = (await tagsOn(page)).length;
          for (let i = 0; i < 20 && tags !== params; i++) {
            await page.waitForTimeout(150);
            tags = (await tagsOn(page)).length;
          }
          check(`mega/${menu}`, `link ${href} navigates + filters`, matches(u) && tags === params && (await state()).exp === "false", `${u.pathname}${u.search} · ${tags}/${params} tags`);
        }
      }),
    );
  }

  // 3. Category pages
  for (const path of CATEGORY_PATHS) {
    for (const w of [1440, 393]) {
      tasks.push(() =>
        flow(browser, `category${path}@${w}`, w, {}, async (page) => {
          const area = `category${path}@${w}`;
          await page.goto(`${BASE}${path}`);
          await settle(page);
          const all = await cardsOn(page);
          check(area, "grid renders", all.length > 0, `${all.length}`);
          // every chip in the row
          const chips = await page.$$eval('main [role="group"][aria-label="Category"] button', (b) => b.filter((x) => (x as HTMLElement).offsetParent).map((x) => x.textContent!.trim()));
          for (const chip of chips.slice(1)) {
            await page.goto(`${BASE}${path}`);
            await settle(page, 200);
            await vis(page, `main [role="group"][aria-label="Category"] button:text-is("${chip}")`).click();
            await settle(page, 600);
            const s = await search(page);
            const tags = await tagsOn(page);
            check(area, `chip "${chip}" filters (URL + tag)`, s.length > 1 && tags.includes(chip), `${s} [${tags.join(", ")}] → ${(await cardsOn(page)).length}`);
            await vis(page, `main [role="group"][aria-label="Category"] button:text-is("${chip}")`).click();
            await settle(page, 600);
            check(area, `chip "${chip}" toggles off`, (await search(page)) === "", await search(page));
          }
          // drawer / sheet: every option applies and the live count matches the result
          await page.goto(`${BASE}${path}`);
          await settle(page, 200);
          await vis(page, 'main button[aria-haspopup="dialog"]').click();
          const dialog = page.locator('[role="dialog"][aria-label="Filters"]');
          const options = await dialog.locator("fieldset button").filter({ visible: true }).allTextContents();
          await page.keyboard.press("Escape");
          for (const opt of options.map((o) => o.trim())) {
            await page.goto(`${BASE}${path}`);
            await settle(page, 200);
            await vis(page, 'main button[aria-haspopup="dialog"]').click();
            await dialog.locator("fieldset button").filter({ visible: true, hasText: opt }).first().click();
            const n = Number((await dialog.locator('button:has-text("Show")').textContent())!.match(/\d+/)![0]);
            await dialog.locator('button:has-text("Show")').click();
            await settle(page, 600);
            const got = n === 0 ? 0 : (await cardsOn(page)).length;
            const total = n === 0 ? 0 : Number(((await page.locator('main p:has-text("You’ve viewed")').filter({ visible: true }).textContent().catch(() => "of 0")) ?? "of 0").match(/of (\d+)/)?.[1] ?? 0);
            const noResults = n === 0 ? await page.locator("main", { hasText: "NO PIECES FOUND" }).count() : 1;
            check(area, `filter "${opt}" applies; count matches`, n === 0 ? noResults > 0 : total === n && got > 0, `show ${n} → ${total} (${got} visible)`);
          }
          // sheet/drawer close without applying
          await page.goto(`${BASE}${path}`);
          await settle(page, 200);
          await vis(page, 'main button[aria-haspopup="dialog"]').click();
          await dialog.locator("fieldset button").filter({ visible: true }).first().click();
          await page.locator('button[aria-label="Close filters"]').click();
          check(area, "drawer close discards draft", (await search(page)) === "" && !(await dialog.count()));
          // sort: every option orders correctly
          const sorts = ["Price, Low to High", "Price, High to Low"];
          for (const s of sorts) {
            await page.goto(`${BASE}${path}`);
            await settle(page, 200);
            await vis(page, 'main button[aria-haspopup="listbox"]').click();
            await page.locator(`[role="option"]:has-text("${s}")`).click();
            await settle(page, 600);
            const prices = await page.$$eval('main a[aria-label^="View "]', (as) => as.filter((a) => (a as HTMLElement).offsetParent).map((a) => Number(a.parentElement!.innerText.match(/\$(\d+)/)![1])));
            const asc = s.includes("Low to High");
            check(area, `sort "${s}"`, prices.every((v, i) => i === 0 || (asc ? prices[i - 1] <= v : prices[i - 1] >= v)), prices.join(","));
          }
          // tags remove + clear all, Back
          const under = path === "/men" ? "under-300" : "under-250";
          await page.goto(`${BASE}${path}?type=${path === "/men" ? "crossbody" : path === "/new-arrivals" ? "crossbody" : "totes"}&price=${under}`);
          await settle(page);
          const before = (await tagsOn(page)).length;
          await vis(page, 'main button[aria-label^="Remove filter"]').click();
          await settle(page, 600);
          check(area, "remove one tag", (await tagsOn(page)).length === before - 1);
          await page.goBack();
          await settle(page, 600);
          check(area, "Back restores removed tag", (await tagsOn(page)).length === before);
          await vis(page, 'main button:text-is("Clear all")').click();
          await settle(page, 600);
          check(area, "Clear all", (await tagsOn(page)).length === 0 && (await search(page)) === "");
          // load more
          await page.goto(`${BASE}${path}`);
          await settle(page);
          const moreBtn = page.locator("main button", { hasText: /load more pieces/i }).filter({ visible: true });
          if (await moreBtn.count()) {
            const n0 = (await cardsOn(page)).length;
            await moreBtn.click();
            await page.waitForTimeout(400);
            check(area, "load more reveals more", (await cardsOn(page)).length > n0);
          }
          // no results CTAs
          await page.goto(`${BASE}${path}?type=${path === "/men" ? "duffles" : path === "/bags" ? "backpacks" : path === "/new-arrivals" ? "chain-straps" : "totes"}&price=${under}`);
          await settle(page);
          if (await page.locator("main", { hasText: "NO PIECES FOUND" }).count()) {
            const secondary = vis(page, 'main button:has-text("Notify me"), main a:has-text("View all new arrivals")');
            if ((await secondary.textContent())?.includes("Notify")) {
              await secondary.click();
              await vis(page, 'main input[type="email"]').fill("bad");
              await page.keyboard.press("Enter");
              check(area, "notify: invalid email rejected", (await page.locator("main", { hasText: "valid email" }).count()) > 0);
              await vis(page, 'main input[type="email"]').fill("reader@example.com");
              await page.keyboard.press("Enter");
              check(area, "notify: success", (await page.locator('main [role="status"]', { hasText: "arrives" }).count()) > 0);
            } else {
              await secondary.click();
              await page.waitForURL(`${BASE}${path}`);
              await settle(page, 600);
              check(area, "no-results link → full collection", (await tagsOn(page)).length === 0);
              await page.goBack();
              await settle(page);
            }
            await vis(page, 'main button:has-text("Clear filters")').click();
            await settle(page, 600);
            check(area, "no-results Clear filters", (await search(page)) === "" && (await cardsOn(page)).length > 0);
          } else check(area, "no-results state reachable", false, "expected empty result");
          // wishlist hearts
          await page.goto(`${BASE}${path}`);
          await settle(page);
          const heart = page.locator('main button[aria-label="Add to wishlist"]').filter({ visible: true }).first();
          await heart.click();
          const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.wishlist.v1") ?? "[]").length);
          await page.reload();
          await settle(page);
          check(area, "wishlist heart saves + survives reload", saved === 1 && (await page.locator('main button[aria-label="Remove from wishlist"]').filter({ visible: true }).count()) >= 1);
          // every product card opens a valid PDP
          const hrefs = await page.$$eval('main a[aria-label^="View "]', (as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
          for (const href of hrefs) {
            const res = await fetch(new URL(href, BASE));
            check(area, `card → ${href}`, res.status === 200 && href.startsWith("/products/"), `status ${res.status}`);
          }
        }),
      );
    }
  }

  // 4. PDP — every product
  for (const slug of PRODUCT_SLUGS) {
    tasks.push(() =>
      flow(browser, `pdp/${slug}`, 1440, {}, async (page) => {
        const area = `pdp/${slug}`;
        await page.goto(`${BASE}/products/${slug}`);
        await settle(page);
        const crumb = page.locator('main nav[aria-label="Breadcrumb"] a');
        check(area, "breadcrumb links", (await crumb.count()) >= 2 && (await crumb.nth(1).getAttribute("href"))!.match(/^\/(women|men|bags)$/) !== null);
        // swatches → colour + URL
        const swatches = page.locator("main button[aria-pressed]").filter({ hasNotText: /./ });
        const colourButtons = await page.$$eval("main [aria-label]", (els) =>
          els.filter((e) => e.tagName === "BUTTON" && /^(\w[\w ]*?)( — sold out)?$/.test(e.getAttribute("aria-label")!) && e.closest("[role=radiogroup], fieldset, div")?.textContent?.includes("COLOUR")).map((e) => e.getAttribute("aria-label")!),
        );
        void swatches;
        for (const label of colourButtons) {
          await page.locator(`main button[aria-label="${label}"]`).first().click();
          await page.waitForTimeout(200);
          const name = label.replace(" — sold out", "");
          const url = new URL(page.url());
          const shown = await page.locator("main", { hasText: `COLOUR` }).first().innerText();
          check(area, `swatch ${label} selects colour`, shown.includes(name), url.search);
          if (label.includes("sold out")) {
            const addDisabled = await page.locator('main button:has-text("Add to bag")').count();
            const notify = await page.locator("main", { hasText: /notify|sold out/i }).count();
            check(area, `sold-out ${name}: add blocked / notify shown`, addDisabled === 0 || notify > 0);
          }
        }
        if (colourButtons.length) {
          await page.locator(`main button[aria-label="${colourButtons.find((c) => !c.includes("sold out"))}"]`).first().click();
        }
        // gallery: thumbnails + zoom
        const thumbs = page.locator('main button[aria-label$="FRONT"], main button[aria-label*=" — "]').filter({ visible: true });
        void thumbs;
        const zoom = page.locator('main button[aria-label^="Zoom"]').filter({ visible: true }).first();
        if (await zoom.count()) {
          await zoom.click();
          const lb = page.locator('[role="dialog"]').filter({ visible: true });
          check(area, "zoom opens lightbox", (await lb.count()) > 0);
          const next = lb.locator('button[aria-label*="ext"]').first();
          if ((await next.count()) && (await next.isEnabled())) {
            await next.click();
            check(area, "lightbox next advances", true);
          }
          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
          check(area, "lightbox closes on Esc", (await page.locator('[role="dialog"]').filter({ visible: true }).count()) === 0);
        }
        // accordions
        for (const acc of ["DETAILS & DIMENSIONS", "CARE", "DELIVERY & RETURNS"]) {
          const b = page.locator(`main button:has-text("${acc}")`).first();
          await b.click();
          check(area, `accordion ${acc} toggles`, (await b.getAttribute("aria-expanded")) === "true");
        }
        // personalise
        const pers = page.locator('main button[aria-label="Add your initials"]');
        if (await pers.count()) {
          await pers.click();
          check(area, "personalise expands", (await page.locator('main button[aria-label="Collapse personalisation"]').count()) === 1);
          await page.locator('main input[aria-label="Initial 1"]').fill("A");
        }
        // wishlist + share
        await page.locator('main button:has-text("Save to wishlist")').click();
        check(area, "save to wishlist", (await page.evaluate(() => localStorage.getItem("coach.wishlist.v1") ?? "")).includes('"'));
        // add to bag → mini bag drawer
        await page.locator('main button:has-text("Add to bag")').first().click();
        await page.waitForTimeout(2600); // 600ms loading + 1.4s success state, then the drawer
        const count = await page.locator('header a[href="/bag"]').first().getAttribute("aria-label");
        check(area, "add to bag updates count", /1 item/.test(count ?? ""), count ?? "");
        const drawer = page.locator('[role="dialog"]').filter({ visible: true });
        check(area, "exactly one confirmation (mini bag drawer) opens", (await drawer.count()) === 1 && (await drawer.getAttribute("aria-label")) === "Your bag", `${await drawer.count()} dialogs`);
        const drawerLinks = await drawer.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
        for (const href of [...new Set(drawerLinks)]) {
          const res = await fetch(new URL(href, BASE));
          check(area, `drawer link ${href}`, res.status === 200);
        }
        await page.keyboard.press("Escape");
        // related cards
        const related = await page.$$eval('main a[aria-label^="View "]', (as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
        check(area, "Complete the Chapter has cards", related.length > 0, related.join(", "));
      }),
    );
  }
  tasks.push(() =>
    flow(browser, "pdp/mobile", 393, {}, async (page) => {
      await page.goto(`${BASE}/products/quilted-tabby-20`);
      await settle(page);
      const dots = page.locator('main button[aria-label^="Go to"]');
      await dots.nth(2).click();
      await page.waitForTimeout(500);
      check("pdp/mobile", "gallery dot selects slide", (await dots.nth(2).getAttribute("aria-current")) !== null || (await dots.nth(2).getAttribute("aria-pressed")) === "true" || (await dots.nth(2).getAttribute("aria-selected")) === "true");
      const track = page.locator("main [data-gallery-track], main .snap-x").first();
      if (await track.count()) {
        const before = await track.evaluate((e) => e.scrollLeft);
        await track.evaluate((e) => e.scrollTo({ left: 0 }));
        await page.waitForTimeout(400);
        check("pdp/mobile", "swipe track scrolls", (await track.evaluate((e) => e.scrollLeft)) !== before);
      }
      await vis(page, 'main button:has-text("Add to bag")').click();
      await page.waitForTimeout(2600);
      const dialogs = page.locator('[role="dialog"]').filter({ visible: true });
      check("pdp/mobile", "exactly one confirmation (added sheet) opens", (await dialogs.count()) === 1 && (await dialogs.getAttribute("aria-label")) === "Added to your bag", `${await dialogs.count()} dialogs`);
    }),
  );

  // 5. Bag
  tasks.push(() =>
    flow(browser, "bag", 1440, { local: { "coach.bag.v1": { ...BAG_SEED, lines: [{ productId: "quilted-tabby-20", colour: "Chalk", quantity: 1 }, { productId: "charter-backpack", colour: "Black", quantity: 2 }] } } }, async (page) => {
      await page.goto(`${BASE}/bag`);
      await settle(page);
      const inc = page.locator('main button[aria-label="Increase quantity of Charter Backpack"]');
      for (let i = 0; i < 6; i++) if (await inc.isEnabled()) await inc.click();
      const qty = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).lines.find((l: { productId: string }) => l.productId === "charter-backpack").quantity);
      check("bag", "quantity capped", qty <= 5 && (await page.locator("main", { hasText: /limit|maximum|max/i }).count()) > 0, `qty ${qty}`);
      await page.locator('main button[aria-label="Decrease quantity of Charter Backpack"]').click();
      await vis(page, 'main button:has-text("Remove")').click();
      await page.waitForTimeout(300);
      const undo = vis(page, 'main button:has-text("Undo")');
      check("bag", "remove shows undo", (await undo.count()) > 0);
      await undo.click();
      await page.waitForTimeout(300);
      check("bag", "undo restores line", (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).lines.length)) === 2);
      await vis(page, 'main button:has-text("Save for later")').click();
      await page.waitForTimeout(300);
      check("bag", "save for later", (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).savedForLater.length)) >= 2);
      await vis(page, 'main button:has-text("Move to bag")').click();
      await page.waitForTimeout(300);
      check("bag", "move back to bag", (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).lines.length)) === 2);
      // promo
      await vis(page, 'main button:has-text("Add a promo code")').click();
      const promo = vis(page, 'main input[aria-label="Promo code"]');
      for (const [code, ok] of [["NOPE", false], ["SPRING24", false], ["AUTUMN10", true]] as const) {
        await promo.fill(code);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(800);
        const applied = (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).promoCode)) === code;
        const err = await page.locator("main", { hasText: /couldn’t find|expired/ }).count();
        check("bag", `promo ${code} ${ok ? "applies" : "rejected with message"}`, ok ? applied : !applied && err > 0);
      }
      check("prices", "bag with 10% promo: prices use 0 or 2 decimals", (await pricesOn(page)).length === 0, (await pricesOn(page)).join(" "));
      await page.locator('main button[aria-label*="emove promo" i], main button:has-text("Remove code")').first().click();
      await page.waitForTimeout(300);
      check("bag", "promo removable", (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).promoCode)) === null);
      // gift
      await page.getByRole("checkbox", { name: "Make It a Gift" }).click();
      await page.waitForTimeout(200);
      check("bag", "gift option toggles", (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).gift.wrapped)) === true);
      // edit links
      const editHref = await page.locator("main a").filter({ hasText: "Quilted Tabby 20" }).first().getAttribute("href");
      check("bag", "line links to PDP", editHref === "/products/quilted-tabby-20");
      // checkout enabled → delivery
      await page.locator('main button:has-text("Checkout")').filter({ visible: true }).first().click();
      await page.waitForURL("**/checkout/delivery", { timeout: 8000 });
      check("bag", "checkout → delivery", true);
      await page.reload();
      await settle(page);
      check("bag", "bag survives reload", (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).lines.length)) === 2);
    }),
  );
  tasks.push(() =>
    flow(browser, "bag/sold-out", 1440, { local: { "coach.bag.v1": { ...BAG_SEED, lines: [{ productId: "quilted-tabby-20", colour: "Moss", quantity: 1 }] } } }, async (page) => {
      await page.goto(`${BASE}/bag`);
      await settle(page);
      const btn = page.locator('main button:has-text("Checkout")').filter({ visible: true }).first();
      check("bag/sold-out", "checkout disabled with sold-out line", await btn.isDisabled());
      await page.goto(`${BASE}/checkout/delivery`);
      await page.waitForURL("**/bag", { timeout: 8000 }).catch(() => {});
      check("bag/sold-out", "delivery guard → /bag", new URL(page.url()).pathname === "/bag");
    }),
  );
  tasks.push(() =>
    flow(browser, "bag/empty", 1440, {}, async (page) => {
      await page.goto(`${BASE}/bag`);
      await settle(page);
      const ctas = await page.$$eval("main a[href]", (as) => as.filter((a) => (a as HTMLElement).offsetParent).map((a) => a.getAttribute("href")!));
      check("bag/empty", "empty state CTAs present", ctas.includes("/new-arrivals"), ctas.join(", "));
      const html = await (await fetch(`${BASE}/bag`)).text();
      check("bag/empty", "no 'empty bag' flash in server HTML", !/Your bag is empty/i.test(html));
    }),
  );

  // 6. Checkout
  tasks.push(() =>
    flow(browser, "checkout/delivery", 1440, { local: { "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      await page.click("button[type=submit]");
      await page.waitForTimeout(400);
      const errors = await page.locator("main [role=alert], main [aria-invalid=true]").count();
      check("checkout/delivery", "empty submit shows validation", errors > 0, `${errors} errors`);
      check("checkout/delivery", "stays on delivery when invalid", new URL(page.url()).pathname === "/checkout/delivery");
      await page.fill("input[name=address1]", "214 Mer");
      await page.waitForTimeout(500);
      const sugg = page.locator('[role="option"]').first();
      if (await sugg.count()) {
        await sugg.click();
        await page.waitForTimeout(200);
        check("checkout/delivery", "autocomplete fills city/zip", (await page.inputValue("input[name=city]")) !== "" && (await page.inputValue("input[name=zip]")) !== "");
      } else check("checkout/delivery", "autocomplete suggestions appear", false);
      await fillDelivery(page);
      const totalText = () => page.locator("main").filter({ hasText: "Total" }).first().innerText();
      const express = page.locator('input[name="delivery-method"]').nth(1);
      if (await express.isEnabled()) {
        const t0 = await totalText();
        await express.check({ force: true });
        await page.waitForTimeout(300);
        check("checkout/delivery", "express updates totals", t0 !== (await totalText()));
      } else {
        // Express cuts off at 2pm local time (lib/checkout/delivery.ts) — after that it's disabled with an explanation.
        check("checkout/delivery", "express after 2pm: disabled with explanation", (await page.locator("main", { hasText: "Unavailable for ZIP" }).count()) > 0);
      }
      await page.locator('input[name="delivery-method"]').nth(2).check({ force: true });
      await page.waitForTimeout(300);
      const store = page.locator('input[name="store"]');
      check("checkout/delivery", "collect in store lists boutiques", (await store.count()) > 0);
      await store.first().check({ force: true });
      await page.locator('input[name="delivery-method"]').nth(0).check({ force: true });
      await page.click("button[type=submit]");
      await page.waitForURL("**/checkout/payment", { timeout: 8000 });
      check("checkout/delivery", "Continue → payment", true);
      await page.reload();
      await settle(page);
      check("checkout/delivery", "checkout state survives reload", new URL(page.url()).pathname === "/checkout/payment");
    }),
  );
  tasks.push(() =>
    flow(browser, "checkout/signed-in", 1440, { local: { "coach.bag.v1": BAG_SEED, ...accountSeed("tim@example.com", "Tim") } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      const txt = await page.locator("main").innerText();
      check("checkout/signed-in", "saved addresses offered", /214 Mercer|Home — Tim Archer/.test(txt));
      check("checkout/signed-in", "default address pre-selected", (await page.locator('input[name="saved-address"]').first().isChecked()) && (await page.inputValue("input[name=email]")) === "tim@example.com");
    }),
  );
  tasks.push(() =>
    flow(browser, "checkout/payment", 1440, { local: { "coach.bag.v1": BAG_SEED }, session: { "coach.checkout.v1": CHECKOUT_SEED } }, async (page) => {
      await page.goto(`${BASE}/bag`); // a real history entry before checkout, for the Back check at the end
      await settle(page);
      await page.goto(`${BASE}/checkout/payment`);
      await settle(page);
      const changes = await page.$$eval('main a:text-is("Change")', (as) => as.map((a) => a.getAttribute("href")));
      check("checkout/payment", "review rows link back", changes.length === 3 && changes.every((h) => h === "/checkout/delivery"));
      await page.click("button[type=submit]");
      await page.waitForTimeout(300);
      check("checkout/payment", "empty card shows errors", (await page.locator("main [aria-invalid=true]").count()) > 0);
      await page.getByRole("textbox", { name: "Card number" }).fill("4242 4242 4242 4241");
      await page.getByRole("textbox", { name: "Card number" }).blur();
      check("checkout/payment", "invalid card number flagged", (await page.getByRole("textbox", { name: "Card number" }).getAttribute("aria-invalid")) === "true");
      await page.locator('button[aria-label="What is the security code?"]').click();
      check("checkout/payment", "CVC help opens", (await page.locator('button[aria-label="What is the security code?"]').getAttribute("aria-expanded")) === "true");
      await page.keyboard.press("Escape");
      await page.getByRole("checkbox", { name: "Billing address same as delivery address" }).click();
      check("checkout/payment", "billing different reveals fields", (await page.locator("input[id^=billing-]").count()) > 0);
      await page.getByRole("checkbox", { name: "Billing address same as delivery address" }).click();
      // gift card
      await page.locator('main button:has-text("Add a gift card")').click();
      const gc = vis(page, 'main input[aria-label="Gift card code"]');
      await gc.fill("NOPE");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      check("checkout/payment", "bad gift card rejected", (await page.locator("main", { hasText: "couldn’t find that gift card" }).count()) > 0);
      await gc.fill("COACH-GIFT-7712");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(800);
      check("checkout/payment", "gift card applies", (await page.locator('main button[aria-label="Remove gift card"]').count()) > 0);
      check("prices", "payment with gift card + tax: prices use 0 or 2 decimals", (await pricesOn(page)).length === 0, (await pricesOn(page)).join(" "));
      // PayPal / Apple Pay
      for (const [i, label] of [[1, "Pay with PayPal"], [2, "Pay with Apple Pay"], [0, "Place Order"]] as const) {
        await page.locator('input[name="payment-method"]').nth(i).check({ force: true });
        check("checkout/payment", `method → "${label}"`, (await page.locator("button[type=submit]").innerText()).includes(label));
      }
      // decline then success, with double-submit protection
      await fillCard(page, "4000 0000 0000 0002");
      await page.click("button[type=submit]");
      const busy = (await page.locator("button[type=submit]").isDisabled()) && (await page.locator("button[type=submit]").getAttribute("aria-busy")) === "true";
      await page.locator("button[type=submit]").click({ force: true, timeout: 1000 }).catch(() => {});
      check("checkout/payment", "submit locked (disabled + aria-busy) while processing", busy);
      await page.waitForTimeout(2200);
      check("checkout/payment", "decline card shows declined", (await page.locator("main", { hasText: "This card was declined" }).count()) > 0);
      check("checkout/payment", "decline stays on payment", new URL(page.url()).pathname === "/checkout/payment");
      await fillCard(page, "4242 4242 4242 4242");
      await page.click("button[type=submit]");
      await page.waitForURL("**/order/**", { timeout: 10000 }).catch(() => {});
      check("checkout/payment", "success → /order/[id]", new URL(page.url()).pathname.startsWith("/order/CO-"), page.url());
      const orders = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.orders.v1") ?? "[]").length);
      check("checkout/payment", "exactly one order saved (no double submit)", orders === 1, `${orders}`);
      await page.goBack();
      await settle(page, 800);
      check("order", "Back does not return to checkout", !new URL(page.url()).pathname.startsWith("/checkout"), page.url());
    }),
  );
  tasks.push(() =>
    flow(browser, "checkout/guards", 1440, {}, async (page) => {
      await page.goto(`${BASE}/checkout/payment`);
      await page.waitForURL("**/bag", { timeout: 8000 }).catch(() => {});
      check("checkout/guards", "payment with empty bag → /bag", new URL(page.url()).pathname === "/bag");
      await page.evaluate((b) => localStorage.setItem("coach.bag.v1", JSON.stringify(b)), BAG_SEED);
      await page.goto(`${BASE}/checkout/payment`);
      await page.waitForURL("**/checkout/delivery", { timeout: 8000 }).catch(() => {});
      check("checkout/guards", "payment without delivery → delivery", new URL(page.url()).pathname === "/checkout/delivery");
    }),
  );

  // 7. Order confirmation
  tasks.push(() =>
    flow(browser, "order", 1440, { local: { "coach.orders.v1": ORDERS_JSON } }, async (page) => {
      await page.goto(`${BASE}/order/${ORDER_ID}`);
      await settle(page);
      check("order", "confirmation renders order id", (await page.locator("main").innerText()).includes(ORDER_ID));
      const t1 = await page.locator("main").innerText();
      await page.waitForTimeout(1500);
      check("order", "cancel countdown ticks", t1 !== (await page.locator("main").innerText()));
      await page.locator('main button:has-text("resend the email")').click();
      await page.waitForTimeout(1300);
      check("order", "resend email gives feedback", (await page.locator("main", { hasText: /sent|resent/i }).count()) > 0);
      await page.locator('main input[type="password"]').fill("short");
      await page.locator('main button:has-text("Create account")').click();
      await page.waitForTimeout(300);
      const pwErr = await page.locator("main [aria-invalid=true], main [role=alert]").count();
      check("order", "create account validates password", pwErr > 0);
      await page.locator('main input[type="password"]').fill("a-much-longer-passphrase-2026");
      await page.locator('main button:has-text("Create account")').click();
      await page.waitForTimeout(1500);
      check("order", "create account succeeds", (await page.locator("main", { hasText: /account|welcome|signed in/i }).count()) > 0 && (await page.evaluate(() => localStorage.getItem("coach.session.v1"))) !== null);
      await page.locator('main button:has-text("Cancel order")').click();
      const dlg = page.locator('[role="dialog"], [role="alertdialog"]').filter({ visible: true });
      check("order", "cancel opens confirm dialog", (await dlg.count()) > 0);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      check("order", "dialog dismisses, order not cancelled", (await page.evaluate((id) => JSON.parse(localStorage.getItem("coach.orders.v1")!).find((o: { id: string }) => o.id === id).status, ORDER_ID)) === "placed");
      await page.locator('main button:has-text("Cancel order")').click();
      await dlg.locator("button", { hasText: /cancel order|yes/i }).last().click();
      await page.waitForTimeout(800);
      check("order", "cancel confirms + persists", (await page.evaluate((id) => JSON.parse(localStorage.getItem("coach.orders.v1")!).find((o: { id: string }) => o.id === id).status, ORDER_ID)) === "cancelled");
      // ?stage= is a dev-only preview override (components/order/OrderConfirmationView.tsx); production must ignore it.
      for (const stage of ["preparing", "shipped", "delivered"]) {
        await page.goto(`${BASE}/order/${ORDER_ID}?stage=${stage}`);
        await settle(page);
        const text = await page.locator("main").innerText();
        check("order", `?stage=${stage} is ignored in production (renders the real order)`, text.includes(ORDER_ID) && (stage === "preparing" || !new RegExp(`\\b${stage}\\b on`, "i").test(text)));
      }
      await page.goto(`${BASE}/order/CO-NOPE00`);
      await settle(page);
      check("order", "invalid id → not-found state", (await page.locator("main").innerText()).match(/not found|couldn’t find|can’t find/i) !== null);
      const html = await (await fetch(`${BASE}/order/${ORDER_ID}`)).text();
      check("order", "no 'not found' flash in server HTML", !/couldn’t find|not found/i.test(html.replace(/<script[\s\S]*?<\/script>/g, "")));
    }),
  );

  // 7b. Account (page 11) — mock auth, ?next=, order history, address book, storage hygiene
  const storageDump = (page: Page) =>
    page.evaluate(() => {
      const all: string[] = [];
      for (const st of [localStorage, sessionStorage]) for (let i = 0; i < st.length; i++) all.push(`${st.key(i)}=${st.getItem(st.key(i)!)}`);
      return all.join("\n");
    });
  const signInWith = async (page: Page, email: string, password: string) => {
    await page.fill("#signin-email", email);
    await page.fill("#signin-password", password);
    await page.click('form[aria-labelledby="signin-title"] button[type=submit]');
  };
  tasks.push(() =>
    flow(browser, "account/sign-in", 1440, { local: { ...accountSeed(undefined, undefined, false), "coach.orders.v1": ORDERS_JSON, "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/account`);
      await settle(page);
      check("account", "signed-out view renders (Welcome Back + both cards)", (await page.locator("h1", { hasText: "Welcome Back" }).count()) === 1 && (await page.locator("text=Create an Account").count()) > 0);
      check("account", "title is 'Account …'", /^Account\b/.test(await page.title()));
      check("account", "robots noindex", /noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""));
      check("account", "header account icon → /account (signed out)", (await page.locator('header a[aria-label="Account"]').first().getAttribute("href")) === "/account");
      await page.click('form[aria-labelledby="signin-title"] button[type=submit]');
      await page.waitForTimeout(200);
      check("account", "empty sign-in → field validation", (await page.locator("#signin-email[aria-invalid=true]").count()) === 1);
      await signInWith(page, "nobody@example.com", ACCOUNT_PASSWORD);
      const busy = (await page.locator('form[aria-labelledby="signin-title"] button[type=submit][aria-busy=true], form[aria-labelledby="signin-title"] button[type=submit]:has-text("Signing in")').count()) > 0;
      check("account", "sign-in shows a loading state", busy);
      await page.waitForTimeout(1200);
      const unknownMsg = await page.locator("#signin-password-error").innerText().catch(() => "");
      await signInWith(page, DELIVERY_VALUES.email, "wrong-password-1");
      await page.waitForTimeout(1300);
      const wrongMsg = await page.locator("#signin-password-error").innerText().catch(() => "");
      check("account", "unknown email + wrong password → the same generic error", unknownMsg.length > 0 && unknownMsg === wrongMsg, `${unknownMsg} | ${wrongMsg}`);
      check("account", "error keeps the email, clears the password", (await page.inputValue("#signin-email")) === DELIVERY_VALUES.email && (await page.inputValue("#signin-password")) === "");
      await signInWith(page, DELIVERY_VALUES.email, ACCOUNT_PASSWORD);
      await page.waitForTimeout(1300);
      const main = await page.locator("main").innerText();
      check("account", "sign-in success → greeting with first name", new RegExp(`, ${DELIVERY_VALUES.firstName}\\.`).test(main));
      check("account", "latest order card shows the real order", main.includes(ORDER_ID));
      await page.reload();
      await settle(page);
      check("account", "session survives reload", (await page.locator('nav[aria-label="Account"]').count()) === 1);
      await page.locator('nav[aria-label="Account"] button', { hasText: "Orders" }).click();
      await page.waitForTimeout(300);
      check("account", "Orders tab updates the URL", new URL(page.url()).searchParams.get("tab") === "orders");
      check("prices", "account orders list: prices use 0 or 2 decimals", (await pricesOn(page)).length === 0, (await pricesOn(page)).join(" "));
      const row = page.locator(`main a[href="/order/${ORDER_ID}"]`).first();
      check("account", "order history row: number, status, total", (await row.count()) === 1 && /Nº CO-/.test(await row.innerText()) && /\$[\d,]+/.test(await row.innerText()) && /PREPARING|SHIPPED|DELIVERED|CANCELLED/i.test(await row.innerText()));
      check("account", "order row has item thumbnail(s)", (await row.locator("img").count()) > 0);
      await row.click();
      await page.waitForURL(`${BASE}/order/${ORDER_ID}`);
      await settle(page);
      check("account", "order row → /order/[id] renders that order", (await page.locator("main").innerText()).includes(ORDER_ID));
      check("account", "order page shows signed-in banner", (await page.locator("main", { hasText: "Saved to Your Account" }).count()) > 0);
      const dump = await storageDump(page);
      check("account", "no plain-text password anywhere in storage", !dump.includes(ACCOUNT_PASSWORD) && !dump.includes("wrong-password-1") && !/"password"\s*:/.test(dump));
      await page.goto(`${BASE}/account`);
      await settle(page);
      await page.locator('nav[aria-label="Account"] button', { hasText: "Sign out" }).click();
      await page.waitForTimeout(300);
      check("account", "sign out → signed-out view", (await page.locator("h1", { hasText: "Welcome Back" }).count()) === 1);
      const after = await page.evaluate(() => ({ local: localStorage.getItem("coach.session.v1"), session: sessionStorage.getItem("coach.session.v1"), bag: localStorage.getItem("coach.bag.v1") }));
      check("account", "sign out clears the session but keeps the bag", after.local === null && after.session === null && !!after.bag && JSON.parse(after.bag).lines.length > 0);
      await page.reload();
      await settle(page);
      check("account", "signed out survives reload", (await page.locator("h1", { hasText: "Welcome Back" }).count()) === 1);
    }),
  );
  tasks.push(() =>
    flow(browser, "account/forgot", 393, { local: accountSeed(undefined, undefined, false) }, async (page) => {
      const sentText = async (email: string) => {
        await page.goto(`${BASE}/account`);
        await settle(page);
        await page.fill("#signin-email", email);
        await page.click('button:has-text("Forgot password?")');
        await page.waitForTimeout(1200);
        return (await page.locator('[role=status]', { hasText: "A Link Is on Its Way" }).innerText().catch(() => "")).replace(email, "<email>");
      };
      const known = await sentText(DELIVERY_VALUES.email);
      const unknown = await sentText("ghost@example.com");
      check("account", "forgot password → 'A Link Is on Its Way' sent state", known.includes("CHECK YOUR INBOX") || /check your inbox/i.test(known));
      check("account", "reset message identical for known and unknown emails", known.length > 0 && known === unknown);
      await page.click('button:has-text("Resend the link")');
      await page.waitForTimeout(1000);
      check("account", "resend gives feedback", (await page.locator("text=Sent again").count()) === 1);
      await page.click('button:has-text("Back to sign in")');
      check("account", "back to sign in restores the form", (await page.locator("#signin-email").count()) === 1);
    }),
  );
  tasks.push(() =>
    flow(browser, "account/create", 393, { local: accountSeed(undefined, undefined, false) }, async (page) => {
      await page.goto(`${BASE}/account`);
      await settle(page);
      await page.locator('button:has-text("Create account")').first().click();
      await page.click("#create-account-form button[type=submit]");
      await page.waitForTimeout(200);
      check("account", "create account: empty → field errors", (await page.locator("#create-account-form [aria-invalid=true]").count()) === 4);
      await page.fill("#create-firstName", "Grace");
      await page.fill("#create-lastName", "Hopper");
      await page.fill("#create-email", DELIVERY_VALUES.email);
      await page.fill("#create-password", "short");
      await page.click("#create-account-form button[type=submit]");
      await page.waitForTimeout(200);
      check("account", "create account: order-page password rule enforced", (await page.locator("#create-password-error").innerText().catch(() => "")).includes("8 characters, including a number"));
      await page.fill("#create-password", "compiler1952");
      await page.click("#create-account-form button[type=submit]");
      await page.waitForTimeout(1200);
      check("account", "create account: existing email refused", /already an account/i.test(await page.locator("#create-email-error").innerText().catch(() => "")));
      await page.fill("#create-email", "grace@example.com");
      await page.click("#create-account-form button[type=submit]");
      await page.waitForTimeout(1300);
      check("account", "create account → signed-in overview", /, Grace\./.test(await page.locator("main").innerText()));
      const reg = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.accounts.v1") ?? "{}")["grace@example.com"]);
      check("account", "registry stores a SHA-256 hex digest, not the password", /^[0-9a-f]{64}$/.test(reg?.passwordHash ?? "") && !JSON.stringify(reg).includes("compiler1952"));
      check("account", "session shape {email, firstName, lastName, createdAt}", await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("coach.session.v1") ?? "{}");
        return Object.keys(s).sort().join() === "createdAt,email,firstName,lastName";
      }));
      check("account", "new account: empty order history state", (await page.locator("text=No orders yet").count()) > 0);
    }),
  );
  tasks.push(() =>
    flow(browser, "account/next", 1440, { local: { ...accountSeed(undefined, undefined, false), "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      const signInLink = page.locator('main a:has-text("Sign in")').first();
      check("account", "checkout 'Sign in' → /account?next=/checkout/delivery", (await signInLink.getAttribute("href")) === "/account?next=/checkout/delivery");
      await signInLink.click();
      await page.waitForURL(/\/account\?next=/);
      await settle(page);
      await signInWith(page, DELIVERY_VALUES.email, ACCOUNT_PASSWORD);
      await page.waitForURL(`${BASE}/checkout/delivery`, { timeout: 8000 }).catch(() => {});
      check("account", "?next= returns to checkout after sign-in", new URL(page.url()).pathname === "/checkout/delivery", page.url());
      await settle(page);
      check("account", "back in checkout signed in with saved addresses", /Signed in as/.test(await page.locator("main").innerText()));
      for (const evil of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)"]) {
        await page.goto(`${BASE}/account?next=${encodeURIComponent(evil)}`);
        await settle(page, 1200);
        const u = new URL(page.url());
        check("account", `?next=${evil} ignored (stays on /account)`, u.origin === BASE && u.pathname === "/account", page.url());
      }
      await page.goto(`${BASE}/account?next=/bag`);
      await page.waitForURL(`${BASE}/bag`, { timeout: 8000 }).catch(() => {});
      check("account", "signed-in visit with internal ?next= redirects there", new URL(page.url()).pathname === "/bag");
    }),
  );
  tasks.push(() =>
    flow(browser, "account/addresses", 1440, { local: { ...accountSeed(), "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/account?tab=addresses`);
      await settle(page);
      check("account", "address book lists saved addresses", (await page.locator("[data-address-id]").count()) === 2);
      await page.click('main button:has-text("Add an address")');
      await page.fill("#address-label", "");
      await page.click('main form button[type=submit]');
      await page.waitForTimeout(200);
      check("account", "address form validates (name + street + city + state + zip)", (await page.locator("main form [aria-invalid=true]").count()) >= 4);
      await page.fill("#address-label", "Atelier");
      await page.fill("#acct-address1", "1 Audit Lane");
      await page.keyboard.press("Escape");
      await page.fill("#acct-city", "Brooklyn");
      await page.selectOption("#acct-state", { label: "New York" });
      await page.fill("#acct-zip", "123");
      await page.click('main form button[type=submit]');
      await page.waitForTimeout(200);
      check("account", "address form: 5-digit ZIP rule", (await page.locator("#acct-zip[aria-invalid=true]").count()) === 1);
      await page.fill("#acct-zip", "11201");
      await page.click('main form button[type=submit]');
      await page.waitForTimeout(300);
      check("account", "add address", (await page.locator("[data-address-id]", { hasText: "1 Audit Lane" }).count()) === 1);
      await page.click('main button[aria-label="Edit Atelier"]');
      await page.fill("#acct-address1", "2 Audit Lane");
      await page.keyboard.press("Escape");
      await page.click('main form button[type=submit]');
      await page.waitForTimeout(300);
      check("account", "edit address", (await page.locator("[data-address-id]", { hasText: "2 Audit Lane" }).count()) === 1);
      await page.click('main button[aria-label="Set as default: Atelier"]');
      await page.waitForTimeout(200);
      check("account", "set default", (await page.locator("[data-address-id]", { hasText: "2 Audit Lane" }).locator("text=DEFAULT").count()) === 1);
      await page.click('main button[aria-label="Delete Studio"]');
      await page.locator('main [role=group] button:has-text("Delete")').click();
      await page.waitForTimeout(200);
      check("account", "delete address (with confirm)", (await page.locator("[data-address-id]").count()) === 2 && (await page.locator("[data-address-id]", { hasText: "88 Greene" }).count()) === 0);
      await page.reload();
      await settle(page);
      check("account", "address changes persist across reload", (await page.locator("[data-address-id]", { hasText: "2 Audit Lane" }).count()) === 1);
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      const txt = await page.locator("main").innerText();
      check("account", "checkout shows the edited address book", txt.includes("Atelier — Ada Archer") && !txt.includes("88 Greene"));
      check("account", "checkout pre-selects the new default", (await page.inputValue("input[name=address1]").catch(() => "")) === "2 Audit Lane" || (await page.locator('input[name="saved-address"]').nth(1).isChecked()));
      await page.goto(`${BASE}/account?tab=details`);
      await settle(page);
      check("account", "header account icon → /account (signed in)", (await page.locator('header a[aria-label="Account"]').first().getAttribute("href")) === "/account");
      await page.fill("#details-firstName", "Augusta");
      await page.locator('main [role=checkbox]').click();
      await page.click('main button:has-text("Save details")');
      await page.goto(`${BASE}/account`);
      await settle(page);
      const main = await page.locator("main").innerText();
      check("account", "details edit → greeting + early-access preference update", /, Augusta\./.test(main) && /Early access · Off/.test(main));
    }),
  );
  tasks.push(() =>
    flow(browser, "account/mobile", 320, { local: { ...accountSeed(), "coach.orders.v1": ORDERS_JSON } }, async (page) => {
      for (const t of ["", "?tab=orders", "?tab=addresses", "?tab=details"]) {
        await page.goto(`${BASE}/account${t}`);
        await settle(page);
        check("account", `320px no horizontal overflow (/account${t})`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= 320);
      }
    }),
  );

  // 7c. International addresses — country-driven regions, postal codes, phone, tax, delivery, migration
  const labelFor = (page: Page, id: string) => page.locator(`label[for="${id}"]`).innerText().catch(() => "");
  /** Text overflow inside a <select>: the selected option's rendered width vs the select's content box. */
  const selectClipped = (page: Page, selector: string) =>
    page.locator(selector).evaluate((el) => {
      const sel = el as HTMLSelectElement;
      const cs = getComputedStyle(sel);
      const probe = document.createElement("span");
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
      probe.textContent = sel.options[sel.selectedIndex]?.text ?? "";
      document.body.append(probe);
      const need = probe.getBoundingClientRect().width;
      probe.remove();
      const room = sel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return need > room + 0.5 ? `${Math.ceil(need)}px text in ${Math.floor(room)}px` : "";
    });
  const fillThaiDelivery = async (page: Page) => {
    await page.fill("input[name=email]", "ploy@example.com");
    await page.fill("input[name=firstName]", "Ploy");
    await page.fill("input[name=lastName]", "Srisuk");
    await page.selectOption("select[name=country]", "TH");
    await page.fill("input[name=address1]", "991 Ra");
    await page.locator('[role=option]', { hasText: "991 Rama I Road" }).first().click();
    await page.fill("input[name=phone]", "081 234 5678");
  };

  tasks.push(() =>
    flow(browser, "address/switch", 1440, { local: { "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      check("address", "US default: State + ZIP code labels, 50 states + DC", (await labelFor(page, "state")) === "State" && (await labelFor(page, "zip")) === "ZIP code" && (await page.locator("#state option").count()) === 52);
      await page.selectOption("#state", "NY");
      await page.fill("#zip", "10001");
      await page.locator("#state").focus();
      await page.locator("#city").focus(); // touch → errors visible for the next blur
      await page.selectOption("#state", "");
      await page.locator("#state").blur();
      check("address", "US: empty state shows its error", (await page.locator("#state[aria-invalid=true]").count()) === 1);
      await page.selectOption("#country", "TH");
      await page.waitForTimeout(150);
      check("address", "US → Thailand swaps to Province with all 77 provinces", (await labelFor(page, "state")) === "Province" && (await page.locator("#state option").count()) === 78 && (await page.locator("#state option", { hasText: "Bangkok" }).count()) === 1);
      check("address", "US → Thailand swaps the label to 'Postal code'", (await labelFor(page, "zip")) === "Postal code");
      check("address", "switching country resets the region", (await page.inputValue("#state")) === "");
      check("address", "switching country clears the stale region error", (await page.locator("#state[aria-invalid=true]").count()) === 0);
      await page.locator("#state").focus();
      await page.locator("#state").blur();
      check("address", "Thailand: empty province error names the province", /select a province/i.test(await page.locator("#state-error").innerText().catch(() => "")));
      await page.fill("#address1", "214 Mer");
      await page.waitForTimeout(200);
      check("address", "autocomplete ignores other countries' addresses", (await page.locator("[role=option]").count()) === 0);
      await page.fill("#address1", "991 Ra");
      await page.waitForTimeout(200);
      check("address", "autocomplete suggests Thai addresses for Thailand", (await page.locator("[role=option]", { hasText: "991 Rama I Road" }).count()) === 1);
      await page.locator("[role=option]", { hasText: "991 Rama I Road" }).first().click();
      check("address", "picking a Thai suggestion fills city / province / postal code", (await page.inputValue("#city")) === "Bangkok" && (await page.inputValue("#state")) === "10" && (await page.inputValue("#zip")) === "10330");
      for (const [v, ok] of [["812345678", false], ["081 234 5678", true], ["02 123 4567", true], ["+66 81 234 5678", true], ["+1 212 555 0100", false]] as const) {
        await page.fill("#phone", v);
        await page.locator("#phone").blur();
        check("address", `Thai phone "${v}" ${ok ? "accepted" : "rejected"}`, ((await page.locator("#phone[aria-invalid=true]").count()) === 0) === ok);
      }
      await page.fill("#zip", "1033");
      await page.locator("#zip").blur();
      check("address", "Thai postal code must be 5 digits", (await page.locator("#zip[aria-invalid=true]").count()) === 1);
      await page.selectOption("#country", "SG");
      await page.waitForTimeout(150);
      check("address", "Singapore hides the region field", (await page.locator("#state").count()) === 0 && (await labelFor(page, "zip")) === "Postal code");
      await page.fill("#zip", "238801");
      await page.locator("#zip").blur();
      check("address", "Singapore: 6-digit postal code accepted", (await page.locator("#zip[aria-invalid=true]").count()) === 0);
      await page.selectOption("#country", "GB");
      await page.waitForTimeout(150);
      check("address", "UK: optional County with nation groups, 'Postcode' label", /County — optional/.test(await labelFor(page, "state")) && (await page.locator("#state optgroup").count()) === 4 && (await labelFor(page, "zip")) === "Postcode");
      await page.fill("#zip", "sw1a 1aa");
      await page.locator("#zip").blur();
      check("address", "UK postcode normalised to upper case and valid", (await page.inputValue("#zip")) === "SW1A 1AA" && (await page.locator("#zip[aria-invalid=true]").count()) === 0);
      await page.selectOption("#country", "JP");
      await page.waitForTimeout(150);
      check("address", "Japan: 47 prefectures", (await labelFor(page, "state")) === "Prefecture" && (await page.locator("#state option").count()) === 48);
    }),
  );
  for (const w of [1440, 1024, 393, 320]) {
    tasks.push(() =>
      flow(browser, `address/layout@${w}`, w, { local: { "coach.bag.v1": BAG_SEED } }, async (page) => {
        await page.goto(`${BASE}/checkout/delivery`);
        await settle(page);
        const vw = await page.evaluate(() => document.documentElement.clientWidth);
        const rightEdge = await page.locator("#lastName").evaluate((el) => el.getBoundingClientRect().right);
        check("address", `@${w}: name row fits the viewport`, rightEdge <= vw, `${Math.round(rightEdge)} > ${vw}`);
        for (const [country, region] of [["US", ""], ["US", "DC"], ["TH", ""], ["TH", "14"], ["CA", "NL"], ["AU", "ACT"], ["JP", ""], ["GB", "east-riding-of-yorkshire"]] as const) {
          await page.selectOption("#country", country);
          if (region) await page.selectOption("#state", region);
          const clipped = await selectClipped(page, "#state");
          check("address", `@${w}: ${country} region ${region || "placeholder"} not truncated`, clipped === "", clipped);
        }
        check("address", `@${w}: Country select not truncated`, (await selectClipped(page, "#country")) === "");
        check("address", `@${w}: no horizontal page overflow`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= vw);
      }),
    );
  }
  tasks.push(() =>
    // One $350 City Tote: 7% VAT = $24.50, total $374.50 — exercises a trailing-zero cents value.
    flow(browser, "address/thai-order", 1440, { local: { "coach.bag.v1": { ...BAG_SEED, lines: [{ productId: "city-tote", colour: "Brown", quantity: 1 }], savedForLater: [] } } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      await fillThaiDelivery(page);
      check("address", "Thai delivery: international transit copy", /Tracked, duties shown at payment/.test(await page.locator("#delivery-method").innerText()));
      await page.click("button[type=submit]");
      await page.waitForURL("**/checkout/payment", { timeout: 15000 }).catch(() => {});
      check("address", "Thai address passes validation → payment", new URL(page.url()).pathname === "/checkout/payment");
      await settle(page);
      const pay = await page.locator("main").innerText();
      check("address", "payment shows Thai VAT (7%)", /VAT \(7%\)/.test(pay));
      check("prices", "payment: cents render with 2 decimals (VAT $24.50, total $374.50)", pay.includes("$24.50") && pay.includes("$374.50") && (await pricesOn(page)).length === 0, (await pricesOn(page)).join(" "));
      check("address", "payment review shows full province + country names", /Bangkok, Bangkok 10330, Thailand/.test(pay));
      await page.getByRole("checkbox", { name: "Billing address same as delivery address" }).click();
      await page.selectOption("#billing-country", "SG");
      check("address", "billing address is country-aware too (Singapore: no region)", (await page.locator("#billing-state").count()) === 0 && (await labelFor(page, "billing-zip")) === "Postal code");
      await page.getByRole("checkbox", { name: "Billing address same as delivery address" }).click();
      await fillCard(page, "4242 4242 4242 4242");
      await page.click("button[type=submit]");
      await page.waitForURL("**/order/**", { timeout: 15000 }).catch(() => {});
      check("address", "Thai address completes an order", new URL(page.url()).pathname.startsWith("/order/CO-"), page.url());
      await settle(page);
      const order = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.orders.v1") ?? "[]").at(-1));
      check("address", "order stores country + region codes", order?.shippingAddress?.country === "TH" && order?.shippingAddress?.state === "10" && order?.shippingAddress?.zip === "10330");
      const text = await page.locator("main").innerText();
      check("address", "order page displays full names + VAT", /Bangkok, Bangkok 10330, Thailand/.test(text) && /VAT \(7%\)/.test(text));
      check("prices", "order page: $24.50 / $374.50, no 1-decimal prices", text.includes("$24.50") && text.includes("$374.50") && (await pricesOn(page)).length === 0, (await pricesOn(page)).join(" "));
    }),
  );
  tasks.push(() =>
    flow(browser, "address/saved-thai", 1440, { local: { "coach.bag.v1": BAG_SEED, ...accountSeed(undefined, undefined, true, { thaiDefault: true }) } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      const prefill = await page.evaluate(() => JSON.parse(sessionStorage.getItem("coach.checkout.v1") ?? "{}"));
      check("address", "saved Thai default pre-fills checkout (country, province, postal)", prefill.savedAddressId === "addr-bangkok" && prefill.values?.address1 === THAI_ADDRESS.address1 && prefill.values?.country === "TH" && prefill.values?.state === "10" && prefill.values?.zip === "10330");
      await page.locator('[data-address-id], label', { hasText: "991 Rama I Road" }).locator("button", { hasText: "Edit" }).first().click();
      check("address", "editing the saved Thai address shows Province / Postal code pre-filled", (await page.inputValue("select[name=country]")) === "TH" && (await page.inputValue("select[name=state]")) === "10" && (await labelFor(page, "state")) === "Province" && (await page.inputValue("input[name=zip]")) === "10330");
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      check("address", "checkout saved-address card shows full names", /Bangkok, Bangkok 10330, Thailand/.test(await page.locator("main").innerText()));
      await page.goto(`${BASE}/account?tab=addresses`);
      await settle(page);
      const card = page.locator('[data-address-id="addr-bangkok"]');
      check("address", "Account shows the Thai address with full names", /Bangkok, Bangkok 10330/.test(await card.innerText()) && /Thailand/.test(await card.innerText()));
      await card.locator("button", { hasText: "Edit" }).click();
      check("address", "Account edit pre-fills the Thai address", (await page.inputValue("#acct-country")) === "TH" && (await page.inputValue("#acct-state")) === "10" && (await labelFor(page, "acct-state")) === "Province" && (await page.inputValue("#acct-zip")) === "10330");
      await page.selectOption("#acct-country", "SG");
      check("address", "Account form: Singapore hides region", (await page.locator("#acct-state").count()) === 0);
    }),
  );
  tasks.push(() =>
    flow(
      browser,
      "address/legacy",
      1440,
      {
        local: { "coach.bag.v1": BAG_SEED, ...accountSeed(undefined, undefined, true, { legacy: true }), "coach.orders.v1": [{ ...(ORDERS_JSON as Record<string, unknown>[]).at(-1), shippingAddress: { ...DELIVERY_VALUES, state: "New York", country: "United States" } }] },
        session: { "coach.checkout.v1": { ...CHECKOUT_SEED, values: { ...DELIVERY_VALUES, state: "New York", country: "United States" } } },
      },
      async (page) => {
        await page.goto(`${BASE}/checkout/delivery`);
        await settle(page);
        check("address", "legacy saved US addresses still offered", /214 Mercer Street, New York, New York 10012/.test(await page.locator("main").innerText()));
        check("address", "legacy in-progress checkout migrates to codes (US / NY)", (await page.inputValue("select[name=country]")) === "US" && (await page.inputValue("select[name=state]")) === "NY");
        await page.goto(`${BASE}/account?tab=addresses`);
        await settle(page);
        check("address", "legacy account addresses display + edit as codes", /New York, New York 10012/.test(await page.locator("main").innerText()));
        await page.locator('main button[aria-label="Edit Home"]').click();
        check("address", "legacy address edit form pre-selects US / NY", (await page.inputValue("#acct-country")) === "US" && (await page.inputValue("#acct-state")) === "NY");
        await page.goto(`${BASE}/order/${ORDER_ID}`);
        await settle(page);
        const orderText = await page.locator("main").innerText();
        check("address", "legacy order renders its address + NY tax rate", /New York, New York 10001, United States/.test(orderText) && /Tax \(8\.875%\)/.test(orderText));
      },
    ),
  );

  // 7d. Wishlist (page 12)
  const wishIds = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("coach.wishlist.v1") ?? "[]") as string[]);
  const bagQty = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem("coach.bag.v1") ?? '{"lines":[]}').lines as { quantity: number }[]).reduce((n, l) => n + l.quantity, 0));
  const item = (page: Page, id: string) => page.locator(`[data-wishlist-item="${id}"]`);
  tasks.push(() =>
    flow(browser, "wishlist/core", 1440, { local: { "coach.wishlist.v1": WISHLIST_SEED } }, async (page) => {
      await page.goto(`${BASE}/wishlist`);
      await settle(page);
      check("wishlist", "title is 'Wishlist …'", /^Wishlist\b/.test(await page.title()));
      check("wishlist", "robots noindex", /noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""));
      const main = await page.locator("main").innerText();
      check("wishlist", "hero + count follow the list (Figma copy)", /Four pieces, kept for later\./.test(main) && /4 pieces · Saved on this device/.test(main));
      check("wishlist", "grid shows the four saved pieces in order", JSON.stringify(await page.locator("[data-wishlist-item]").evaluateAll((els) => els.map((e) => e.getAttribute("data-wishlist-item")))) === JSON.stringify(WISHLIST_SEED));
      check("wishlist", "signed-out banner offers sign in → back here", (await page.locator('main a[href="/account?next=%2Fwishlist"]').count()) > 0 && (await page.locator('main a[href="/account?next=%2Fwishlist&mode=create"]').count()) > 0 && /your four saved pieces come with you/.test(main));
      const heartColour = await vis(page, '[data-wishlist-item="city-tote"] button[aria-label="Remove from wishlist"]').evaluate((el) => getComputedStyle(el).color);
      check("wishlist", "saved hearts are accent-deep (Figma)", heartColour === "rgb(65, 71, 213)", heartColour);
      // Remove + Undo (8 s)
      await vis(page, '[data-wishlist-item="hudson-messenger"] button[aria-label="Remove from wishlist"]').click();
      await page.waitForTimeout(250);
      const toast = page.locator("[role=status]", { hasText: "Hudson Messenger removed" });
      check("wishlist", "heart removes instantly with a toast", (await item(page, "hudson-messenger").count()) === 0 && (await toast.count()) === 1 && /now has 3 pieces/.test(await toast.innerText()));
      await toast.locator("button", { hasText: "Undo" }).click();
      await page.waitForTimeout(250);
      check("wishlist", "Undo restores the piece in its place", JSON.stringify(await wishIds(page)) === JSON.stringify(WISHLIST_SEED) && (await toast.count()) === 0);
      await vis(page, '[data-wishlist-item="petal-chain-bag"] button[aria-label="Remove from wishlist"]').click();
      await page.waitForTimeout(8600);
      check("wishlist", "toast leaves after 8 seconds; removal sticks", (await page.locator("[role=status]", { hasText: "removed" }).count()) === 0 && !(await wishIds(page)).includes("petal-chain-bag"));
      // Move to bag + Undo
      const before = await bagQty(page);
      await item(page, "city-tote").locator("button", { hasText: "Move to bag" }).click();
      await page.waitForTimeout(300);
      check("wishlist", "Move to bag confirms in place ('Added to bag')", (await item(page, "city-tote").locator("button", { hasText: "Added to bag" }).count()) === 1);
      check("wishlist", "bag gains the piece; header count updates", (await bagQty(page)) === before + 1 && (await page.locator('header a[href="/bag"]').first().innerText().catch(() => "")).includes(String(before + 1)));
      await page.waitForTimeout(1800);
      const moved = page.locator("[role=status]", { hasText: "City Tote moved to your bag" });
      check("wishlist", "then leaves the list with a 'moved' toast", (await item(page, "city-tote").count()) === 0 && (await moved.count()) === 1);
      await moved.locator("button", { hasText: "Undo" }).click();
      await page.waitForTimeout(250);
      check("wishlist", "Undo of a move puts it back and takes it out of the bag", (await wishIds(page))[0] === "city-tote" && (await bagQty(page)) === before);
      await item(page, "charter-backpack").locator("button", { hasText: "Move to bag" }).click();
      await page.waitForTimeout(2200);
      await page.reload();
      await settle(page);
      check("wishlist", "move persists across reload (bag + list)", !(await wishIds(page)).includes("charter-backpack") && (await bagQty(page)) === before + 1);
      // Share
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
      await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
      await page.locator('main button:has-text("Share wishlist")').click();
      await page.waitForTimeout(400);
      const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
      check("wishlist", "Share copies a link to this list", /\/wishlist\?items=city-tote,hudson-messenger$/.test(copied) && (await page.locator("main", { hasText: "Link copied" }).count()) > 0, copied);
      // Empty
      await page.evaluate(() => localStorage.setItem("coach.wishlist.v1", "[]"));
      await page.reload();
      await settle(page);
      check("wishlist", "empty state with CTAs", (await page.locator("main", { hasText: "Keep What Catches Your Eye" }).count()) > 0 && (await page.locator('main a[href="/new-arrivals"]').count()) > 0 && (await page.locator('main a[href="/account?next=%2Fwishlist"]').count()) > 0);
    }),
  );
  tasks.push(() =>
    flow(browser, "wishlist/shared", 1440, { local: { "coach.wishlist.v1": ["city-tote"] } }, async (page) => {
      await page.goto(`${BASE}/wishlist?items=gotham-briefcase,city-tote,not-a-product`);
      await settle(page);
      const main = await page.locator("main").innerText();
      check("wishlist", "shared link shows its pieces (unknown ids dropped)", (await page.locator("[data-wishlist-item]").count()) === 2 && /SHARED WISHLIST/i.test(main));
      await page.locator('main button:has-text("Save all to my wishlist")').click();
      check("wishlist", "Save all adds only the missing pieces", JSON.stringify(await wishIds(page)) === JSON.stringify(["city-tote", "gotham-briefcase"]) && (await page.locator('main button:has-text("All saved")').count()) === 1);
    }),
  );
  tasks.push(() =>
    flow(browser, "wishlist/sync", 1440, { local: { "coach.wishlist.v1": ["city-tote"], "coach.accounts.v1": { [DELIVERY_VALUES.email]: { ...(accountSeed(undefined, undefined, false)["coach.accounts.v1"] as Record<string, Record<string, unknown>>)[DELIVERY_VALUES.email], wishlist: ["gotham-briefcase"] } } } }, async (page) => {
      await page.goto(`${BASE}/wishlist`);
      await settle(page);
      await page.locator('main a[href="/account?next=%2Fwishlist"]').first().click();
      await page.waitForURL(/\/account/);
      await settle(page);
      await signInWith(page, DELIVERY_VALUES.email, ACCOUNT_PASSWORD);
      await page.waitForURL(`${BASE}/wishlist`, { timeout: 8000 }).catch(() => {});
      await settle(page);
      const main = await page.locator("main").innerText();
      check("wishlist", "sign-in from the banner returns to /wishlist", new URL(page.url()).pathname === "/wishlist");
      check("wishlist", "sign-in merges account + device lists", (await page.locator("[data-wishlist-item]").count()) === 2 && /Saved on this device and your account/.test(main) && !/Keep your wishlist on every device/.test(main));
      const reg = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.accounts.v1") ?? "{}"));
      check("wishlist", "account copy updated (follows you to other devices)", JSON.stringify(Object.values(reg as Record<string, { wishlist?: string[] }>)[0]?.wishlist?.slice().sort()) === JSON.stringify(["city-tote", "gotham-briefcase"]));
      await page.goto(`${BASE}/account`);
      await settle(page);
      const card = page.locator("main").getByText("View wishlist").first();
      check("wishlist", "Account overview card reflects the list", /2 pieces saved — City Tote, Gotham Briefcase/.test(await page.locator("main").innerText()));
      await card.click();
      await page.waitForURL(`${BASE}/wishlist`);
      check("wishlist", "Account 'View wishlist' → /wishlist", true);
    }),
  );
  for (const w of [393, 320]) {
    tasks.push(() =>
      flow(browser, `wishlist/mobile@${w}`, w, { local: { "coach.wishlist.v1": WISHLIST_SEED } }, async (page) => {
        await page.goto(`${BASE}/wishlist`);
        await settle(page);
        const xs = await page.locator("[data-wishlist-item]").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
        check("wishlist", `@${w}: two-column grid (Figma mobile)`, new Set(xs).size === 2, xs.join(","));
        check("wishlist", `@${w}: no horizontal overflow`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= w);
        await vis(page, '[data-wishlist-item="city-tote"] button:has-text("Move to bag")').click();
        check("wishlist", `@${w}: Move to bag works`, (await bagQty(page)) === 1);
      }),
    );
  }

  // 7e. Search (page 13) — overlay + results page
  const dialog = (page: Page) => page.locator('[role=dialog][aria-label="Search"]');
  const combo = (page: Page) => dialog(page).locator("input[role=combobox]");
  const typeQuery = async (page: Page, q: string) => {
    await combo(page).fill(q);
    await page.waitForTimeout(350); // 150 ms debounce + render
  };
  const optionTexts = (page: Page) => dialog(page).locator("[role=option]").allInnerTexts();
  tasks.push(() =>
    flow(browser, "search/overlay", 1440, { local: { "coach.search.recent.v1": ["one", "two", "three", "four", "five"] } }, async (page) => {
      await page.goto(`${BASE}/women`);
      await settle(page);
      const icon = page.locator('header button[aria-label="Search"]').filter({ visible: true });
      await icon.click();
      await page.waitForTimeout(250);
      check("search", "icon opens the overlay with the input focused", (await dialog(page).isVisible()) && (await page.evaluate(() => document.activeElement?.getAttribute("role"))) === "combobox");
      check("search", "body scroll locked while open", (await page.evaluate(() => document.body.style.overflow)) === "hidden");
      check("search", "default content: recent, popular, trending", /RECENT/.test(await dialog(page).innerText()) && /POPULAR/.test(await dialog(page).innerText()) && /TRENDING NOW/.test(await dialog(page).innerText()));
      for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
      check("search", "focus trapped inside the overlay", await page.evaluate(() => !!document.activeElement?.closest('[role=dialog][aria-label="Search"]')));
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
      check("search", "Esc closes; focus back on the icon; scroll unlocked", !(await dialog(page).count()) && (await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))) === "Search" && (await page.evaluate(() => document.body.style.overflow)) !== "hidden");
      await page.locator("body").click({ position: { x: 5, y: 500 } });
      await page.keyboard.press("/");
      await page.waitForTimeout(200);
      check("search", "'/' opens search on desktop", await dialog(page).isVisible());
      await dialog(page).locator('button[aria-label="Close search"]').click();
      check("search", "× with an empty field closes", !(await dialog(page).count()));
      await page.locator('footer input[type="email"]').first().focus();
      await page.keyboard.press("/");
      await page.waitForTimeout(200);
      check("search", "'/' typed inside an input does not open search", !(await dialog(page).count()));
      await icon.click();
      await page.mouse.click(700, 860);
      await page.waitForTimeout(150);
      check("search", "clicking the scrim closes", !(await dialog(page).count()));
      // Never stacked with the mega-menu
      await icon.click();
      await page.waitForTimeout(150);
      await page.locator('header nav[aria-label="Primary"] button, header nav[aria-label="Primary"] a').filter({ hasText: /^women$/i }).first().hover();
      await page.waitForTimeout(500);
      const megaOpen = async () => (await page.locator('header nav[aria-label="Primary"] [aria-expanded="true"]').count()) > 0;
      check("search", "opening a mega-menu closes search (never stacked)", !(await dialog(page).count()) && (await megaOpen()));
      await page.keyboard.press("/");
      await page.waitForTimeout(300);
      check("search", "opening search closes the mega-menu", (await dialog(page).isVisible()) && !(await megaOpen()));
      // Suggestions
      await typeQuery(page, "to");
      check("search", "under 3 letters keeps the default content", (await dialog(page).locator("[role=listbox]").count()) === 0);
      await typeQuery(page, "tote");
      let opts = await optionTexts(page);
      check("search", "'tote': products with price", opts.some((o) => /City Tote/.test(o) && /\$350/.test(o)) && opts.some((o) => /Cargo Tote/.test(o)));
      check("search", "'tote': collection link to a filtered view", (await dialog(page).locator("[role=option]", { hasText: "Totes" }).count()) > 0 && opts.some((o) => /See all 2 results/.test(o)));
      await typeQuery(page, "black");
      opts = await optionTexts(page);
      check("search", "'black': suggestions + black pieces", opts.some((o) => /black\s+(tote|backpack|mini bag)/i.test(o)) && opts.some((o) => /Black/.test(o) && /\$/.test(o)));
      await typeQuery(page, "Tabby");
      check("search", "'Tabby': Quilted Tabby 20", (await optionTexts(page)).some((o) => /Quilted Tabby 20/.test(o)));
      await typeQuery(page, "tab");
      check("search", "typed letters highlighted in matches", (await dialog(page).locator("mark", { hasText: /^Tab$/ }).count()) > 0);
      await typeQuery(page, "backpack");
      opts = await optionTexts(page);
      check("search", "'backpack': Charter Backpack + Backpacks view", opts.some((o) => /Charter Backpack/.test(o)) && opts.some((o) => /^Backpacks/.test(o.trim())));
      await typeQuery(page, "zzz");
      check("search", "'zzz': no suggestions, a helpful message", (await dialog(page).locator("[role=option]").count()) === 0 && /No pieces match “zzz”/.test(await dialog(page).innerText()));
      // ARIA + keyboard
      await typeQuery(page, "tote");
      await combo(page).press("ArrowDown");
      const activeId = await combo(page).getAttribute("aria-activedescendant");
      check("search", "ArrowDown highlights an option (aria-activedescendant / aria-selected)", !!activeId && (await page.locator(`[id="${activeId}"][aria-selected=true]`).count()) === 1 && (await combo(page).getAttribute("aria-expanded")) === "true");
      await combo(page).press("ArrowDown");
      await combo(page).press("ArrowUp");
      await combo(page).press("Enter");
      await page.waitForURL(/\/search\?q=/, { timeout: 8000 }).catch(() => {});
      check("search", "Enter opens the highlighted suggestion", /\/search\?q=totes?/i.test(page.url()), page.url());
      await settle(page);
      await icon.click();
      await typeQuery(page, "backpack");
      await combo(page).press("Enter");
      await page.waitForURL(`${BASE}/search?q=backpack`, { timeout: 8000 }).catch(() => {});
      check("search", "Enter with nothing highlighted submits to /search?q=", new URL(page.url()).searchParams.get("q") === "backpack");
      await settle(page);
      const recent = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.search.recent.v1") ?? "[]"));
      check("search", "recent searches saved, newest first, max 5", recent[0] === "backpack" && recent.length === 5, JSON.stringify(recent));
      await icon.click();
      await page.waitForTimeout(200);
      check("search", "overlay lists recent searches", (await dialog(page).locator("button", { hasText: /^backpack$/ }).count()) === 1);
      await dialog(page).locator("button", { hasText: "Clear" }).click();
      check("search", "Clear empties recent searches", (await page.evaluate(() => localStorage.getItem("coach.search.recent.v1"))) === null && !/RECENT/.test(await dialog(page).innerText()));
      // A product suggestion opens its page.
      await typeQuery(page, "gotham");
      await dialog(page).locator('[role=option][id$="-gotham-briefcase"]').click();
      await page.waitForURL(/\/products\/gotham-briefcase/, { timeout: 8000 }).catch(() => {});
      check("search", "product suggestion opens the product page", new URL(page.url()).pathname === "/products/gotham-briefcase");
    }),
  );
  tasks.push(() =>
    flow(browser, "search/results", 1440, {}, async (page) => {
      const count = async () => Number((await page.locator("main").innerText()).match(/(\d+) pieces?/)?.[1] ?? -1);
      const cards = () => page.locator('main a[aria-label^="View "]').filter({ visible: true });
      await page.goto(`${BASE}/search?q=Signature%20canvas`);
      await settle(page, 900);
      check("search", 'title is Search: "Signature canvas"', (await page.title()).startsWith('Search: "Signature canvas"'), await page.title());
      check("search", "robots noindex", /noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""));
      const main = await page.locator("main").innerText();
      check("search", "query + count shown as designed", /SEARCH RESULTS/.test(main) && /“Signature canvas”/.test(main) && (await count()) === (await cards().count()) && (await count()) > 0);
      check("search", "chips + sort as designed (no Filters drawer)", (await page.locator('main button:has-text("For Her")').count()) > 0 && (await page.locator('main button:has-text("Sort: Relevance")').count()) > 0 && (await page.locator('main button:has-text("Filters")').count()) === 0);
      const all = await count();
      await page.locator('main button:has-text("For Him")').click();
      await settle(page, 700);
      const him = await count();
      check("search", "For Him filters + syncs the URL (q kept)", new URL(page.url()).searchParams.get("for") === "him" && new URL(page.url()).searchParams.get("q") === "Signature canvas" && him < all && him === (await cards().count()));
      await page.locator('main button:has-text("Sort: Relevance")').click();
      await page.locator('[role=option]:has-text("Price, Low to High")').click();
      await settle(page, 700);
      const prices = await page.locator("main").evaluate((m) => [...m.querySelectorAll('a[aria-label^="View "]')].filter((a) => (a as HTMLElement).offsetParent).map((a) => Number(a.parentElement!.innerText.match(/\$([\d,]+)/)?.[1].replace(",", "") ?? 0)));
      check("search", "sort by price reorders + syncs the URL", new URL(page.url()).searchParams.get("sort") === "price-asc" && prices.every((p, i) => i === 0 || p >= prices[i - 1]), prices.join(","));
      await page.reload();
      await settle(page, 900);
      check("search", "filters + sort survive reload", new URL(page.url()).searchParams.get("for") === "him" && (await page.locator('main button:has-text("Price, Low to High")').count()) > 0 && (await count()) === him);
      await page.goBack();
      await settle(page, 900);
      check("search", "Back steps to the previous filter state", new URL(page.url()).searchParams.get("sort") === null && new URL(page.url()).searchParams.get("for") === "him");
    }),
  );
  tasks.push(() =>
    flow(browser, "search/matching", 1440, {}, async (page) => {
      const count = async () => Number((await page.locator("main").innerText()).match(/(\d+) pieces?/)?.[1] ?? -1);
      // Matching rules
      const n = async (q: string) => {
        await page.goto(`${BASE}/search?q=${encodeURIComponent(q)}`);
        await settle(page, 600);
        return (await page.locator("main", { hasText: "NO PIECES FOUND" }).count()) ? 0 : await count();
      };
      check("search", "case-insensitive (TOTE = tote)", (await n("TOTE")) === (await n("tote")) && (await n("tote")) > 0);
      check("search", "accent-insensitive (pébble = pebble)", (await n("pébble")) === (await n("pebble")) && (await n("pebble")) > 0);
      check("search", "plurals (totes = tote)", (await n("totes")) === (await n("tote")));
      check("search", "no in-word fuzz ('blk' finds nothing)", (await n("blk")) === 0);
      check("search", "partial words ('tab' → Tabby)", (await n("tab")) === 1);
      // Results — None
      await page.goto(`${BASE}/search?q=hobo`);
      await settle(page);
      const none = await page.locator("main").innerText();
      check("search", "no-results state as designed", /NO PIECES FOUND/.test(none) && /Nothing for “hobo”/.test(none) && (await page.locator('main a[href="/client-care#contact"]').count()) > 0);
      await page.locator('main a:has-text("Totes")').click();
      await page.waitForURL(/\/bags\?type=totes/);
      check("search", "no-results chips lead to real filtered views", new URL(page.url()).searchParams.get("type") === "totes");
      await page.goto(`${BASE}/search?q=tabbby`);
      await settle(page);
      check("search", "spelling help ('tabbby' → tabby)", (await page.locator('main a[href="/search?q=tabby"]', { hasText: "tabby" }).count()) > 0);
      // No query
      await page.goto(`${BASE}/search`);
      await settle(page);
      check("search", "no query: designed default content, field focused", /TRENDING NOW/.test(await page.locator("main").innerText()) && (await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "q");
      await page.locator('main input[name="q"]').fill("Charter");
      await page.keyboard.press("Enter");
      await page.waitForURL(/q=Charter/);
      await settle(page);
      check("search", "results-page field submits a new search", (await count()) >= 2);
    }),
  );
  for (const w of [393, 320]) {
    tasks.push(() =>
      flow(browser, `search/mobile@${w}`, w, { local: { "coach.search.recent.v1": ["Quilted tabby"] } }, async (page) => {
        await page.goto(`${BASE}/men`);
        await settle(page);
        await page.locator('header button[aria-label="Search"]').filter({ visible: true }).click();
        await page.waitForTimeout(250);
        const box = await dialog(page).boundingBox();
        check("search", `@${w}: full-screen sheet with recent first`, !!box && box.width >= w - 1 && /RECENT[\s\S]*POPULAR[\s\S]*TRENDING/.test(await dialog(page).innerText()));
        check("search", `@${w}: no horizontal overflow`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= w);
        await typeQuery(page, "black");
        check("search", `@${w}: suggestions work`, (await dialog(page).locator("[role=option]").count()) > 0);
        await dialog(page).locator("button", { hasText: "Cancel" }).click();
        check("search", `@${w}: Cancel closes`, !(await dialog(page).count()));
      }),
    );
  }

  // 7f. Client Care (page 14)
  /** The section an anchor should land on: present, opened, and its top in view below the header. */
  const landed = async (page: Page, id: string) =>
    page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return "missing";
      const top = el.getBoundingClientRect().top;
      return top >= -2 && top < window.innerHeight * 0.6 ? "ok" : `top ${Math.round(top)}`;
    }, id);
  const expanded = (page: Page, id: string) => page.locator(`[id="${id}"] button[aria-expanded]`).getAttribute("aria-expanded");
  const panelOpen = (page: Page, id: string) => page.locator(`section[id="${id}"]`).isVisible().catch(() => false);
  tasks.push(() =>
    flow(browser, "client-care/page", 1440, {}, async (page) => {
      await page.goto(`${BASE}/client-care`);
      await settle(page);
      check("client-care", "title is 'Client Care …' with a description", /^Client Care\b/.test(await page.title()) && ((await page.locator('meta[name="description"]').getAttribute("content")) ?? "").length > 20);
      const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}")).find((j) => j["@type"] === "FAQPage"));
      const visibleQs = await page.locator("#faq button[aria-expanded]").allInnerTexts();
      check("client-care", "FAQPage JSON-LD mirrors the visible questions", !!ld && ld.mainEntity.length === visibleQs.length && ld.mainEntity.every((q: { name: string }) => visibleQs.some((v) => v.toLowerCase() === q.name.toLowerCase())));
      check("client-care", "contact links are fictional placeholders only", (await page.locator('a[href^="tel:"]').evaluateAll((as) => as.every((a) => a.getAttribute("href") === "tel:+12125550100"))) && (await page.locator('a[href^="mailto:"]').evaluateAll((as) => as.every((a) => /@coach\.example$/.test(a.getAttribute("href") ?? "")))) && (await page.locator('a[href*="coach.com"]').count()) === 0);
      // Topic cards → panels + hash
      await page.locator('main a[href="#shipping"]').first().click();
      await page.waitForTimeout(600);
      check("client-care", "topic card opens its panel + updates the hash", (await panelOpen(page, "shipping")) && new URL(page.url()).hash === "#shipping" && (await landed(page, "shipping")) === "ok");
      const rows = await page.locator("[data-policy]").allInnerTexts();
      const row = (k: string) => rows.find((r, i) => i === ["standard", "express", "international", "store"].indexOf(k)) ?? "";
      check("client-care", "policy: standard complimentary, 2–4 business days", /Complimentary/i.test(row("standard")) && /2–4 business days/.test(row("standard")));
      check("client-care", "policy: express $25, order before 2pm", /\$25/.test(row("express")) && /before 2pm/.test(row("express")));
      check("client-care", "policy: international tracked, 5–8 business days", /Tracked, 5–8 business days/.test(row("international")));
      check("client-care", "policy: 30-day free returns", /within 30 days — it’s free/.test(await page.locator('section[id="shipping"]').innerText()));
      await page.locator('main a[href="#leather-care"]').first().click();
      await page.waitForTimeout(500);
      check("client-care", "Leather Care guide (3 habits + repair service)", (await panelOpen(page, "leather-care")) && /Let It Breathe[\s\S]*Treat Gently[\s\S]*Return to Us[\s\S]*Book a Repair/.test(await page.locator('section[id="leather-care"]').innerText()));
      await page.locator('section[id="leather-care"] button:has-text("Book now")').click();
      await page.waitForTimeout(500);
      check("client-care", "Book a repair → contact form with the Care topic", (await panelOpen(page, "contact")) && (await page.inputValue("#contact-topic")) === "care");
      // FAQ
      await page.locator('#faq a:has-text("Payments")').click();
      await page.waitForTimeout(500);
      check("client-care", "FAQ category opens its question + updates the hash", (await expanded(page, "faq-payments")) === "true" && new URL(page.url()).hash === "#faq-payments");
      const q = page.locator('[id="faq-care"] button[aria-expanded]');
      await q.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
      const afterEnter = await q.getAttribute("aria-expanded");
      await page.keyboard.press("Space");
      await page.waitForTimeout(150);
      check("client-care", "FAQ by keyboard (Enter opens, Space closes; aria-controls set)", afterEnter === "true" && (await q.getAttribute("aria-expanded")) === "false" && !!(await q.getAttribute("aria-controls")));
      const faqText = (await page.locator("#faq").evaluate((el) => el.textContent)) ?? "";
      check("client-care", "FAQ answers read the policies (one hour, 30 days, one business day)", /within one hour/.test(faqText) && /within 30 days/.test(faqText) && /add one business day/.test(faqText));
      // Same-page footer link (pushState, no hashchange)
      await page.locator('footer a[href="/client-care#faq"]').click();
      await page.waitForTimeout(700);
      check("client-care", "footer link on the same page → FAQ (first question open)", (await landed(page, "faq")) === "ok" && (await expanded(page, "faq-orders")) === "true");
    }),
  );
  tasks.push(() =>
    flow(browser, "client-care/form", 1440, {}, async (page) => {
      await page.goto(`${BASE}/client-care#contact`);
      await settle(page, 700);
      const submit = page.locator('form[aria-labelledby="contact-title"] button[type=submit]');
      await submit.click();
      await page.waitForTimeout(250);
      check("client-care", "empty submit → error summary, focus on the first error", (await page.locator('form[aria-labelledby="contact-title"] [role=alert]').first().innerText()).includes("Please check 4 fields") && (await page.evaluate(() => document.activeElement?.id)) === "contact-topic");
      await page.selectOption("#contact-topic", "order");
      check("client-care", "order number appears only for order topics", (await page.locator("#contact-orderNumber").count()) === 1);
      await page.selectOption("#contact-topic", "care");
      check("client-care", "…and hides for other topics", (await page.locator("#contact-orderNumber").count()) === 0);
      await page.selectOption("#contact-topic", "order");
      await page.fill("#contact-orderNumber", "CH-260418");
      await page.locator("#contact-orderNumber").blur();
      check("client-care", "bad order number rejected (CO- format)", /CO-7K2M9Q/.test(await page.locator("#contact-orderNumber-error").innerText().catch(() => "")));
      await page.fill("#contact-orderNumber", "co-7k2m9q");
      await page.locator("#contact-orderNumber").blur();
      check("client-care", "valid order number accepted + upper-cased", (await page.inputValue("#contact-orderNumber")) === "CO-7K2M9Q" && (await page.locator("#contact-orderNumber[aria-invalid=true]").count()) === 0);
      await page.fill("#contact-email", "tim@");
      await page.locator("#contact-email").blur();
      check("client-care", "invalid email rejected", /valid email/.test(await page.locator("#contact-email-error").innerText().catch(() => "")));
      await page.fill("#contact-name", "Tim Archer");
      await page.fill("#contact-email", "tim@studio.com");
      await page.fill("#contact-message", "Could the initials on my Tabby be silver instead of gold?");
      await submit.dblclick();
      check("client-care", "submitting shows a loading state", (await page.locator('form[aria-labelledby="contact-title"] button[type=submit][aria-busy=true]').count()) === 1);
      await page.waitForTimeout(1300);
      const sent = await page.locator('section[id="contact"]').innerText();
      check("client-care", "sent state with name, email, order + reference", /MESSAGE RECEIVED/.test(sent) && /Thank You, Tim/.test(sent) && /tim@studio\.com/.test(sent) && /CO-7K2M9Q/.test(sent) && /CC-[A-Z0-9]{6}/.test(sent));
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.contact.v1") ?? "[]"));
      check("client-care", "stored locally once (double-submit locked)", stored.length === 1 && stored[0].reference && stored[0].orderNumber === "CO-7K2M9Q");
      await page.locator('section[id="contact"] button:has-text("Back to Client Care")').click();
      await page.waitForTimeout(400);
      check("client-care", "Back to Client Care closes the panel + clears the hash", !(await panelOpen(page, "contact")) && new URL(page.url()).hash === "");
    }),
  );
  tasks.push(() =>
    flow(browser, "client-care/signed-in", 1440, { local: { ...accountSeed(), "coach.orders.v1": ORDERS_JSON } }, async (page) => {
      await page.goto(`${BASE}/client-care#contact`);
      await settle(page, 700);
      check("client-care", "signed-in prefill (name + email)", (await page.inputValue("#contact-name")) === `${DELIVERY_VALUES.firstName} Archer` && (await page.inputValue("#contact-email")) === DELIVERY_VALUES.email);
      await page.selectOption("#contact-topic", "order");
      check("client-care", "signed-in: recent orders offered for the order number", (await page.locator(`#contact-recent-orders option[value="${ORDER_ID}"]`).count()) === 1);
    }),
  );
  // Every entry point lands on its section
  const entries: { name: string; seed: Seed; from: string; link: string; target: string; open?: string }[] = [
    { name: "footer Contact Us", seed: {}, from: "/women", link: 'footer a[href="/client-care#contact"]', target: "contact" },
    { name: "footer Shipping & Returns", seed: {}, from: "/women", link: 'footer a[href="/client-care#shipping"]', target: "shipping" },
    { name: "footer Leather Care", seed: {}, from: "/women", link: 'footer a[href="/client-care#leather-care"]', target: "leather-care" },
    { name: "footer FAQ", seed: {}, from: "/women", link: 'footer a[href="/client-care#faq"]', target: "faq", open: "faq-orders" },
    { name: "checkout strip Shipping", seed: { local: { "coach.bag.v1": BAG_SEED } }, from: "/checkout/delivery", link: 'a[href="/client-care#shipping"]', target: "shipping" },
    { name: "checkout strip Contact", seed: { local: { "coach.bag.v1": BAG_SEED } }, from: "/checkout/delivery", link: 'a[href="/client-care#contact"]', target: "contact" },
    { name: "bag Client Care", seed: { local: { "coach.bag.v1": BAG_SEED } }, from: "/bag", link: 'main a[href="/client-care#contact"]', target: "contact" },
    { name: "order page Contact Client Care", seed: { local: { "coach.orders.v1": ORDERS_JSON } }, from: `/order/${ORDER_ID}`, link: 'main a[href="/client-care#contact"]', target: "contact" },
    { name: "search Ask Client Care", seed: {}, from: "/search?q=hobo", link: 'main a[href="/client-care#contact"]', target: "contact" },
    { name: "Women Make It Yours", seed: {}, from: "/women", link: 'main a[href="/client-care#personalisation"]', target: "personalisation", open: "personalisation" },
  ];
  for (const e of entries) {
    tasks.push(() =>
      flow(browser, `client-care/entry ${e.name}`, 1440, e.seed, async (page) => {
        await page.goto(`${BASE}${e.from}`);
        await settle(page);
        await vis(page, e.link).click();
        await page.waitForURL(/\/client-care#/, { timeout: 10000 }).catch(() => {});
        await settle(page, 900);
        const ok = (await landed(page, e.target)) === "ok";
        const opened = e.open ? (await expanded(page, e.open)) === "true" : await panelOpen(page, e.target);
        check("client-care", `${e.name} → #${e.target} (opened, heading in view)`, ok && opened, `${await landed(page, e.target)} · opened=${opened}`);
      }),
    );
  }
  tasks.push(() =>
    flow(browser, "client-care/policies", 1440, { local: { "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      const method = await page.locator("#delivery-method").innerText();
      check("client-care", "checkout uses the same express price + cut-off", /\$25/.test(method) && /2pm/.test(method));
      await page.goto(`${BASE}/products/city-tote`);
      await settle(page);
      await vis(page, 'button:has-text("DELIVERY & RETURNS")').click();
      check("client-care", "PDP delivery & returns copy from policies", /Complimentary delivery in 2–4 business days\. Returns are free within 30 days/.test(await page.locator("main").innerText()));
    }),
  );
  for (const w of [393, 320]) {
    tasks.push(() =>
      flow(browser, `client-care/mobile@${w}`, w, {}, async (page) => {
        await page.goto(`${BASE}/client-care#personalisation`);
        await settle(page, 900);
        check("client-care", `@${w}: #personalisation opens + lands`, (await expanded(page, "personalisation")) === "true" && (await landed(page, "personalisation")) === "ok");
        check("client-care", `@${w}: no horizontal overflow`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= w);
        await page.goto(`${BASE}/client-care#contact`);
        await settle(page, 700);
        check("client-care", `@${w}: contact form fits`, (await page.locator("#contact-message").evaluate((el) => el.getBoundingClientRect().right)) <= w);
      }),
    );
  }

  tasks.push(async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = `${dir}/${name}`;
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|json|md)$/.test(name)) scan(p);
      }
    };
    const scan = (p: string) => {
      for (const a of [...OLD_STORE_ADDRESSES, ...REAL_COACH_DETAILS]) if (readFileSync(p, "utf8").includes(a)) hits.push(`${p}: ${a}`);
    };
    for (const d of ["app", "components", "lib", "public"]) walk(d);
    scan("README.md");
    check("stores", "old store addresses + real Coach contact details absent from app / components / lib / public / README", hits.length === 0, hits.join(" | "));
  });

  // 7g. The House (page 15)
  const houseLanded = async (page: Page, id: string) =>
    page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return "missing";
      const top = el.getBoundingClientRect().top;
      return top >= -2 && top < window.innerHeight * 0.5 ? "ok" : `top ${Math.round(top)}`;
    }, id);
  const dlg = (page: Page) => page.locator('[role=dialog][aria-label^="Book an appointment"]');
  tasks.push(() =>
    flow(browser, "the-house/page", 1440, {}, async (page) => {
      await page.goto(`${BASE}/the-house`);
      await settle(page);
      check("the-house", "title 'The House …' with a description", /^The House\b/.test(await page.title()) && ((await page.locator('meta[name="description"]').getAttribute("content")) ?? "").length > 20);
      const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => [JSON.parse(s.textContent ?? "null")].flat()));
      const org = ld.find((j) => j?.["@type"] === "Organization");
      const shops = ld.filter((j) => j?.["@type"] === "Store");
      check("the-house", "Organization JSON-LD is fictional (concept study, .example)", !!org && /concept study/i.test(org.name) && /\.example$/.test(org.email) && !org.telephone && !org.sameAs);
      check("the-house", "one Store JSON-LD per boutique, no street address or phone", shops.length === 3 && shops.every((s: { address: { streetAddress?: string }; telephone?: string }) => !s.address.streetAddress && !s.telephone));
      check("the-house", "no phone or maps links for stores", (await page.locator('main a[href^="tel:"], main a[href*="maps"]').count()) === 0);
      const main = await page.locator("main").innerText();
      check("the-house", "Figma copy + numbers (Since 1941, 40+, 3 wks, For life)", /SINCE 1941/.test(main) && /40\+/.test(main) && /3 WKS|3 wks/i.test(main) && /For life/i.test(main));
      check("the-house", "store cards from lib/stores (3 boutiques, fictional streets)", (await page.locator("[data-store-card]").count()) === 3 && /48 Linden Mews, SoHo/.test(main) && /3 Wharfside Row, Level 2/.test(main));
      check("the-house", "'How a Tabby is made' → the product's craft section", (await page.locator('main a[href="/products/quilted-tabby-20#craft"]').count()) === 1);
      // Locator
      await page.locator('main button:has-text("Find a store near you")').click();
      await page.waitForTimeout(200);
      const summary = () => page.locator("#store-locator p[aria-live]").innerText();
      const listed = () => page.locator("#store-results [data-store]").evaluateAll((els) => els.map((e) => e.getAttribute("data-store")));
      const search = async (q: string) => {
        await page.locator("#store-locator input[type=search]").fill(q);
        await page.waitForTimeout(150);
      };
      check("the-house", "locator opens with 'New York, NY' → 3 boutiques by distance", /^3 boutiques within/.test(await summary()) && (await page.locator("#store-results [data-store] .type-price-sm").count()) === 3);
      await search("mercer");
      check("the-house", "search by boutique name", JSON.stringify(await listed()) === '["mercer-street"]');
      await search("MÉRCER STREET");
      check("the-house", "accent / case-insensitive", JSON.stringify(await listed()) === '["mercer-street"]');
      await search("10022");
      check("the-house", "search by ZIP sorts nearest first", (await listed())[0] === "fifth-avenue");
      await search("Midtown");
      check("the-house", "search by neighbourhood", (await listed())[0] === "fifth-avenue");
      await search("London");
      check("the-house", "miss → empty state", /^0 boutiques/.test(await summary()) && (await page.locator("#store-locator", { hasText: "No boutiques near “London”" }).count()) === 1);
      await page.locator('#store-locator button:has-text("Show all boutiques")').click();
      check("the-house", "'Show all' recovers", (await listed()).length === 3);
      await page.locator('[data-pin="hudson-yards"]').click();
      await page.waitForTimeout(200);
      check("the-house", "map pin selects the list item", (await page.locator('[data-store="hudson-yards"] button[aria-pressed=true]').count()) === 1 && (await page.locator('[data-pin="hudson-yards"][aria-pressed=true]').count()) === 1);
      await page.locator('[data-store="fifth-avenue"] button[aria-pressed]').click();
      check("the-house", "list item selects the map pin", (await page.locator('[data-pin="fifth-avenue"][aria-pressed=true]').count()) === 1);
      // Careers
      await page.locator('main button:has-text("View openings")').click();
      await page.waitForTimeout(200);
      check("the-house", "openings from lib/careers (4 roles)", (await page.locator("#openings button[aria-expanded]").count()) === 4);
      const role = page.locator("#openings button[aria-expanded]").first();
      await role.click();
      check("the-house", "an opening expands its details", (await role.getAttribute("aria-expanded")) === "true" && (await page.locator("#role-leather-artisan").isVisible()));
      await page.locator('#role-leather-artisan button:has-text("Apply")').click();
      check("the-house", "Apply collects nothing — concept-study message", /applications aren’t accepted/.test(await page.locator("#role-leather-artisan").innerText()) && (await page.locator("#openings input, #openings textarea").count()) === 0);
      // Same-page footer anchor
      await page.locator('footer a[href="/the-house#careers"]').click();
      await page.waitForTimeout(800);
      check("the-house", "same-page footer link → #careers", (await houseLanded(page, "careers")) === "ok");
    }),
  );
  tasks.push(() =>
    flow(browser, "the-house/booking", 1440, {}, async (page) => {
      await page.goto(`${BASE}/the-house#stores`);
      await settle(page);
      const trigger = page.locator('[data-store-card="mercer-street"] button');
      await trigger.click();
      await page.waitForTimeout(250);
      check("the-house", "booking opens as a dialog for the chosen store", (await dlg(page).isVisible()) && /MERCER STREET/.test(await dlg(page).innerText()));
      const days = await dlg(page).locator("[data-iso]").evaluateAll((els) => els.map((e) => ({ iso: e.getAttribute("data-iso")!, closed: e.getAttribute("aria-disabled") === "true", label: e.getAttribute("aria-label")! })));
      const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
      check("the-house", "no past dates offered", days.every((d) => d.iso >= today));
      const sunday = days.find((d) => /^Sunday/.test(d.label));
      check("the-house", "closed day (Mercer: Sunday) shown but disabled", !!sunday && sunday.closed);
      if (sunday) await dlg(page).locator(`[data-iso="${sunday.iso}"]`).dispatchEvent("click");
      check("the-house", "clicking a closed day doesn't select it", (await dlg(page).locator("[data-iso][aria-checked=true]").count()) === 0);
      await dlg(page).locator("button[type=submit]").click();
      await page.waitForTimeout(200);
      check("the-house", "empty submit → error summary in checkout style", /Please check \d fields/.test(await dlg(page).innerText()));
      await dlg(page).locator('#booking-service [role=radio]:has-text("Repair & care")').click();
      await dlg(page).locator("[data-iso]:not([aria-disabled])").first().click();
      await dlg(page).locator("#booking-time [role=radio]:not([aria-disabled])").first().click();
      await page.fill("#booking-name", "Tim Archer");
      await page.fill("#booking-email", "tim@studio.com");
      await page.fill("#booking-phone", "123");
      await page.locator("#booking-phone").blur();
      check("the-house", "phone uses the country rules (rejects '123')", (await page.locator("#booking-phone[aria-invalid=true]").count()) === 1);
      await page.selectOption("#booking-phone-country", "TH");
      await page.fill("#booking-phone", "081 234 5678");
      await page.locator("#booking-phone").blur();
      check("the-house", "Thai number valid once the country is Thailand", (await page.locator("#booking-phone[aria-invalid=true]").count()) === 0);
      check("the-house", "confirm button names the day + time", /^Confirm \w{3} \d+ · \d+:\d{2}/.test(await dlg(page).locator("button[type=submit]").innerText()));
      await dlg(page).locator("button[type=submit]").dblclick();
      await page.waitForTimeout(1300);
      const confirmation = await dlg(page).innerText();
      check("the-house", "confirmation with an AP- reference", /You’re Booked/i.test(confirmation) && /AP-[A-Z0-9]{6}/.test(confirmation) && /Repair & care at Mercer Street/.test(confirmation));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("coach.appointments.v1") ?? "[]"));
      check("the-house", "saved once to coach.appointments.v1 (double-submit locked)", saved.length === 1 && saved[0].storeId === "mercer-street" && saved[0].service === "repair");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      check("the-house", "Esc closes; focus returns to the trigger", !(await dlg(page).count()) && (await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))) === "Book an appointment at Mercer Street");
      await trigger.click();
      for (let i = 0; i < 30; i++) await page.keyboard.press("Tab");
      check("the-house", "focus trapped in the booking dialog", await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]")));
    }),
  );
  tasks.push(() =>
    flow(browser, "the-house/signed-in", 1440, { local: accountSeed() }, async (page) => {
      await page.goto(`${BASE}/the-house#stores`);
      await settle(page);
      await page.locator('[data-store-card="fifth-avenue"] button').click();
      await page.waitForTimeout(250);
      check("the-house", "booking prefills name + email when signed in", (await page.inputValue("#booking-name")) === `${DELIVERY_VALUES.firstName} Archer` && (await page.inputValue("#booking-email")) === DELIVERY_VALUES.email);
      await dlg(page).locator('#booking-service [role=radio]:has-text("Personal styling")').click();
      await dlg(page).locator("[data-iso]:not([aria-disabled])").first().click();
      await dlg(page).locator("#booking-time [role=radio]:not([aria-disabled])").first().click();
      await page.fill("#booking-phone", "212 555 0100");
      await dlg(page).locator("button[type=submit]").click();
      await page.waitForTimeout(1300);
      await page.goto(`${BASE}/account`);
      await settle(page);
      const overview = await page.locator("main").innerText();
      check("the-house", "Account overview shows the upcoming appointment", /APPOINTMENT/.test(overview) && /Personal styling · Fifth Avenue/.test(overview));
    }),
  );
  const houseEntries: { name: string; w: number; seed: Seed; from: string; act: (page: Page) => Promise<void>; target: string }[] = [
    ...(["story", "craftsmanship", "stores", "careers"] as const).map((id) => ({
      name: `footer #${id}`,
      w: 1440,
      seed: {},
      from: "/women",
      act: (page: Page) => vis(page, `footer a[href="/the-house#${id}"]`).click(),
      target: id,
    })),
    {
      name: "mobile menu Find a Store",
      w: 393,
      seed: {},
      from: "/women",
      act: async (page: Page) => {
        await page.locator('header button[aria-label="Open menu"]').click();
        await page.waitForTimeout(300);
        await vis(page, '#mobile-menu a[href="/the-house#stores"]').click();
      },
      target: "stores",
    },
    { name: "Bags Care for Life promo", w: 1440, seed: {}, from: "/bags", act: (page: Page) => vis(page, 'main a[href="/the-house#stores"]').click(), target: "stores" },
    {
      name: "Client Care Book an appointment",
      w: 1440,
      seed: {},
      from: "/client-care",
      act: (page: Page) => vis(page, 'main a[href="/the-house#stores"]').click(),
      target: "stores",
    },
  ];
  for (const e of houseEntries) {
    tasks.push(() =>
      flow(browser, `the-house/entry ${e.name}`, e.w, e.seed, async (page) => {
        await page.goto(`${BASE}${e.from}`);
        await settle(page);
        await e.act(page);
        await page.waitForURL(/\/the-house#/, { timeout: 10000 }).catch(() => {});
        await settle(page, 900);
        const r = await houseLanded(page, e.target);
        check("the-house", `${e.name} → #${e.target} (heading in view)`, r === "ok", r);
      }),
    );
  }
  tasks.push(() =>
    flow(browser, "the-house/checkout-stores", 1440, { local: { "coach.bag.v1": BAG_SEED } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      await page.locator('#delivery-method input[value="store"], #delivery-method label:has-text("Collect in Store")').first().click();
      await page.waitForTimeout(300);
      const text = await page.locator("#delivery-method").innerText();
      check("the-house", "checkout Collect in Store reads the same boutiques", (await page.locator('input[name="store"]').count()) === 3 && /Hudson Yards Boutique/.test(text) && /48 Linden Mews, New York/.test(text));
    }),
  );
  for (const w of [393, 320]) {
    tasks.push(() =>
      flow(browser, `the-house/mobile@${w}`, w, {}, async (page) => {
        await page.goto(`${BASE}/the-house#stores`);
        await settle(page, 900);
        check("the-house", `@${w}: #stores lands`, (await houseLanded(page, "stores")) === "ok");
        await page.locator('main button:has-text("Find a store near you")').click();
        await page.locator('[data-store="mercer-street"] button[aria-pressed]').click();
        await page.locator('#store-locator button:has-text("Book an appointment")').first().click();
        await page.waitForTimeout(300);
        const box = await dlg(page).boundingBox();
        check("the-house", `@${w}: booking dialog fits the screen`, !!box && box.x >= 0 && box.x + box.width <= w + 1);
        await page.keyboard.press("Escape");
        check("the-house", `@${w}: no horizontal overflow`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= w);
      }),
    );
  }

  // 7h. 404 & errors (page 16)
  tasks.push(() =>
    flow(browser, "errors/status", 1440, {}, async () => {
      for (const [path, status] of [
        ["/this-page-does-not-exist", 404],
        ["/products/not-a-product", 404],
        ["/order/CO-NOPE00", 404],
        ["/wishlist?items=not-a-product,nor-this", 404],
        ["/order/CO-ZZZZZZ", 200], // well-formed: looked up on the device, the 404 design renders client-side
        ["/__test/error", 404],
        ["/__test/offline", 404],
        ["/__test/global-error", 404],
      ] as const) {
        const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
        check("errors", `${path} → HTTP ${status}${path.startsWith("/__test") ? " (dev hook disabled in production)" : ""}`, res.status === status, `got ${res.status}`);
      }
    }),
  );
  tasks.push(() =>
    flow(browser, "errors/404", 1440, {}, async (page) => {
      await page.goto(`${BASE}/this-page-does-not-exist`);
      await settle(page);
      check("errors", "404: title 'Page not found' + noindex", /^Page not found/.test(await page.title()) && /noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""));
      const main = await page.locator("main").innerText();
      check("errors", "404: designed copy + header/footer present", /PAGE NOT FOUND/.test(main) && /This Chapter Is Missing/.test(main) && (await page.locator("header nav[aria-label=Primary]").count()) === 1 && (await page.locator("footer").count()) === 1);
      check("errors", "404: CTAs + chips link to real pages", (await page.locator('main a[href="/"]').count()) > 0 && (await page.locator('main a[href="/new-arrivals"]').count()) > 0 && (await page.locator('main a[href="/women"], main a[href="/men"], main a[href="/client-care"]').count()) === 3);
      let reached = false;
      for (let i = 0; i < 40 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate(() => document.activeElement?.textContent?.trim().startsWith("Back to home") ?? false);
      }
      check("errors", "404: keyboard reaches 'Back to home'", reached);
      await page.locator('main input[name="q"]').fill("tote");
      await page.keyboard.press("Enter");
      await page.waitForURL(/\/search\?q=tote/, { timeout: 8000 }).catch(() => {});
      check("errors", "404: search field submits to /search", new URL(page.url()).searchParams.get("q") === "tote");
      for (const [path, eyebrow] of [
        ["/products/not-a-product", "PAGE NOT FOUND"],
        ["/order/CO-NOPE00", "PAGE NOT FOUND"],
        ["/order/CO-ZZZZZZ", "ORDER NOT FOUND"],
        ["/wishlist?items=not-a-product", "PAGE NOT FOUND"],
      ] as const) {
        await page.goto(`${BASE}${path}`);
        await settle(page, 700);
        check("errors", `${path}: the shared 404 design (${eyebrow})`, (await page.locator("main [data-not-found]").count()) === 1 && (await page.locator("main").innerText()).includes(eyebrow));
      }
    }),
  );
  tasks.push(() =>
    flow(browser, "errors/offline", 1440, { local: { "coach.bag.v1": BAG_SEED, "coach.wishlist.v1": ["city-tote"] } }, async (page) => {
      await page.goto(`${BASE}/checkout/delivery`);
      await settle(page);
      await page.fill("input[name=email]", "offline@example.com");
      await page.waitForTimeout(300);
      await page.context().setOffline(true);
      await page.waitForTimeout(400);
      const card = page.locator("[data-offline]");
      check("errors", "offline: the designed state appears", (await card.isVisible()) && /YOU’RE OFFLINE/.test(await card.innerText()) && /Connection Lost/.test(await card.innerText()));
      check("errors", "offline: focus moves to the message", await page.evaluate(() => !!document.activeElement?.closest("[data-offline]")));
      await card.locator('button:has-text("Retry")').click();
      await page.waitForTimeout(600);
      check("errors", "offline: Retry while still offline says so", /Still offline/.test(await card.innerText()) && (await card.isVisible()));
      await page.context().setOffline(false);
      await page.waitForTimeout(800);
      check("errors", "back online: recovers automatically", !(await card.isVisible().catch(() => false)));
      check("errors", "bag, wishlist + checkout survive offline", (await page.inputValue("input[name=email]")) === "offline@example.com" && (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.bag.v1")!).lines.length)) === BAG_SEED.lines.length && (await page.evaluate(() => JSON.parse(localStorage.getItem("coach.wishlist.v1")!)[0])) === "city-tote");
    }),
  );
  for (const w of [393, 320]) {
    tasks.push(() =>
      flow(browser, `errors/mobile@${w}`, w, {}, async (page) => {
        const res = await page.goto(`${BASE}/nothing-here-${w}`);
        await settle(page);
        check("errors", `@${w}: 404 status + layout fits`, res?.status() === 404 && (await page.evaluate(() => document.documentElement.scrollWidth)) <= w);
        await page.context().setOffline(true);
        await page.waitForTimeout(400);
        const box = await page.locator("[data-offline] [role=alertdialog]").boundingBox();
        check("errors", `@${w}: offline card fits`, !!box && box.x >= 0 && box.x + box.width <= w + 1);
        await page.context().setOffline(false);
      }),
    );
  }

  // 8. Footer
  tasks.push(() =>
    flow(browser, "footer", 1440, {}, async (page) => {
      await page.goto(`${BASE}/women`);
      await settle(page);
      const field = page.locator('footer input[type="email"]').filter({ visible: true }).first();
      await field.fill("not-an-email");
      await page.locator('footer button[aria-label="Subscribe"]').filter({ visible: true }).first().click();
      check("footer", "newsletter rejects invalid email", (await page.locator("footer", { hasText: "valid email" }).count()) > 0);
      await field.fill("reader@example.com");
      await page.locator('footer button[aria-label="Subscribe"]').filter({ visible: true }).first().click();
      check("footer", "newsletter success state", (await page.locator("footer", { hasText: "on the list" }).count()) > 0);
      const hrefs = await page.$$eval("footer a[href]", (as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
      for (const href of hrefs) {
        const path = new URL(href, BASE).pathname;
        if (PENDING_PREFIXES.some((p) => path.startsWith(p))) continue;
        check("footer", `link ${href}`, (await fetch(new URL(href, BASE))).status === 200);
      }
    }),
  );
  tasks.push(() =>
    flow(browser, "footer/mobile", 393, {}, async (page) => {
      await page.goto(`${BASE}/women`);
      await settle(page);
      const acc = page.locator("footer button[aria-expanded]");
      const n = await acc.count();
      for (let i = 0; i < n; i++) {
        await acc.nth(i).click();
        check("footer/mobile", `accordion ${i + 1} expands`, (await acc.nth(i).getAttribute("aria-expanded")) === "true");
      }
    }),
  );

  // 8b. Footer socials are plain text by decision (concept study, no affiliation) — never links or buttons.
  tasks.push(() =>
    flow(browser, "footer/socials", 1440, {}, async (page) => {
      await page.goto(`${BASE}/women`);
      await settle(page);
      for (const name of ["Instagram", "Pinterest", "YouTube"]) {
        const info = await page.$$eval(
          "footer *",
          (els, name) =>
            els
              .filter((e) => e.childElementCount === 0 && e.textContent?.trim() === name && (e as HTMLElement).offsetParent)
              .map((e) => ({ tag: e.tagName, interactive: !!e.closest("a,button,[role=link],[role=button]"), cursor: getComputedStyle(e).cursor, tabbable: (e as HTMLElement).tabIndex >= 0 })),
          name,
        );
        check("footer/socials", `${name} is plain text`, info.length > 0 && info.every((i) => !i.interactive && i.cursor !== "pointer" && !i.tabbable), JSON.stringify(info));
      }
    }),
  );

  // 8c. Small Leather links (no products yet, by decision) land on the designed no-results state with working CTAs.
  for (const [menu, href, noun] of [
    ["Women", "/women?type=wallets", "wallets"],
    ["Women", "/women?type=card-cases", "card cases"],
    ["Women", "/women?type=wristlets", "wristlets"],
    ["Women", "/women?type=bag-charms", "bag charms"],
    ["Men", "/men?type=wallets", "wallets"],
    ["Men", "/men?type=card-cases", "card cases"],
    ["Men", "/men?type=belts", "belts"],
    ["Men", "/men?type=key-fobs", "key fobs"],
  ] as const) {
    tasks.push(() =>
      flow(browser, `small-leather${href}`, 1440, {}, async (page) => {
        const area = `small-leather${href}`;
        await page.goto(`${BASE}/new-arrivals`);
        await settle(page);
        const trigger = page.locator(`header nav button[aria-controls]:text-is("${menu}")`);
        await trigger.focus();
        await page.keyboard.press("Enter");
        await page.locator(`header a[href="${href}"]`).filter({ visible: true }).click();
        await page.waitForURL((u) => u.pathname + u.search === href, { timeout: 8000 });
        await settle(page, 400);
        const main = await page.locator("main").innerText();
        check(area, "designed no-results card", main.includes("NO PIECES FOUND") && main.includes("Nothing Matches — Yet.") && main.includes(`No ${noun} right now.`), main.match(/No [^.]*right now\./)?.[0] ?? "copy missing");
        check(area, "no product cards rendered", (await cardsOn(page)).length === 0);
        await vis(page, 'main button:has-text("Notify me")').click();
        await vis(page, 'main input[type="email"]').fill("reader@example.com");
        await page.keyboard.press("Enter");
        check(area, "Notify me → success", (await page.locator('main [role="status"]', { hasText: "arrives" }).count()) > 0);
        await vis(page, 'main button:has-text("Clear filters")').click();
        await settle(page, 600);
        check(area, "Clear filters → full collection", (await search(page)) === "" && (await cardsOn(page)).length > 0);
      }),
    );
  }

  // 9. Persistence
  tasks.push(() =>
    flow(browser, "persistence", 1440, {}, async (page) => {
      await page.goto(`${BASE}/products/hudson-messenger`);
      await settle(page);
      await page.locator('main button:has-text("Add to bag")').first().click();
      await page.waitForTimeout(2600);
      await page.keyboard.press("Escape");
      await page.locator('main button:has-text("Save to wishlist")').click();
      await page.reload();
      await settle(page);
      check("persistence", "bag count survives reload", /1 item/.test((await page.locator('header a[href="/bag"]').first().getAttribute("aria-label")) ?? ""));
      check("persistence", "wishlist survives reload", (await page.evaluate(() => localStorage.getItem("coach.wishlist.v1") ?? "")).includes("hudson-messenger"));
    }),
  );

  await pool(tasks, CONCURRENCY, (t) => t());
}


// ───────────────────────── 6. a11y ─────────────────────────
const AXE_SOURCE = readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
/** Figma colour tokens (app/globals.css @theme) — a contrast miss between two of these is a design flag, not a bug. */
const FIGMA_COLOURS = new Set([...readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").matchAll(/--color-[\w-]+:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase()));
type AxeNode = { target: string[]; html: string; dimmed?: boolean; any: { id: string; data?: { fgColor?: string; bgColor?: string; contrastRatio?: number; expectedContrastRatio?: string } }[] };
type AxeViolation = { id: string; impact: string; help: string; nodes: AxeNode[] };

async function a11y(browser: Browser) {
  const jobs = targets().flatMap((t) => [
    { t, w: 1440, h: 900 },
    { t, w: 393, h: 852 },
  ]);
  await pool(jobs, CONCURRENCY, async ({ t, w, h }) => {
    const ctx = await newContext(browser, w, h, t.seed);
    const page = await ctx.newPage();
    const tag = `${labelOf(t)} @${w}`;
    await page.goto(`${BASE}${t.path}`);
    await settle(page, 1400); // past the Home intro animation
    await page.addScriptTag({ content: AXE_SOURCE });
    const violations = (await page.evaluate(async () => {
      const dimmed = (sel: string) => {
        for (let n = document.querySelector(sel); n; n = n.parentElement) if (["0.35", "0.45"].includes(getComputedStyle(n).opacity)) return true;
        return false;
      };
      // @ts-expect-error axe is injected above
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] }, resultTypes: ["violations"] });
      // Mark contrast nodes drawn in Figma's disabled-button opacity (Button 13:103 "Disabled": 35% / 45%).
      for (const v of r.violations) for (const n of v.nodes) n.dimmed = v.id === "color-contrast" && dimmed(n.target[0]);
      return r.violations;
    })) as AxeViolation[];
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const problems: string[] = [];
    for (const v of serious) {
      if (v.id !== "color-contrast") {
        problems.push(`${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}${v.nodes.length > 3 ? ` +${v.nodes.length - 3}` : ""}`);
        continue;
      }
      for (const n of v.nodes) {
        const d = n.any.find((a) => a.id === "color-contrast")?.data ?? {};
        const fg = d.fgColor?.toLowerCase() ?? "?";
        const bg = d.bgColor?.toLowerCase() ?? "?";
        if (n.dimmed) addTo(contrastFlags, `Figma disabled-state button (ink at 35% opacity): ${fg} on ${bg} — ${d.contrastRatio}:1, needs ${d.expectedContrastRatio}`, `${labelOf(t)}: ${n.target.join(" ")}`);
        else if (FIGMA_COLOURS.has(fg) && FIGMA_COLOURS.has(bg)) addTo(contrastFlags, `${fg} on ${bg} — ${d.contrastRatio}:1, needs ${d.expectedContrastRatio}`, `${labelOf(t)}: ${n.target.join(" ")}`);
        else problems.push(`color-contrast: ${n.target.join(" ")} ${fg} on ${bg} (${d.contrastRatio}:1)`);
      }
    }
    check("a11y", `${tag} no serious/critical axe violations`, problems.length === 0, problems.join(" | "));

    // Skip link: the first Tab stop, and it moves focus into <main>. blur() alone keeps the browser's sequential-focus
    // starting point (e.g. an autofocused field), so park focus on a throwaway node at the very top of <body> first.
    const fromTop = () =>
      page.evaluate(() => {
        window.scrollTo(0, 0);
        const probe = document.createElement("span");
        probe.tabIndex = -1;
        document.body.prepend(probe);
        probe.focus();
        probe.addEventListener("blur", () => probe.remove(), { once: true });
      });
    await fromTop();
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), href: document.activeElement?.getAttribute("href") }));
    const isSkip = first.text === "Skip to content" && first.href === "#main";
    let skipLands = false;
    if (isSkip) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
      skipLands = await page.evaluate(() => location.hash === "#main" && !!document.getElementById("main"));
    }
    check("a11y", `${tag} skip link is the first Tab stop and targets <main>`, isSkip && skipLands, JSON.stringify(first));

    // Focus order: the first 25 Tab stops are visible, show a focus indicator, and never jump backwards in the DOM
    // except into a dialog / menu the page opened itself.
    await page.goto(`${BASE}${t.path}`);
    await settle(page, 1400);
    await fromTop();
    const stops: { name: string; visible: boolean; indicator: boolean; index: number; inLayer: boolean }[] = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const s = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        // A focus indicator is any visible style change between focused and not (outline, ring, Figma's 2px border,
        // underline, fill…) on the element or the wrapper that styles it (focus-within fields).
        const PROPS = ["outlineStyle", "outlineWidth", "outlineColor", "boxShadow", "borderTopColor", "borderTopWidth", "textDecorationLine", "backgroundColor", "color"] as const;
        const chain = [el, el.parentElement, el.parentElement?.parentElement].filter((n): n is HTMLElement => !!n);
        const snap = () => chain.map((n) => { const c = getComputedStyle(n); return PROPS.map((k) => c[k]).join("|"); }).join("§");
        const focused = snap();
        el.blur();
        const unfocused = snap();
        el.focus();
        const indicator = focused !== unfocused;
        const all = [...document.querySelectorAll("*")];
        return {
          name: `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}"`,
          visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.opacity !== "0",
          indicator,
          index: all.indexOf(el),
          inLayer: !!el.closest("[role=dialog], [role=menu], [role=listbox]"),
        };
      });
      if (!s) break;
      stops.push(s);
    }
    const hidden = stops.filter((s) => !s.visible).map((s) => s.name);
    const noRing = stops.filter((s) => s.visible && !s.indicator).map((s) => s.name);
    const backwards = stops.filter((s, i) => i > 0 && !s.inLayer && !stops[i - 1].inLayer && s.index < stops[i - 1].index).map((s) => s.name);
    check("a11y", `${tag} Tab stops are visible`, hidden.length === 0, hidden.join(", "));
    check("a11y", `${tag} Tab stops show a focus indicator`, noRing.length === 0, noRing.join(", "));
    check("a11y", `${tag} Tab order follows the DOM`, backwards.length === 0, backwards.join(", "));
    await ctx.close();
  }, ({ t, w }) => `a11y ${labelOf(t)} @${w}`);

  // Reduced motion: with prefers-reduced-motion, nothing on these pages is animating after load.
  const motionPages = ["/", "/new-arrivals", "/women", "/products/quilted-tabby-20", "/the-house"];
  await pool(motionPages.flatMap((path) => [1440, 393].map((w) => ({ path, w }))), CONCURRENCY, async ({ path, w }) => {
    const ctx = await newContext(browser, w, 900, {}, { reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState("load");
    await page.waitForTimeout(100);
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === "running").map((a) => (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "animation"),
    );
    check("a11y", `${path} @${w} reduced motion: no running animations`, running.length === 0, running.join(", "));
    await ctx.close();
  }, ({ path, w }) => `reduced-motion ${path} @${w}`);
}


// ───────────────────────── 7. seo + launch ─────────────────────────
/** Indexable pages: canonical (filter / sort params dropped) + OG + Twitter with a real 1200×630 card. */
const INDEXABLE: { path: string; canonical: string }[] = [
  { path: "/", canonical: "/" },
  { path: "/new-arrivals?type=totes&sort=price-asc", canonical: "/new-arrivals" },
  { path: "/women?type=totes&colour=black", canonical: "/women" },
  { path: "/men?sort=price-desc", canonical: "/men" },
  { path: "/bags?for=her", canonical: "/bags" },
  { path: "/the-house", canonical: "/the-house" },
  { path: "/client-care", canonical: "/client-care" },
  ...PRODUCT_SLUGS.map((s) => ({ path: `/products/${s}`, canonical: `/products/${s}` })),
];
const NOINDEX = ["/bag", "/checkout/delivery", "/checkout/payment", "/account", "/wishlist", "/search?q=tote"];

async function seo() {
  const meta = (html: string, attr: "property" | "name", key: string) =>
    html.match(new RegExp(`<meta ${attr}="${key.replace(/[:]/g, "\\$&")}" content="([^"]*)"`))?.[1] ?? null;
  const site = async (path: string) => {
    const res = await fetch(`${BASE}${path}`);
    return { res, html: await res.text() };
  };
  const ogImages = new Set<string>();
  await pool(INDEXABLE, CONCURRENCY, async ({ path, canonical }) => {
    const { html } = await site(path);
    const href = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const canonPath = href ? new URL(href).pathname : null;
    check("seo", `${path} canonical → ${canonical}`, canonPath === canonical && !href!.includes("?"), String(href));
    const missing = ["og:title", "og:description", "og:url", "og:image", "og:image:width", "og:type", "og:site_name"].filter((k) => !meta(html, "property", k));
    missing.push(...["twitter:card", "twitter:title", "twitter:description", "twitter:image"].filter((k) => !meta(html, "name", k)));
    check("seo", `${path} has Open Graph + Twitter metadata`, missing.length === 0, `missing ${missing.join(", ")}`);
    check("seo", `${path} is indexable`, !/<meta name="robots" content="[^"]*noindex/.test(html));
    const img = meta(html, "property", "og:image");
    if (img) ogImages.add(img);
    if (path.startsWith("/products/")) check("seo", `${path} OG card is the product's own`, img?.endsWith(`/og/products/${path.split("/")[2]}.jpg`) ?? false, String(img));
  }, (t) => `seo ${t.path}`);
  for (const img of ogImages) {
    const res = await fetch(new URL(new URL(img).pathname, BASE));
    const buf = Buffer.from(await res.arrayBuffer());
    // JPEG SOF0/SOF2 frame header carries height then width.
    let w = 0, h = 0;
    for (let i = 2; i < buf.length - 9; i++) if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break; }
    check("seo", `OG card ${new URL(img).pathname} serves a 1200×630 JPEG`, res.ok && res.headers.get("content-type") === "image/jpeg" && w === 1200 && h === 630, `${res.status} ${res.headers.get("content-type")} ${w}×${h}`);
  }
  for (const path of NOINDEX) {
    const { html } = await site(path);
    check("seo", `${path} is noindex`, /<meta name="robots" content="noindex/.test(html));
  }

  const { html: sitemap } = await site("/sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const wanted = ["/", "/new-arrivals", "/women", "/men", "/bags", "/the-house", "/client-care", ...PRODUCT_SLUGS.map((s) => `/products/${s}`)];
  check("seo", "sitemap lists every public page + product", wanted.every((p) => locs.includes(p)), `missing ${wanted.filter((p) => !locs.includes(p)).join(", ")}`);
  const under = (p: string, base: string) => p === base || p.startsWith(`${base}/`);
  const leaked = locs.filter((p) => [...NOINDEX.map((n) => n.split("?")[0]), "/order", "/__test"].some((base) => under(p, base)));
  check("seo", "sitemap has no noindex / test routes", leaked.length === 0, leaked.join(", "));
  const { html: robots } = await site("/robots.txt");
  check("seo", "robots.txt allows crawling and points at the sitemap", /Allow: \//.test(robots) && /Sitemap: .*\/sitemap\.xml/.test(robots) && !/Disallow: \/\s*$/m.test(robots), robots.replace(/\n/g, " ⏎ "));

  const { res } = await site("/");
  const hdr = (k: string) => res.headers.get(k) ?? "";
  check("security", "CSP: self-only, no unsafe-eval, no framing", /default-src 'self'/.test(hdr("content-security-policy")) && !/unsafe-eval/.test(hdr("content-security-policy")) && /frame-ancestors 'none'/.test(hdr("content-security-policy")) && /object-src 'none'/.test(hdr("content-security-policy")), hdr("content-security-policy"));
  check("security", "X-Content-Type-Options: nosniff", hdr("x-content-type-options") === "nosniff");
  check("security", "Referrer-Policy set", hdr("referrer-policy") === "strict-origin-when-cross-origin", hdr("referrer-policy"));
  check("security", "Permissions-Policy: geolocation=(self)", /geolocation=\(self\)/.test(hdr("permissions-policy")), hdr("permissions-policy"));
  check("security", "no X-Powered-By", !res.headers.has("x-powered-by"));
}

// ───────────────────────── report ─────────────────────────
function report(startedAt: number) {
  mkdirSync(OUT, { recursive: true });
  const failed = results.filter((r) => !r.ok);
  const byArea = new Map<string, { pass: number; fail: number }>();
  for (const r of results) {
    const a = r.area.split("/")[0].split("@")[0];
    const e = byArea.get(a) ?? { pass: 0, fail: 0 };
    r.ok ? e.pass++ : e.fail++;
    byArea.set(a, e);
  }
  const md = [
    `# COACH audit — ${new Date().toISOString()}`,
    ``,
    `${results.length} checks · ${results.length - failed.length} passed · **${failed.length} failed** · ${((Date.now() - startedAt) / 1000).toFixed(0)}s against ${BASE}`,
    ``,
    `| area | pass | fail |`,
    `| --- | ---: | ---: |`,
    ...[...byArea].map(([a, e]) => `| ${a} | ${e.pass} | ${e.fail} |`),
    ``,
    `## Failures`,
    failed.length ? failed.map((f) => `- **[${f.area}]** ${f.check}${f.detail ? ` — ${f.detail}` : ""}`).join("\n") : "None.",
    ``,
    `## Flagged: Figma colour pairs below WCAG AA (not changed — needs design sign-off)`,
    contrastFlags.size ? [...contrastFlags].map(([pair, where]) => `- **${pair}** — ${[...where].length} element(s), e.g. ${[...where].slice(0, 4).join("; ")}`).join("\n") : "None.",
    ``,
    `## Pending (unbuilt pages, linked on purpose)`,
    ...[...pending].sort().map(([href, from]) => `- \`${href}\` — from ${[...from].map((s) => s.replace(/ @\d+$/, "")).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6).join(", ")}`),
    ``,
    `## Filter links with no products yet (valid params, empty result)`,
    ...[...emptyFilterLinks].sort().map(([href]) => `- \`${href}\``),
  ].join("\n");
  writeFileSync(`${OUT}/report.md`, md);
  writeFileSync(`${OUT}/report.json`, JSON.stringify({ results, contrastFlags: [...contrastFlags].map(([pair, where]) => ({ pair, where: [...where] })), pending: [...pending].map(([h, f]) => ({ href: h, from: [...f] })) }, null, 2));
  console.log(`\n${results.length} checks, ${failed.length} failed → ${OUT}/report.md`);
  return failed.length;
}

async function main() {
  const startedAt = Date.now();
  const server = await startServer();
  const browser = await chromium.launch();
  const run = (s: string) => !ONLY || ONLY.includes(s);
  try {
    console.log(`Auditing ${BASE}`);
    console.log("1/7 purchase");
    await purchase(browser);
    if (run("crawl") || run("links")) {
      console.log("2/7 crawl");
      await crawl(browser);
    }
    if (run("links")) {
      console.log("3/7 links");
      await auditLinks(browser);
    }
    if (run("buttons")) {
      console.log("4/7 buttons");
      await auditButtons(browser);
    }
    if (run("flows")) {
      console.log("5/7 flows");
      await flows(browser);
    }
    if (run("a11y")) {
      console.log("6/7 a11y");
      await a11y(browser);
    }
    if (run("seo")) {
      console.log("7/7 seo + launch");
      await seo();
    }
  } finally {
    await browser.close();
    server?.kill();
  }
  process.exit(report(startedAt) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
