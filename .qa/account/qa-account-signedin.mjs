import { chromium } from "playwright";
import { createHash } from "node:crypto";
const BASE = "http://localhost:3000", OUT = ".qa/account";
const email = "tim@studio.com";
const profile = { email, firstName: "Tim", lastName: "Archer", createdAt: "2026-01-01T00:00:00.000Z" };
const addr = { id: "a1", label: "Home", firstName: "Tim", lastName: "Archer", address1: "214 Mercer Street", city: "New York", state: "New York", zip: "10012", country: "United States" };
const accounts = { [email]: { ...profile, passwordHash: createHash("sha256").update(`coach-demo:${email}:atelier2026`).digest("hex"), emailOptIn: true, addresses: [addr], defaultAddressId: "a1" } };
const line = (productId, name, price, initials) => ({ productId, name, colour: "", quantity: 1, unitPrice: price, initials });
const order = (id, hoursAgo, lines, status = "placed") => ({ id, createdAt: new Date(Date.now() - hoursAgo * 3600e3).toISOString(), status, lines, subtotal: 900, discount: 0, deliveryPrice: 0, tax: 0, giftCardAmount: 0, total: lines.reduce((s, l) => s + l.unitPrice, 0), firstName: "Tim", lastName: "Archer", contactEmail: email, contactPhone: "", deliveryMethod: "standard", shippingAddress: null, storeId: null, payment: { brand: "Visa", last4: "4242" } });
const orders = [order("CO-OLD111", 24 * 20, [line("city-tote", "City Tote", 450)], "cancelled"), order("CO-260418", 3, [line("quilted-tabby-20", "Quilted Tabby 20", 495, "TA"), line("city-tote", "City Tote", 450)])];
const local = { "coach.session.v1": profile, "coach.accounts.v1": accounts, "coach.orders.v1": orders, "coach.wishlist.v1": ["city-tote", "charter-backpack", "petal-chain-bag", "hudson-messenger"] };
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: { cookies: [], origins: [{ origin: BASE, localStorage: Object.entries(local).map(([name, v]) => ({ name, value: JSON.stringify(v) })) }] } });
  const p = await c.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  for (const t of ["", "?tab=orders"]) {
    await p.goto(`${BASE}/account${t}`); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/${w}-signed-in${t ? "-orders" : ""}.png`, fullPage: true });
  }
  await c.close();
}
await b.close();
