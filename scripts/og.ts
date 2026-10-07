/**
 * Static Open Graph / Twitter cards — `npm run og`. Writes public/og/<page>.jpg for every entry in lib/seo.ts OG_PAGES
 * and public/og/products/<slug>.jpg for every product (its first colour's cut-out). 1200×630 JPEG, committed, so pages
 * stay static and nothing renders images at request time. Re-run after changing OG_PAGES or product imagery.
 *
 * Rendered with next/og (Satori) using the self-hosted Bona Nova fonts; cut-outs are trimmed of transparent margins
 * with sharp first so every bag sits at a consistent scale.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og.js";
import sharp from "sharp";
import { products } from "../lib/products.ts";
import { OG_PAGES, OG_SIZE } from "../lib/seo.ts";

const font = (file: string) => readFileSync(new URL(`../node_modules/@fontsource/${file}`, import.meta.url));
const FONTS = [
  { name: "Bona Nova SC", data: font("bona-nova-sc/files/bona-nova-sc-latin-400-normal.woff"), weight: 400 as const, style: "normal" as const },
  { name: "Bona Nova SC", data: font("bona-nova-sc/files/bona-nova-sc-latin-700-normal.woff"), weight: 700 as const, style: "normal" as const },
  { name: "Bona Nova", data: font("bona-nova/files/bona-nova-latin-400-italic.woff"), weight: 400 as const, style: "italic" as const },
];
const C = { bg: "#f0f9ff", blob: "#e5f5ff", ink: "#000000", accent: "#4147d5" };

/** Trimmed cut-out as a data URI + its aspect ratio. */
async function cutout(src: string) {
  const { data, info } = await sharp(new URL(`../public${src}`, import.meta.url).pathname).trim().png().toBuffer({ resolveWithObject: true });
  return { uri: `data:image/png;base64,${data.toString("base64")}`, ratio: info.width / info.height };
}

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): El => ({ type, props: { style, children, ...extra } });

/** One to three bags on a blob, Home-style tilts (-9° / 0° / 20°). */
async function stage(images: readonly string[]) {
  const cuts = await Promise.all(images.map(cutout));
  const slots =
    cuts.length === 1
      ? [{ left: 150, top: 80, box: 420, rotate: 0 }]
      : [
          { left: 20, top: 210, box: 260, rotate: -9 },
          { left: 175, top: 60, box: 300, rotate: 0 },
          { left: 380, top: 220, box: 260, rotate: 20 },
        ];
  return h("div", { display: "flex", position: "relative", width: 660, height: 630 }, [
    h("div", { position: "absolute", left: 60, top: 70, width: 560, height: 500, borderRadius: "50%", background: C.blob }),
    ...cuts.map((c, i) => {
      const s = slots[i];
      const w = c.ratio >= 1 ? s.box : s.box * c.ratio;
      const hgt = c.ratio >= 1 ? s.box / c.ratio : s.box;
      return h(
        "div",
        { position: "absolute", left: s.left, top: s.top, width: s.box, height: s.box, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${s.rotate}deg)` },
        h("img", { width: w, height: hgt }, undefined, { src: c.uri, width: w, height: hgt }),
      );
    }),
  ]);
}

async function card(eyebrow: string, title: string, images: readonly string[]) {
  const tree = h("div", { display: "flex", width: "100%", height: "100%", background: C.bg }, [
    h("div", { display: "flex", flexDirection: "column", justifyContent: "space-between", width: 540, padding: "64px 0 64px 72px" }, [
      h("div", { fontFamily: "Bona Nova SC", fontSize: 44, color: C.ink }, "COACH"),
      h("div", { display: "flex", flexDirection: "column", gap: 20 }, [
        h("div", { fontFamily: "Bona Nova SC", fontWeight: 700, fontSize: 18, letterSpacing: "0.14em", color: C.accent }, eyebrow),
        h("div", { fontFamily: "Bona Nova SC", fontWeight: 700, fontSize: title.length > 24 ? 54 : 64, lineHeight: 1.1, color: C.ink }, title),
      ]),
      h("div", { fontFamily: "Bona Nova", fontStyle: "italic", fontSize: 24, color: C.accent }, "A concept study — not affiliated with Coach."),
    ]),
    await stage(images),
  ]);
  // Satori takes React-element-shaped objects; next/og's types want a ReactElement.
  const res = new ImageResponse(tree as unknown as React.ReactElement, { ...OG_SIZE, fonts: FONTS });
  return sharp(Buffer.from(await res.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

const out = new URL("../public/og/", import.meta.url).pathname;
mkdirSync(`${out}products`, { recursive: true });
for (const [key, p] of Object.entries(OG_PAGES)) {
  writeFileSync(`${out}${key}.jpg`, await card(p.eyebrow, p.title, p.images));
  console.log(`og/${key}.jpg`);
}
for (const product of products) {
  const label = product.category === "men" ? "MEN" : product.category === "women" ? "WOMEN" : "BAGS";
  writeFileSync(`${out}products/${product.slug}.jpg`, await card(label, product.name, [product.colours[0].image.src]));
  console.log(`og/products/${product.slug}.jpg`);
}
