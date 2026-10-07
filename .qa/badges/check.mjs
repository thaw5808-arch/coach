import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const IDS = ["city-tote", "charter-backpack", "petal-chain-bag", "hudson-messenger", "chapter-shoulder-bag", "signature-mini-bag"];
for (const path of ["/women", "/men", "/bags", "/new-arrivals", "/wishlist"]) for (const w of [1440, 1024, 393, 320]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 }, storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: "coach.wishlist.v1", value: JSON.stringify(IDS) }] }] } });
  const p = await c.newPage(); await p.goto(BASE + path); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => [...document.querySelectorAll("[data-badge]")].filter((e) => e.offsetParent).map((e) => {
    const b = e.getBoundingClientRect(); const heart = e.parentElement.querySelector('button[aria-label$="wishlist"]')?.getBoundingClientRect(); const well = e.parentElement.getBoundingClientRect();
    return { t: e.textContent, clip: e.scrollWidth > e.clientWidth + 0.5, overlap: heart ? b.right > heart.left && b.top < heart.bottom && b.bottom > heart.top : false, outside: b.right > well.right + 0.5, stacked: b.top - well.top > 40, cls: e.className.includes("tracking-[0.06em]") ? "tight" : e.className.includes("type-badge") ? "badge" : "eyebrow" };
  }));
  const bad = r.filter((x) => x.clip || x.overlap || x.outside);
  console.log(path.padEnd(14), w, `${r.length} badges`, bad.length ? "BAD " + JSON.stringify(bad) : "ok", [...new Set(r.map((x) => `${x.t}/${x.cls}${x.stacked ? "/stacked" : ""}`))].join(", "));
  if (path === "/wishlist" || path === "/women") await p.screenshot({ path: `.qa/badges/${path.slice(1)}-${w}.png`, fullPage: true });
  await c.close();
}
await b.close();
