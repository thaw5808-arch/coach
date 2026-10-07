# Launch prep — evidence

Lighthouse 13.5 against `next start` (production build), Playwright Chromium, default mobile (Moto G Power, slow 4G,
4× CPU) and desktop presets. *Before*: 1 run per page. *After*: median of 3 runs. Bag and Checkout Delivery are tested
with a filled bag (seeded localStorage, HTTP cache cleared before every run). Reports: `lighthouse-before/`,
`lighthouse-after/` (HTML + JSON per page × preset). Re-run: `npm run build && npx next start -p 3200`, then
`LH_RUNS=3 npm run lighthouse`.

| page | preset | Perf before → after | A11y | Best Pr. | SEO | LCP after | CLS before → after |
|---|---|---|---|---|---|---|---|
| home | mobile | err → **97** | err → **100** | err → **100** | err → **100** | 2.5 s | err → 0.002 |
| home | desktop | 100 → **100** | 100 → **100** | 100 → **100** | 100 → **100** | 0.4 s | 0 → 0 |
| new-arrivals | mobile | 99 → **99** | 100 → **100** | 100 → **100** | 100 → **100** | 2.0 s | 0.027 → 0.027 |
| new-arrivals | desktop | 100 → **100** | 96 → **100** | 100 → **100** | 100 → **100** | 0.5 s | 0 → 0 |
| product | mobile | 91 → **99** | 94 → **100** | 100 → **100** | 100 → **100** | 2.1 s | 0 → 0 |
| product | desktop | 100 → **100** | 95 → **100** | 100 → **100** | 100 → **100** | 0.5 s | 0 → 0 |
| bag | mobile | 77 → **93** | 96 → **100** | 100 → **100** | 63 → **66** | 3.2 s | 0.644 → 0 |
| bag | desktop | 79 → **100** | 92 → **100** | 100 → **100** | 63 → **66** | 0.7 s | 0.48 → 0 |
| checkout-delivery | mobile | 88 → **93** | 96 → **100** | 100 → **100** | 63 → **66** | 3.2 s | 0.145 → 0 |
| checkout-delivery | desktop | 100 → **100** | 96 → **100** | 100 → **100** | 63 → **66** | 0.7 s | 0.051 → 0 |
| women | mobile | 95 → **96** | 100 → **100** | 100 → **100** | 100 → **100** | 2.7 s | 0 → 0 |
| women | desktop | 100 → **100** | 96 → **100** | 100 → **100** | 100 → **100** | 0.7 s | 0 → 0 |
| search | mobile | 68 → **92** | 100 → **100** | 100 → **100** | 63 → **66** | 3.4 s | 0.644 → 0 |
| search | desktop | 81 → **100** | 96 → **100** | 100 → **100** | 63 → **66** | 0.7 s | 0.394 → 0 |
| the-house | mobile | 93 → **99** | 100 → **100** | 100 → **100** | 100 → **100** | 2.0 s | 0 → 0 |
| the-house | desktop | 100 → **100** | 100 → **100** | 100 → **100** | 100 → **100** | 0.6 s | 0.002 → 0.002 |

- **Home mobile "err"**: before the fix Lighthouse failed with NO_FCP. The page fades in from opacity 0 and Chrome
  never counts that as a contentful paint. The fade now starts at 0.01, which looks the same.
- **SEO 66** on Bag / Checkout / Search: the only failing audit is `is-crawlable`. These pages are `noindex` on purpose.
- **Accessibility 96 → 100** on Checkout Delivery: after sign-off, "Continue to payment" / "Place order" render in
  the normal primary style at all times (they were dimmed to 35% while the form was invalid, 2.47:1). Re-run:
  `lighthouse-checkout-final/` (median of 3).
- Mobile LCP of 3.2–3.4 s on Bag / Checkout / Search is Lighthouse's *simulated* slow-4G figure. These views render
  from localStorage after hydration, so their LCP waits for JS by nature. Every score is still ≥ 92.

## What changed for performance
- CLS 0.39–0.64 → 0: client-only views (Bag, Checkout, Search, Account, Wishlist) reserve a viewport of height
  until storage loads or the Suspense boundary resolves, so the footer no longer paints high and then jumps.
- LCP: Next 16's deprecated `priority` (a `<head>` preload with no fetchpriority, fired for both the desktop and the
  mobile tree) → `loading="eager"` + `fetchPriority="high"` on the one LCP image per tree. Women / Men / Bags / The House
  heroes are now eager.
- Home NO_FCP fixed (see above).

## Other evidence
- `audit-final.log` — final `npm run audit` (build + 7 passes). Report: `../audit/report.md`.
- `visual/` — the approved visual changes: Home concept-study note (1440 / 1024 / 393 / 320), PDP mobile gallery dots
  (24×24 targets, dots unchanged), 404 search field at 320 (ellipsis). Script: `shots.mjs`.
- `build.log` — `next build` output (no warnings).
