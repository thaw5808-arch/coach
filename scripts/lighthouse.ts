/**
 * Lighthouse (mobile + desktop) for the launch pages — `npm run lighthouse` (against a running production server).
 *
 *   LH_BASE_URL   server to test (default http://localhost:3200 — start it with `next start -p 3200`)
 *   LH_OUT        output folder (default .qa/launch/lighthouse) — one JSON summary + an HTML report per run
 *   LH_RUNS       runs per page × preset; the median Performance run is kept (default 1)
 *   LH_ONLY       comma-separated page labels to run (e.g. LH_ONLY=home,bag)
 *
 * Chrome is Playwright's Chromium with a remote-debugging port: Playwright seeds localStorage (a filled bag, so Bag and
 * Checkout Delivery render their real state rather than redirect), Lighthouse drives the same browser. Storage reset is
 * disabled to keep that seed, so the HTTP cache is cleared over CDP before every run instead (cold loads).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const BASE = process.env.LH_BASE_URL ?? "http://localhost:3200";
const OUT = process.env.LH_OUT ?? ".qa/launch/lighthouse";
const RUNS = Number(process.env.LH_RUNS ?? 1);
const ONLY = process.env.LH_ONLY?.split(",");
const PORT = 9333;

const BAG = {
  lines: [
    { productId: "quilted-tabby-20", colour: "Chalk", quantity: 1 },
    { productId: "charter-backpack", colour: "Black", quantity: 1 },
  ],
  savedForLater: [],
  promoCode: null,
  gift: { wrapped: false, note: "" },
};

const PAGES: { label: string; path: string; seed?: Record<string, unknown> }[] = [
  { label: "home", path: "/" },
  { label: "new-arrivals", path: "/new-arrivals" },
  { label: "product", path: "/products/quilted-tabby-20" },
  { label: "bag", path: "/bag", seed: { "coach.bag.v1": BAG } },
  { label: "checkout-delivery", path: "/checkout/delivery", seed: { "coach.bag.v1": BAG } },
  { label: "women", path: "/women" },
  { label: "search", path: "/search?q=tote" },
  { label: "the-house", path: "/the-house" },
];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"] as const;
type Scores = Record<(typeof CATEGORIES)[number], number>;

const ctx = await chromium.launchPersistentContext("", { headless: true, args: [`--remote-debugging-port=${PORT}`] });
const seedPage = ctx.pages()[0] ?? (await ctx.newPage());
const cdp = await ctx.newCDPSession(seedPage);
mkdirSync(OUT, { recursive: true });

const summary: { page: string; preset: string; scores: Scores; metrics: Record<string, string>; failing: string[] }[] = [];
for (const p of PAGES.filter((p) => !ONLY || ONLY.includes(p.label))) {
  for (const preset of ["mobile", "desktop"] as const) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      await seedPage.goto(`${BASE}/robots.txt`).catch(() => seedPage.goto(BASE));
      await seedPage.evaluate((seed) => {
        localStorage.clear();
        sessionStorage.clear();
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v));
      }, p.seed ?? {});
      await cdp.send("Network.clearBrowserCache");
      const result = await lighthouse(
        `${BASE}${p.path}`,
        { port: PORT, output: "html", logLevel: "error", disableStorageReset: true, onlyCategories: [...CATEGORIES] },
        preset === "desktop" ? desktopConfig : undefined,
      );
      if (result) runs.push(result);
    }
    runs.sort((a, b) => (a.lhr.categories.performance.score ?? 0) - (b.lhr.categories.performance.score ?? 0));
    const { lhr, report } = runs[Math.floor(runs.length / 2)];
    const scores = Object.fromEntries(CATEGORIES.map((c) => [c, Math.round((lhr.categories[c].score ?? 0) * 100)])) as Scores;
    const metrics = Object.fromEntries(
      ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"].map((id) => [id, lhr.audits[id].displayValue ?? ""]),
    );
    // Every scored audit below 0.9 in any category — what to fix next.
    const failing = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "manual" && a.scoreDisplayMode !== "notApplicable")
      .map((a) => `${a.id} (${a.score}${a.displayValue ? `, ${a.displayValue}` : ""})`);
    summary.push({ page: p.label, preset, scores, metrics, failing });
    writeFileSync(`${OUT}/${p.label}-${preset}.html`, report as string);
    writeFileSync(`${OUT}/${p.label}-${preset}.json`, JSON.stringify(lhr));
    console.log(`${p.label.padEnd(18)} ${preset.padEnd(7)} ${CATEGORIES.map((c) => `${c.slice(0, 4)} ${scores[c]}`).join("  ")}  LCP ${metrics["largest-contentful-paint"]}  CLS ${metrics["cumulative-layout-shift"]}`);
  }
}
await ctx.close();
writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2));
