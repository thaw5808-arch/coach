// Launch-prep visual evidence: the three approved visual changes (Home note, PDP dots, 404 placeholder at 320).
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3200", OUT = ".qa/launch/visual";
const b = await chromium.launch();
for (const [w, h] of [[1440, 1024], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, ...(w < 1024 ? { isMobile: true, hasTouch: true } : {}) });
  const p = await c.newPage();
  await p.goto(BASE + "/"); await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/${w}-home.png`, fullPage: true });
  await p.goto(BASE + "/this-page-does-not-exist"); await p.waitForTimeout(800);
  const field = p.locator("[data-not-found] form[role=search]");
  await field.scrollIntoViewIfNeeded();
  await field.screenshot({ path: `${OUT}/${w}-404-search-field.png` });
  if (w < 1024) {
    await p.goto(BASE + "/products/quilted-tabby-20"); await p.waitForTimeout(1200);
    await p.locator("main .snap-x").first().locator("xpath=..").screenshot({ path: `${OUT}/${w}-pdp-gallery-dots.png` });
    const sizes = await p.locator('main button[aria-label^="Go to"]').evaluateAll((bs) => bs.map((x) => { const r = x.getBoundingClientRect(); return `${r.width}×${r.height}`; }));
    console.log(w, "dot targets", sizes.join(", "));
  }
  await c.close();
}
await b.close();
