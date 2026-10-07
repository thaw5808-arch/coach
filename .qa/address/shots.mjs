// Usage: node .qa/address/shots.mjs <before|after>
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = `.qa/address/${process.argv[2] ?? "after"}`;
const BAG = { lines: [{ id: "l1", productId: "city-tote", colour: "Black", quantity: 1 }], savedForLater: [], promoCode: null, gift: null };
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: "coach.bag.v1", value: JSON.stringify(BAG) }] }] } });
  const p = await c.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", w, e.message));
  await p.goto(`${BASE}/checkout/delivery`); await p.waitForTimeout(1800);
  const row = p.locator("select[name=country]").first();
  await p.locator("input[name=city]").first().scrollIntoViewIfNeeded();
  await p.locator("input[name=address1]").first().evaluate((el) => el.closest("div.flex.w-full.flex-col")?.scrollIntoView({ block: "start" }));
  await p.evaluate(() => window.scrollBy(0, -120));
  await p.screenshot({ path: `${OUT}/${w}-delivery-us.png` });
  await row.selectOption({ index: 1 }).catch(() => {});
  const opts = await row.locator("option").allTextContents();
  const th = opts.find((o) => /thailand/i.test(o));
  if (th) await row.selectOption({ label: th });
  await p.waitForTimeout(300);
  await p.locator("input[name=address1]").first().evaluate((el) => el.closest("div.flex.w-full.flex-col")?.scrollIntoView({ block: "start" }));
  await p.evaluate(() => window.scrollBy(0, -120));
  await p.screenshot({ path: `${OUT}/${w}-delivery-thailand.png` });
  const states = await p.locator("select[name=state] option").allTextContents().catch(() => []);
  console.log(w, "after Thailand → region options:", states.slice(0, 4).join(" | "), `(${states.length})`);
  await c.close();
}
await b.close();
