export type ProductImage = {
  src: string;
  /** Percentage-based crop (exact Figma "Product Image" treatment) — omitted means object-contain. */
  crop?: { left: string; top: string; width: string; height: string };
};

export type GalleryShot = { image: ProductImage; caption: string };

export type ProductColour = {
  name: string;
  hex: string;
  available: boolean;
  image: ProductImage;
  /** PDP gallery shots; defaults to a single "FRONT" shot of `image` when omitted. */
  gallery?: GalleryShot[];
};

export type CraftFeature = { n: string; title: string; body: string };

export type CategorySlug = "women" | "men" | "bags";

export type ProductStyle =
  | "shoulder-bags"
  | "crossbody"
  | "mini-bags"
  | "chain-straps"
  | "totes"
  | "top-handle"
  | "wallets"
  | "card-cases"
  | "wristlets"
  | "bag-charms"
  | "backpacks"
  | "briefcases"
  | "messengers"
  | "duffles"
  | "belts"
  | "key-fobs";

/** What kind of piece this is — the Bags page lists every `"bag"` across Women and Men (Figma 10 — Bags). */
export type ProductType = "bag" | "small-leather";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: "USD";
  type: ProductType;
  /** Primary category — drives the PDP breadcrumb and "related" rails. */
  category: CategorySlug;
  /** Other category pages that also list this piece (e.g. the Cargo Tote appears on Women 71:2). */
  alsoIn?: CategorySlug[];
  tags: string[];
  /** Bag-style filter facets shown as chips on New Arrival / category pages. */
  styles: ProductStyle[];
  /** Primary material — filter facet in the States & Overlays "Filters" drawer (20:313). */
  material: string;
  /** Card subtitle after the colour ("Natural · Heavy Canvas"); defaults to `material`. Compact = mobile card copy. */
  cardDetail?: { full: string; compact?: string };
  badge?: { full: string; compact: string };
  colours: ProductColour[];
  /** PDP eyebrow, e.g. "WOMEN — THE TABBY" (Product Detail 29:2, node 29:69). */
  eyebrow: string;
  /** PDP italic one-liner under the title. */
  tagline: string;
  description: string;
  details: string[];
  care: string;
  personalise: boolean;
  /** "The Craft" annotated panel (Product Detail 29:2, node 29:151) — only a few products have one. */
  craft?: { title: string; body: string; features: CraftFeature[] };
  availability: "in-stock" | "low-stock" | "sold-out";
};

const tabbyGallery: GalleryShot[] = [
  { image: { src: "/images/products/tabby-quilted.png" }, caption: "01 — FRONT" },
  {
    image: { src: "/images/products/tabby-quilted.png", crop: { left: "-133.33%", top: "-85.71%", width: "238.1%", height: "238.1%" } },
    caption: "02 — CHAIN DETAIL",
  },
  {
    image: { src: "/images/products/tabby-quilted.png", crop: { left: "-75%", top: "-83.33%", width: "277.78%", height: "277.78%" } },
    caption: "03 — HARDWARE",
  },
];

const tabbyCraft = {
  title: "Made to Grow Richer",
  body: "Each Tabby passes through more than forty pairs of hands — from cutting the quilted panels to the final polish of its C-hardware.",
  features: [
    { n: "01", title: "Quilted Nappa", body: "Glove-soft nappa, channel-quilted and padded by hand so the shape holds for years." },
    { n: "02", title: "Signature C-Hardware", body: "Our archival C turnlock, cast in solid brass and polished to a warm gold-tone." },
    { n: "03", title: "Detachable Chain", body: "A gold-tone chain for the shoulder, plus a short strap to carry it by hand." },
  ],
};

