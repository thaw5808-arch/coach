// node .qa/address/order.mjs <current|country-first>
import { chromium } from "playwright";
const BASE = "http://localhost:3000", tag = process.argv[2];
const BAG = { lines: [{ id: "l1", productId: "city-tote", colour: "Black", quantity: 1 }], savedForLater: [], promoCode: null, gift: null };
const b = await chromium.launch();
for (const [w, h] of [[1440, 1000], [393, 852]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: "coach.bag.v1", value: JSON.stringify(BAG) }] }] } });
  const p = await c.newPage();
  await p.goto(`${BASE}/checkout/delivery`); await p.waitForTimeout(1800);
  await p.fill("input[name=firstName]", "Ploy"); await p.fill("input[name=lastName]", "Srisuk");
  await p.selectOption("select[name=country]", "TH");
  await p.fill("input[name=address1]", "991 Rama I Road"); await p.keyboard.press("Escape");
  await p.fill("input[name=city]", "Bangkok"); await p.selectOption("select[name=state]", "10");
  await p.fill("input[name=zip]", "10330"); await p.fill("input[name=phone]", "081 234 5678");
  const sec = p.locator("h1, p", { hasText: "Delivery Address" }).first();
  await sec.evaluate((el) => el.scrollIntoView({ block: "start" })); await p.evaluate(() => window.scrollBy(0, -24));
  await p.screenshot({ path: `.qa/address/${tag}/${w}-delivery.png`, fullPage: false });
  await c.close();
}
await b.close();
