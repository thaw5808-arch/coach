import { chromium } from "playwright";
import { createHash } from "node:crypto";
const BASE = process.env.BASE ?? "http://localhost:3000", OUT = ".qa/wishlist";
const email = "tim@studio.com";
const profile = { email, firstName: "Tim", lastName: "Archer", createdAt: "2026-01-01T00:00:00.000Z" };
const accounts = { [email]: { ...profile, passwordHash: createHash("sha256").update(`coach-demo:${email}:x`).digest("hex"), emailOptIn: true, addresses: [], defaultAddressId: null } };
const IDS = ["city-tote", "charter-backpack", "petal-chain-bag", "hudson-messenger"];
const st = (o) => ({ cookies: [], origins: [{ origin: BASE, localStorage: Object.entries(o).map(([name, v]) => ({ name, value: JSON.stringify(v) })) }] });
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const shoot = async (name, local, fn) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, storageState: st(local) });
    const p = await c.newPage();
    p.on("pageerror", (e) => console.log("PAGEERROR", w, name, e.message));
    p.on("console", (m) => m.type() === "error" && console.log("CONSOLE", w, name, m.text()));
    await p.goto(`${BASE}/wishlist`); await p.waitForTimeout(1500);
    if (fn) await fn(p);
    await p.screenshot({ path: `${OUT}/${w}-${name}.png`, fullPage: !fn });
    await c.close();
  };
  await shoot("signed-in", { "coach.wishlist.v1": IDS, "coach.session.v1": profile, "coach.accounts.v1": accounts });
  await shoot("signed-out", { "coach.wishlist.v1": IDS });
  await shoot("empty", {});
  await shoot("removed-toast", { "coach.wishlist.v1": IDS }, async (p) => {
    await p.locator('[data-wishlist-item="hudson-messenger"] button[aria-label="Remove from wishlist"]').filter({ visible: true }).first().click();
    await p.waitForTimeout(400);
  });
  await shoot("moved", { "coach.wishlist.v1": IDS }, async (p) => {
    const btn = p.locator('[data-wishlist-item="city-tote"] button', { hasText: "Move to bag" });
    await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(300);
  });
}
await b.close();