/** Figma "P / Desktop / New Arrival" (103:88/103:1328) + "Product Detail" (29:2/32:172). */
export const products: Product[] = [
  {
    id: "chapter-shoulder-bag",
    slug: "chapter-shoulder-bag",
    name: "Chapter Shoulder Bag",
    price: 295,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: ["new-arrival"],
    styles: ["shoulder-bags", "chain-straps"],
    material: "Pebble Leather",
    eyebrow: "WOMEN — NEW ARRIVAL",
    tagline: "In black pebble leather with a polished gold-tone chain.",
    colours: [
      // Swatches per Figma New Arrival 103:130 / Women 71:197 (same three in both files).
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/home/bag-black.png" } },
      { name: "Blush", hex: "#f2b8c6", available: true, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
      { name: "Chalk", hex: "#e9d8c4", available: false, image: { src: "/images/home/bag-black.png" } },
    ],
    description:
      "Glove-tanned pebble leather, finished by hand and carried on a polished gold-tone chain — cut for every chapter of the day.",
    details: ["Pebble leather", "Gold-tone hardware", "Interior zip and slip pockets", "11\" W x 7\" H x 3\" D"],
    care: "Wipe gently with a soft, dry cloth. Store in the dust bag provided, away from direct sunlight and moisture.",
    personalise: true,
    availability: "in-stock",
  },
  {
    id: "chapter-signature-bag",
    slug: "chapter-signature-bag",
    name: "Chapter Signature Bag",
    price: 275,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: ["new-arrival", "limited-edition"],
    styles: ["shoulder-bags", "chain-straps"],
    material: "Signature Canvas",
    badge: { full: "Limited Edition", compact: "Limited" },
    eyebrow: "WOMEN — LIMITED EDITION",
    tagline: "A limited blush colourway, trimmed in petal leather.",
    colours: [
      // Swatches per Figma New Arrival 103:131 / Women 71:234.
      { name: "Blush", hex: "#f2b8c6", available: true, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
      { name: "Chalk", hex: "#e9d8c4", available: true, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
    ],
    description: "Soft signature canvas in a limited blush colourway, trimmed in petal leather with gold-tone hardware.",
    details: ["Signature canvas", "Petal leather trim", "Gold-tone hardware", "10.5\" W x 6.5\" H x 3\" D"],
    care: "Spot clean canvas with a damp cloth; condition leather trim occasionally. Store away from direct sunlight.",
    personalise: true,
    availability: "low-stock",
  },
  {
    id: "petal-chain-bag",
    slug: "petal-chain-bag",
    name: "Petal Chain Bag",
    price: 325,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: ["new-arrival"],
    styles: ["shoulder-bags", "chain-straps"],
    material: "Glove-tanned Leather",
    cardDetail: { full: "Bow Chain Strap", compact: "Bow Chain" },
    eyebrow: "WOMEN — NEW ARRIVAL",
    tagline: "Petal leather, finished with a bow-detail chain strap.",
    colours: [
      // Swatches per Figma New Arrival 103:132 / Women 71:215.
      { name: "Petal", hex: "#e8a3b2", available: true, image: { src: "/images/home/bag-bow-pink.png" } },
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/home/bag-bow-pink.png" } },
      { name: "Blush", hex: "#f2b8c6", available: true, image: { src: "/images/home/bag-bow-pink.png" } },
    ],
    description: "Petal leather finished with a bow-detail chain strap — a softer shoulder bag for long afternoons.",
    details: ["Petal leather", "Bow-detail chain strap", "Gold-tone hardware", "11.5\" W x 7\" H x 3.5\" D"],
    care: "Wipe gently with a soft, dry cloth. Store in the dust bag provided, away from direct sunlight and moisture.",
    personalise: true,
    availability: "in-stock",
  },
  {
    id: "cargo-tote",
    slug: "cargo-tote",
    name: "Cargo Tote",
    price: 295,
    currency: "USD",
    type: "bag",
    category: "bags",
    alsoIn: ["women"],
    tags: ["new-arrival", "new-in", "weekend-edit"],
    styles: ["totes", "top-handle"],
    material: "Heavy Canvas",
    cardDetail: { full: "Heavy Canvas", compact: "Canvas" },
    badge: { full: "New In", compact: "New In" },
    eyebrow: "BAGS — NEW IN",
    tagline: "Heavy natural canvas with the COACH wordmark woven in.",
    colours: [
      // Colour names + swatches per Figma Women 71:110 / New Arrival 103:150 ("Natural · Heavy Canvas").
      { name: "Natural", hex: "#d9c7ae", available: true, image: { src: "/images/products/cargo-tote.png", crop: { left: "9.68%", top: "9.68%", width: "80.65%", height: "80.65%" } } },
      { name: "Black", hex: "#2b2b2b", available: false, image: { src: "/images/products/cargo-tote.png", crop: { left: "9.68%", top: "9.68%", width: "80.65%", height: "80.65%" } } },
      { name: "Brown", hex: "#8c6a4f", available: true, image: { src: "/images/products/cargo-tote.png", crop: { left: "9.68%", top: "9.68%", width: "80.65%", height: "80.65%" } } },
    ],
    description: "Heavy natural canvas with the COACH wordmark woven in — roomy enough for a full day out.",
    details: ["Heavy canvas", "Leather trim", "Interior zip pocket", "16\" W x 13\" H x 6\" D"],
    care: "Spot clean with a damp cloth. Avoid prolonged exposure to direct sunlight and moisture.",
    personalise: false,
    availability: "in-stock",
  },
  {
    id: "charter-camera-bag",
    slug: "charter-camera-bag",
    name: "Charter Camera Bag",
    price: 295,
    currency: "USD",
    type: "bag",
    // Figma Men 80:472 / Bags 86:489 — a men's piece (Bags lists every `type: "bag"`).
    category: "men",
    tags: ["new-arrival", "charter"],
    styles: ["crossbody"],
    material: "Signature Jacquard",
    cardDetail: { full: "Signature Jacquard", compact: "Jacquard" },
    eyebrow: "MEN — NEW ARRIVAL",
    tagline: "Signature jacquard, sized for the essentials.",
    colours: [
      // Swatches per Figma Men 80:472 (the old Black variant pointed at a women's bag image).
      { name: "Charcoal", hex: "#3a3b3f", available: true, image: { src: "/images/products/camera-bag.png", crop: { left: "0%", top: "-39.89%", width: "100%", height: "124.84%" } } },
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/products/camera-bag.png", crop: { left: "0%", top: "-39.89%", width: "100%", height: "124.84%" } } },
      { name: "Brown", hex: "#5a3e2e", available: true, image: { src: "/images/products/camera-bag.png", crop: { left: "0%", top: "-39.89%", width: "100%", height: "124.84%" } } },
    ],
    description: "Signature jacquard camera bag with an adjustable crossbody strap, sized for the essentials.",
    details: ["Signature jacquard", "Adjustable crossbody strap", "Front zip pocket", "8\" W x 6\" H x 3\" D"],
    care: "Spot clean jacquard with a dry cloth; condition leather trim occasionally.",
    personalise: false,
    availability: "in-stock",
  },
  {
    id: "nolita-19",
    slug: "nolita-pink",
    name: "Nolita 19",
    price: 195,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: ["new-arrival"],
    styles: ["shoulder-bags", "crossbody", "mini-bags"],
    material: "Signature Canvas",
    cardDetail: { full: "Signature Canvas", compact: "Signature" },
    eyebrow: "WOMEN — NEW ARRIVAL",
    tagline: "A compact signature-canvas crossbody for everyday carry.",
    colours: [
      // Swatches per Figma Women 71:166.
      { name: "Pink", hex: "#f2b8c6", available: true, image: { src: "/images/products/nolita-pink.png", crop: { left: "9.02%", top: "9.02%", width: "81.97%", height: "81.97%" } } },
      { name: "Brown", hex: "#3b2e2a", available: true, image: { src: "/images/products/nolita-pink.png", crop: { left: "9.02%", top: "9.02%", width: "81.97%", height: "81.97%" } } },
      { name: "Chalk", hex: "#e9d8c4", available: true, image: { src: "/images/products/nolita-pink.png", crop: { left: "9.02%", top: "9.02%", width: "81.97%", height: "81.97%" } } },
    ],
    description: "A compact signature-canvas crossbody, finished with gold-tone hardware for everyday carry.",
    details: ["Signature canvas", "Gold-tone hardware", "Adjustable crossbody strap", "7.5\" W x 5\" H x 2.5\" D"],
    care: "Spot clean with a damp cloth. Store in the dust bag provided.",
    personalise: true,
    availability: "in-stock",
  },
  {
    id: "quilted-tabby-20",
    slug: "quilted-tabby-20",
    name: "Quilted Tabby 20",
    price: 495,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: ["bestseller"],
    styles: ["shoulder-bags", "crossbody", "chain-straps"],
    material: "Nappa Leather",
    cardDetail: { full: "Nappa Leather", compact: "Nappa" },
    badge: { full: "Bestseller", compact: "Bestseller" },
    eyebrow: "WOMEN — THE TABBY",
    tagline: "In chalk nappa leather with signature C-hardware.",
    colours: [
      { name: "Chalk", hex: "#e8e3da", available: true, image: { src: "/images/products/tabby-quilted.png" }, gallery: tabbyGallery },
      { name: "Black", hex: "#1a1a1a", available: true, image: { src: "/images/products/tabby-quilted.png" }, gallery: tabbyGallery },
      { name: "Pink", hex: "#e9c9d6", available: true, image: { src: "/images/products/tabby-quilted.png" }, gallery: tabbyGallery },
      { name: "Moss", hex: "#6b7558", available: false, image: { src: "/images/products/tabby-quilted.png" }, gallery: tabbyGallery },
    ],
    description:
      "A quilted Tabby in glove-soft nappa leather, finished with our signature C-hardware and a detachable gold-tone chain. Sized for the essentials — phone, cards, keys — and made to soften with every chapter.",
    details: [
      "Nappa leather · Gold-tone hardware",
      "Magnetic snap closure · Fabric lining · Inside slip pocket",
      "Detachable chain and wrist strap",
      "8\" (L) x 5\" (H) x 2½\" (W)",
    ],
    care: "Wipe gently with a soft, dry cloth. Store in the dust bag provided.",
    personalise: true,
    craft: tabbyCraft,
    availability: "in-stock",
  },
  {
    id: "city-tote",
    slug: "city-tote",
    name: "City Tote",
    price: 350,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: [],
    styles: ["totes"],
    material: "Signature Canvas",
    cardDetail: { full: "Signature Canvas", compact: "Signature" },
    eyebrow: "WOMEN — NEW ARRIVAL",
    tagline: "Signature canvas in brown, built for the everyday commute.",
    // Swatches per Figma Women 71:130.
    colours: [
      { name: "Brown", hex: "#3b2e2a", available: true, image: { src: "/images/products/city-tote.png", crop: { left: "9.68%", top: "9.68%", width: "80.65%", height: "80.65%" } } },
      { name: "Tan", hex: "#c8a27a", available: true, image: { src: "/images/products/city-tote.png", crop: { left: "9.68%", top: "9.68%", width: "80.65%", height: "80.65%" } } },
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/products/city-tote.png", crop: { left: "9.68%", top: "9.68%", width: "80.65%", height: "80.65%" } } },
    ],
    description: "A signature canvas tote in walnut brown, sized for a laptop and the everyday commute.",
    details: ["Signature canvas", "Leather trim", "Interior zip and slip pockets", "15\" W x 12\" H x 5\" D"],
    care: "Spot clean with a damp cloth. Condition leather trim occasionally.",
    personalise: false,
    availability: "in-stock",
  },
  {
    id: "signature-mini-bag",
    slug: "signature-mini-bag",
    name: "Signature Mini Bag",
    price: 225,
    currency: "USD",
    type: "bag",
    category: "women",
    tags: ["online-exclusive"],
    styles: ["mini-bags", "shoulder-bags"],
    material: "Signature Canvas",
    cardDetail: { full: "Signature Canvas", compact: "Signature" },
    badge: { full: "Online Exclusive", compact: "Online" },
    eyebrow: "WOMEN — ONLINE EXCLUSIVE",
    tagline: "Blush signature canvas, sized down for evenings out.",
    // Figma Women 71:252 — same "[sig]" cutout as the Chapter Signature Bag.
    colours: [
      { name: "Blush", hex: "#f2b8c6", available: true, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
      { name: "Chalk", hex: "#e9d8c4", available: false, image: { src: "/images/home/bag-signature-pink.png", crop: { left: "-8.14%", top: "-10.47%", width: "116.28%", height: "116.28%" } } },
    ],
    description: "Our signature canvas in a blush colourway, cut down to a mini shoulder bag with a slim gold-tone chain.",
    details: ["Signature canvas", "Gold-tone chain strap", "Inside slip pocket", "8\" W x 5\" H x 2\" D"],
    care: "Spot clean with a damp cloth. Store in the dust bag provided.",
    personalise: true,
    availability: "in-stock",
  },

  // ── Men (Figma "09 — Men" 80:402 / 80:503; cut-outs 81:413). Card crops are the Product Card instances' fills. ──
  {
    id: "charter-backpack",
    slug: "charter-backpack",
    name: "Charter Backpack",
    price: 495,
    currency: "USD",
    type: "bag",
    category: "men",
    tags: ["new-in", "charter"],
    styles: ["backpacks"],
    material: "Signature Canvas",
    cardDetail: { full: "Signature Canvas", compact: "Signature" },
    badge: { full: "New In", compact: "New In" },
    eyebrow: "MEN — THE CHARTER",
    tagline: "Signature canvas and smooth leather, built for the daily commute.",
    colours: [
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/products/backpack.png", crop: { left: "12.22%", top: "-4.65%", width: "85.87%", height: "103.6%" } } },
      { name: "Charcoal", hex: "#3a3b3f", available: true, image: { src: "/images/products/backpack.png", crop: { left: "12.22%", top: "-4.65%", width: "85.87%", height: "103.6%" } } },
      { name: "Navy", hex: "#1f2a44", available: true, image: { src: "/images/products/backpack.png", crop: { left: "12.22%", top: "-4.65%", width: "85.87%", height: "103.6%" } } },
    ],
    description:
      "A structured backpack in signature canvas with a smooth leather front pocket — a padded laptop sleeve inside, a quick-access pocket outside.",
    details: ["Signature canvas · Smooth leather trim", "Padded laptop sleeve (fits 15\")", "Zip front pocket · Inside slip pockets", "12\" W x 16\" H x 5\" D"],
    care: "Spot clean canvas with a dry cloth; condition leather trim occasionally. Store stuffed to keep its shape.",
    personalise: true,
    availability: "in-stock",
  },
  {
    id: "hudson-messenger",
    slug: "hudson-messenger",
    name: "Hudson Messenger",
    price: 395,
    currency: "USD",
    type: "bag",
    category: "men",
    tags: ["bestseller"],
    styles: ["messengers", "crossbody"],
    material: "Pebble Leather",
    cardDetail: { full: "Pebble Leather", compact: "Pebble" },
    badge: { full: "Bestseller", compact: "Bestseller" },
    eyebrow: "MEN — BESTSELLER",
    tagline: "Pebble leather with a turnlock flap, worn across the body.",
    colours: [
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/products/messenger.png", crop: { left: "0.75%", top: "-29.99%", width: "113.87%", height: "113.87%" } } },
      { name: "Saddle", hex: "#8c5a3c", available: true, image: { src: "/images/products/messenger.png", crop: { left: "0.75%", top: "-29.99%", width: "113.87%", height: "113.87%" } } },
      { name: "Navy", hex: "#1f2a44", available: true, image: { src: "/images/products/messenger.png", crop: { left: "0.75%", top: "-29.99%", width: "113.87%", height: "113.87%" } } },
    ],
    description: "A flap messenger in glove-tanned pebble leather, with an adjustable webbing strap and room for a tablet and the day's essentials.",
    details: ["Pebble leather", "Adjustable webbing crossbody strap", "Inside zip pocket · Tablet sleeve", "13\" W x 10\" H x 3\" D"],
    care: "Wipe gently with a soft, dry cloth. Store in the dust bag provided, away from direct sunlight and moisture.",
    personalise: true,
    availability: "in-stock",
  },
  {
    id: "gotham-briefcase",
    slug: "gotham-briefcase",
    name: "Gotham Briefcase",
    price: 550,
    currency: "USD",
    type: "bag",
    category: "men",
    tags: [],
    styles: ["briefcases"],
    material: "Signature Canvas",
    cardDetail: { full: "Signature Canvas", compact: "Signature" },
    eyebrow: "MEN — THE GOTHAM EDIT",
    tagline: "A slim signature-canvas briefcase with a detachable strap.",
    colours: [
      { name: "Charcoal", hex: "#3a3b3f", available: true, image: { src: "/images/products/briefcase.png", crop: { left: "8.22%", top: "-14.75%", width: "88.89%", height: "110.97%" } } },
      { name: "Black", hex: "#111111", available: true, image: { src: "/images/products/briefcase.png", crop: { left: "8.22%", top: "-14.75%", width: "88.89%", height: "110.97%" } } },
      { name: "Brown", hex: "#5a3e2e", available: true, image: { src: "/images/products/briefcase.png", crop: { left: "8.22%", top: "-14.75%", width: "88.89%", height: "110.97%" } } },
    ],
    description: "A slim briefcase in signature canvas with leather handles, a padded laptop compartment and a detachable shoulder strap.",
    details: ["Signature canvas · Leather handles", "Padded laptop compartment (fits 15\")", "Detachable shoulder strap", "16\" W x 11.5\" H x 3\" D"],
    care: "Spot clean canvas with a dry cloth; condition leather trim occasionally.",
    personalise: true,
    availability: "in-stock",
  },
  {
    id: "burnished-duffle",
    slug: "burnished-duffle",
    name: "Burnished Duffle",
    // Price not shown in any Figma frame (the duffle only appears in editorial / mega-menu) — placeholder, flagged in the page report.
    price: 695,
    currency: "USD",
    type: "bag",
    category: "men",
    tags: ["weekend-edit"],
    styles: ["duffles"],
    material: "Burnished Leather",
    eyebrow: "MEN — THE WEEKENDER",
    tagline: "Hand-burnished leather that deepens at every edge.",
    colours: [
      { name: "Brown", hex: "#3d2a22", available: true, image: { src: "/images/products/duffle.png", crop: { left: "2.34%", top: "-28.95%", width: "96.77%", height: "120.81%" } } },
    ],
    description:
      "Hand-burnished leather that deepens at every edge, with a detachable webbing strap — packed for two nights, made for twenty years.",
    details: ["Hand-burnished leather", "Detachable webbing strap", "Inside zip pocket", "20\" W x 11\" H x 10\" D"],
    care: "Condition every few months with a neutral leather cream. Store stuffed, in the dust bag provided.",
    personalise: true,
    availability: "in-stock",
  },
];

export function getProductsByType(type: ProductType) {
  return products.filter((p) => p.type === type);
}

/** Every piece listed on a category page — its primary category plus any `alsoIn` cross-listings. */
export function getProductsInCategory(slug: CategorySlug) {
  return products.filter((p) => p.category === slug || p.alsoIn?.includes(slug));
}

/**
 * The listing a piece belongs to — "Complete the Chapter", mini-bag and bag-page suggestions draw from it.
 * Women / Men use their category (+ cross-listings); a piece whose home is the cross-category Bags page
 * (e.g. the Cargo Tote) pairs with every other bag.
 */
export function getCategoryListing(product: Product) {
  return product.category === "bags" ? getProductsByType(product.type) : getProductsInCategory(product.category);
}

export function getRelatedProducts(product: Product, exclude: ReadonlySet<string> = new Set()) {
  return getCategoryListing(product).filter((p) => p.id !== product.id && !exclude.has(p.id));
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getGallery(colour: ProductColour): GalleryShot[] {
  return colour.gallery ?? [{ image: colour.image, caption: "01 — FRONT" }];
}

export { formatPrice } from "./format.ts"; // relative: scripts/og.ts loads this file with plain Node
