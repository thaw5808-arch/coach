import { chromium } from "playwright";
import { createHash } from "node:crypto";
const BASE = "http://localhost:3000", OUT = ".qa/address/after";
const email = "tim@studio.com";
const profile = { email, firstName: "Tim", lastName: "Archer", createdAt: "2026-01-01T00:00:00.000Z" };
const accounts = { [email]: { ...profile, passwordHash: createHash("sha256").update(`coach-demo:${email}:x`).digest("hex"), emailOptIn: true, defaultAddressId: "a1",
  addresses: [{ id: "a1", label: "Home", firstName: "Tim", lastName: "Archer", address1: "214 Mercer Street", city: "New York", state: "New York", zip: "10012", country: "United States" },
              { id: "a2", label: "Bangkok", firstName: "Tim", lastName: "Archer", address1: "991 Rama I Road", city: "Bangkok", state: "10", zip: "10330", country: "TH" }] } };
const BAG = { lines: [{ id: "l1", productId: "city-tote", colour: "Black", quantity: 1 }], savedForLater: [], promoCode: null, gift: null };
const local = (o) => ({ cookies: [], origins: [{ origin: BASE, localStorage: Object.entries(o).map(([name, v]) => ({ name, value: JSON.stringify(v) })) }] });
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: local({ "coach.session.v1": profile, "coach.accounts.v1": accounts, "coach.bag.v1": BAG }) });
  const p = await c.newPage();
  await p.goto(`${BASE}/account?tab=addresses`); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${w}-account-addresses.png`, fullPage: true });
  await p.click('main button[aria-label="Edit Bangkok"]'); await p.waitForTimeout(300);
  await p.selectOption("#acct-state", "14");
  await p.locator("#acct-city").scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/${w}-account-edit-thai.png`, fullPage: true });
  await c.close();
}
// Thai order end to end at 1440 → payment + order page
const c = await b.newContext({ viewport: { width: 1440, height: 1100 }, storageState: local({ "coach.bag.v1": BAG }) });
const p = await c.newPage();
await p.goto(`${BASE}/checkout/delivery`); await p.waitForTimeout(1500);
await p.fill("input[name=email]", "ploy@example.com"); await p.fill("input[name=firstName]", "Ploy"); await p.fill("input[name=lastName]", "Srisuk");
await p.selectOption("select[name=country]", "TH"); await p.fill("input[name=address1]", "991 Ra"); await p.locator("[role=option]").first().click();
await p.fill("input[name=phone]", "081 234 5678"); await p.click("button[type=submit]"); await p.waitForURL("**/checkout/payment"); await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/1440-payment-thai.png`, fullPage: true });
await p.getByRole("textbox", { name: "Card number" }).fill("4242 4242 4242 4242"); await p.getByRole("textbox", { name: "Name on card" }).fill("Ploy Srisuk");
await p.getByRole("textbox", { name: "Expiry (MM/YY)" }).fill("12/29"); await p.locator("#card-cvc").fill("123");
await p.click("button[type=submit]"); await p.waitForURL("**/order/**"); await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/1440-order-thai.png`, fullPage: true });
await b.close();
