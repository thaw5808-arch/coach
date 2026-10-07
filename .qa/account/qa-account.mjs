import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = ".qa/account";
const b = await chromium.launch();
async function ctx(w, h = 900) { const c = await b.newContext({ viewport: { width: w, height: h } }); return [c, await c.newPage()]; }
const log = (...a) => console.log(...a);
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const [c, p] = await ctx(w, h);
  p.on("pageerror", (e) => log("PAGEERROR", w, e.message));
  await p.goto(`${BASE}/account`); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${w}-signed-out.png`, fullPage: true });
  // error state
  await p.fill("#signin-email", "tim@studio.com"); await p.fill("#signin-password", "wrongpass1");
  await p.click('button[type=submit]:has-text("Sign in")'); await p.waitForTimeout(1200);
  await p.locator("#signin-title").scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/${w}-signin-error.png`, fullPage: true });
  // create account
  await p.click('button:has-text("Create account")'); await p.waitForTimeout(300);
  await p.click('form#create-account-form button[type=submit]'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/${w}-create-errors.png`, fullPage: true });
  await p.fill("#create-firstName", "Tim"); await p.fill("#create-lastName", "Archer");
  await p.fill("#create-email", `tim${w}@studio.com`); await p.fill("#create-password", "atelier2026");
  await p.click('form#create-account-form button[type=submit]'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${w}-signed-in-empty.png`, fullPage: true });
  for (const t of ["orders", "addresses", "details"]) {
    await p.goto(`${BASE}/account?tab=${t}`); await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/${w}-tab-${t}.png`, fullPage: true });
  }
  await p.goto(`${BASE}/account?tab=addresses`); await p.waitForTimeout(900);
  await p.click('button:has-text("Add an address")'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${w}-address-form.png`, fullPage: true });
  // sign out + forgot
  await p.goto(`${BASE}/account`); await p.waitForTimeout(800);
  await p.click('nav[aria-label=Account] button:has-text("Sign out")'); await p.waitForTimeout(500);
  await p.fill("#signin-email", "nobody@nowhere.com"); await p.click('button:has-text("Forgot password?")'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${w}-forgot-sent.png`, fullPage: true });
  log(w, "scrollWidth", await p.evaluate(() => document.documentElement.scrollWidth));
  await c.close();
}
await b.close();
