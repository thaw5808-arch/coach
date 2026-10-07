import { chromium } from "playwright";
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("http://localhost:3000/checkout/delivery"); await p.waitForTimeout(1500);
const names = JSON.parse(process.argv[2]);
const res = await p.evaluate((names) => {
  const s = document.createElement("span"); s.className = "type-body"; s.style.position = "absolute"; s.style.whiteSpace = "nowrap"; document.body.append(s);
  return names.map((n) => { s.textContent = n; return [n, Math.ceil(s.getBoundingClientRect().width)]; }).sort((a, b) => b[1] - a[1]).slice(0, 12);
}, names);
console.log(res); await b.close();
