import { chromium } from "playwright";
const BASE = "http://localhost:3000", OUT = ".qa/search";
const RECENT = ["Quilted tabby", "Signature canvas tote", "Men’s backpack"];
const st = { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: "coach.search.recent.v1", value: JSON.stringify(RECENT) }] }] };
const b = await chromium.launch();
const errs = [];
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: st });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(`${w} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errs.push(`${w} console ${m.text()}`));
  await p.goto(`${BASE}/search?q=Signature%20canvas`); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${w}-results.png`, fullPage: true });
  await p.goto(`${BASE}/search?q=hobo`); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${w}-no-results.png`, fullPage: true });
  await p.goto(`${BASE}/search`); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${w}-empty-q.png`, fullPage: true });
  // overlay
  await p.goto(`${BASE}/women`); await p.waitForTimeout(1200);
  await p.locator('header button[aria-label="Search"]').filter({ visible: true }).click(); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/${w}-overlay-open.png` });
  for (const q of ["tab", "black", "zzz"]) {
    await p.locator('[role=dialog] input[role=combobox]').fill(q); await p.waitForTimeout(400);
    if (q === "tab") { await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(100); }
    await p.screenshot({ path: `${OUT}/${w}-overlay-${q}.png` });
  }
  await c.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "no page errors");
