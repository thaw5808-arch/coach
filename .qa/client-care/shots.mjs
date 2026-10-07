import { chromium } from "playwright";
const BASE = "http://localhost:3000", OUT = ".qa/client-care";
const b = await chromium.launch(); const errs = [];
for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [320, 700]]) {
  const c = await b.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(`${w} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errs.push(`${w} console ${m.text()}`));
  await p.goto(`${BASE}/client-care`); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${w}-page.png`, fullPage: true });
  for (const hash of ["shipping", "leather-care", "personalisation"]) {
    await p.goto(`${BASE}/client-care#${hash}`); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${OUT}/${w}-${hash}.png` });
  }
  await p.goto(`${BASE}/client-care#contact`); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${w}-contact.png` });
  await p.locator('form[aria-labelledby="contact-title"] button[type=submit]').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${w}-contact-errors.png` });
  await p.selectOption("#contact-topic", "order");
  await p.fill("#contact-orderNumber", "CO-7K2M9Q"); await p.fill("#contact-name", "Tim Archer"); await p.fill("#contact-email", "tim@studio.com");
  await p.fill("#contact-message", "Could the initials on my Tabby be silver instead of gold?");
  await p.locator('form[aria-labelledby="contact-title"] button[type=submit]').click(); await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/${w}-contact-sent.png` });
  await c.close();
}
await b.close(); console.log(errs.length ? errs.join("\n") : "no page errors");
