import { chromium } from "playwright";
const BASE = "http://localhost:3000", OUT = ".qa/errors";
const b = await chromium.launch();
const BAG = { lines: [{ id: "l1", productId: "city-tote", colour: "Brown", quantity: 1 }], savedForLater: [], promoCode: null, gift: null };
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: "coach.bag.v1", value: JSON.stringify(BAG) }] }] } });
  const p = await c.newPage();
  for (const [name, path] of [["404", "/this-page-does-not-exist"], ["404-product", "/products/nope"], ["order-not-found", "/order/CO-ZZZZZZ"]]) {
    await p.goto(BASE + path); await p.waitForTimeout(1400);
    await p.screenshot({ path: `${OUT}/${w}-${name}.png`, fullPage: true });
  }
  await p.goto(BASE + "/__test/error"); await p.waitForTimeout(1800);
  await p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove()));
  await p.screenshot({ path: `${OUT}/${w}-500.png`, fullPage: true });
  if (w === 1440) {
    await p.locator('button:has-text("Try again")').click(); await p.waitForTimeout(1200);
    await p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove()));
    await p.screenshot({ path: `${OUT}/${w}-500-recovered.png` });
  }
  await p.goto(BASE + "/bag"); await p.waitForTimeout(1500);
  await c.setOffline(true); await p.evaluate(() => window.dispatchEvent(new Event("offline"))); await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${w}-offline.png` });
  await c.setOffline(false); await p.waitForTimeout(800);
  await c.close();
}
const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
await p.goto(BASE + "/__test/global-error"); await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove())); await p.waitForTimeout(200);
await p.screenshot({ path: `${OUT}/1440-global-error.png`, fullPage: true });
await b.close();
