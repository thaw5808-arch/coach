import type { CollectionConfig } from "@/lib/collection";
import type { CategorySlug, ProductImage, ProductStyle, ProductType } from "@/lib/products";

/*
 * Category page configs — Women (Figma "08 — Women" 71:2 / 72:224 / 73:335). Men (09) and Bags (10) add an entry
 * here and a 3-line route file; components/category/CategoryPage renders every section from this data.
 */

/**
 * A cut-out placed on a stage, in Figma px relative to the stage frame (converted to % at render).
 * `crop` = Figma's image-fill crop inside the square `size` box (Men's non-square cut-outs, 81:413).
 */
export type StageImage = ProductImage & { alt: string; x: number; y: number; size: number; rotate?: number };
/** Blob + cut-outs composition — hero stages and editorial images (desktop and mobile frames differ). */
export type Stage = { width: number; height: number; blob: { x: number; y: number; w: number; h: number }; images: StageImage[] };

export type MegaMenuLink = { label: string; href: string };
export type MegaMenuContent = {
  columns: { heading: string; links: MegaMenuLink[] }[];
  featured: { title: string; image: ProductImage; href: string; cta: string };
};

export type EditorialBlockConfig =
  | {
      kind: "feature";
      key: string;
      eyebrow: string;
      title: string;
      body: { desktop: string; mobile: string };
      cta: { label: string; href: string };
      /** Desktop 300×408 image column / mobile 358×220 image band. */
      stage: { desktop: Stage; mobile: Stage };
      desktopAfter: number;
      mobileAfter: number;
    }
  | {
      kind: "promo";
      key: string;
      eyebrow: string;
      title: string;
      body: { desktop: string; mobile: string };
      cta: { label: { desktop: string; mobile: string }; href: string };
      /** Monogram hangtag illustration (desktop only in Figma 71:271). */
      hangtag?: string;
      desktopAfter: number;
      mobileAfter: number;
    };

export type CategoryConfig = {
  slug: CategorySlug;
  /** Which products the page lists: its category (Women / Men) or every product of a type (Bags = all bags). */
  source?: { productType: ProductType };
  path: `/${string}`;
  /** Breadcrumb + nav label. */
  title: string;
  seo: { title: string; description: string };
  hero: {
    eyebrow: { desktop: string; mobile: string };
    tagline: string;
    intro: { desktop: string; mobile: string };
    stage: { desktop: Stage; mobile: Stage };
  };
  /** Women "Shop by Silhouette" (71:50) / Men "Shop by Category" (80:419). */
  silhouettes: {
    eyebrow: string;
    title: string;
    tiles: { type: ProductStyle; label: string; mobileLabel?: string; image: ProductImage }[];
  };
  collection: {
    eyebrow: string;
    title: string;
    /** Product ids in curated "Featured" order; anything not listed follows in catalogue order. */
    featured: string[];
    config: CollectionConfig;
  };
  editorials: EditorialBlockConfig[];
  /** Desktop mega-menu panel for this category's nav item. */
  menu: MegaMenuContent;
};

const IMG = "/images/products";

export const women: CategoryConfig = {
  slug: "women",
  path: "/women",
  title: "Women",
  seo: {
    title: "Women’s Bags & Small Leather",
    description:
      "From weekend canvas totes to quilted evening bags — women’s bags and small leather goods, each finished by hand and made to grow richer with time.",
  },
  hero: {
    eyebrow: { desktop: "WOMEN — BAGS & SMALL LEATHER", mobile: "WOMEN — BAGS" },
    tagline: "For every chapter of her day.",
    intro: {
      desktop: "From weekend canvas totes to quilted evening bags — each finished by hand and made to grow richer with time.",
      mobile: "From weekend canvas totes to quilted evening bags — each finished by hand.",
    },
    stage: {
      // Figma "Hero / Stage" 71:45 (640×440) and 72:248 (358×260). Rotated layers use their inner image box.
      desktop: {
        width: 640,
        height: 440,
        blob: { x: 70, y: 10, w: 500, h: 452 },
        images: [
          { src: `${IMG}/city-tote.png`, alt: "City Tote in brown signature canvas", x: 23.5, y: 54.9, size: 300, rotate: 6 },
          { src: `${IMG}/nolita-pink.png`, alt: "Nolita 19 in pink signature canvas", x: 414.9, y: 132.9, size: 230, rotate: -8 },
          { src: `${IMG}/tabby-quilted.png`, alt: "Quilted Tabby 20 in chalk nappa leather", x: 190, y: 170, size: 270 },
        ],
      },
      mobile: {
        width: 358,
        height: 260,
        blob: { x: 39, y: 10, w: 280, h: 253.12 },
        images: [
          { src: `${IMG}/city-tote.png`, alt: "City Tote in brown signature canvas", x: 3.55, y: 29.41, size: 190, rotate: 6 },
          { src: `${IMG}/nolita-pink.png`, alt: "Nolita 19 in pink signature canvas", x: 221.7, y: 88.83, size: 150, rotate: -8 },
          { src: `${IMG}/tabby-quilted.png`, alt: "Quilted Tabby 20 in chalk nappa leather", x: 104, y: 100, size: 170 },
        ],
      },
    },
  },
  silhouettes: {
    eyebrow: "SHOP BY SILHOUETTE",
    title: "Find Your Shape",
    tiles: [
      { type: "totes", label: "Totes", image: { src: `${IMG}/city-tote.png` } },
      { type: "top-handle", label: "Top Handle", image: { src: `${IMG}/cargo-tote.png` } },
      { type: "shoulder-bags", label: "Shoulder Bags", mobileLabel: "Shoulder", image: { src: `${IMG}/nolita-pink.png` } },
      { type: "crossbody", label: "Crossbody", image: { src: `${IMG}/tabby-quilted.png` } },
    ],
  },
  collection: {
    eyebrow: "THE COLLECTION",
    title: "All Women’s Bags",
    // Figma grid order (71:108).
    featured: [
      "cargo-tote",
      "city-tote",
      "quilted-tabby-20",
      "nolita-19",
      "chapter-shoulder-bag",
      "petal-chain-bag",
      "chapter-signature-bag",
      "signature-mini-bag",
    ],
    config: {
      types: [
        { key: "totes", label: "Totes" },
        { key: "top-handle", label: "Top Handle" },
        { key: "shoulder-bags", label: "Shoulder Bags" },
        { key: "crossbody", label: "Crossbody" },
        { key: "mini-bags", label: "Mini Bags" },
        // Mega-menu "Small Leather" destinations — valid filters, but no chips (not in the Figma chip row).
        { key: "wallets", label: "Wallets", hidden: true },
        { key: "card-cases", label: "Card Cases", hidden: true },
        { key: "wristlets", label: "Wristlets", hidden: true },
        { key: "bag-charms", label: "Bag Charms", hidden: true },
      ],
      prices: [
        { key: "under-250", label: "Under $250", max: 249.99 },
        { key: "250-400", label: "$250 – $400", min: 250, max: 400 },
        { key: "400-plus", label: "$400+", min: 400.01 },
      ],
      sorts: [
        { key: "featured", label: "Sort: Featured" },
        { key: "newest", label: "Sort: Newest" },
        { key: "price-asc", label: "Sort: Price, Low to High" },
        { key: "price-desc", label: "Sort: Price, High to Low" },
      ],
      defaultSort: "featured",
      pageSize: { desktop: 8, mobile: 6 },
      grid: "four-medium",
      empty: {
        title: "Nothing Matches — Yet.",
        body: "No {summary} right now. Remove a filter, or ask to be told when one arrives.",
        summary: "phrase",
        fallbackBody: "Nothing here right now. Ask to be told when new pieces arrive.",
        style: "card",
        secondary: { kind: "notify", label: "Notify me" },
      },
    },
  },
  editorials: [
    {
      kind: "feature",
      key: "tabby",
      eyebrow: "THE ICON",
      title: "The Quilted Tabby",
      body: {
        desktop: "Pillowy nappa quilting, a softly structured flap and our signature C-hardware — carried by hand, on the shoulder or across the body.",
        mobile: "Pillowy nappa quilting and our signature C-hardware.",
      },
      cta: { label: "Discover the Tabby", href: "/products/quilted-tabby-20" },
      // Figma 71:186 / 72:363 — rotated layers use their inner image box.
      stage: {
        desktop: {
          width: 300,
          height: 408,
          blob: { x: 30, y: 92, w: 250, h: 226 },
          images: [{ src: `${IMG}/tabby-quilted.png`, alt: "Quilted Tabby in chalk nappa leather", x: 16.13, y: 99.53, size: 240, rotate: 8 }],
        },
        mobile: {
          width: 358,
          height: 220,
          blob: { x: 79, y: 20, w: 200, h: 180.8 },
          images: [{ src: `${IMG}/tabby-quilted.png`, alt: "Quilted Tabby in chalk nappa leather", x: 58.36, y: 19.59, size: 210, rotate: 8 }],
        },
      },
      desktopAfter: 4,
      mobileAfter: 4,
    },
    {
      kind: "promo",
      key: "personalise",
      eyebrow: "COMPLIMENTARY",
      title: "Make It Yours",
      body: {
        desktop: "Add your initials to any leather piece — hot-stamped in gold, silver or blind emboss, at no charge.",
        mobile: "Initials hot-stamped on any leather piece, at no charge.",
      },
      cta: { label: { desktop: "How personalisation works", mobile: "How it works" }, href: "/client-care#personalisation" },
      hangtag: "T.A.",
      desktopAfter: 8,
      mobileAfter: 6,
    },
  ],
  menu: {
    columns: [
      {
        heading: "BAGS",
        links: [
          { label: "All Bags", href: "/women" },
          { label: "Totes", href: "/women?type=totes" },
          { label: "Top Handle", href: "/women?type=top-handle" },
          { label: "Shoulder Bags", href: "/women?type=shoulder-bags" },
          { label: "Crossbody", href: "/women?type=crossbody" },
          { label: "Mini Bags", href: "/women?type=mini-bags" },
        ],
      },
      {
        heading: "SMALL LEATHER",
        links: [
          { label: "Wallets", href: "/women?type=wallets" },
          { label: "Card Cases", href: "/women?type=card-cases" },
          { label: "Wristlets", href: "/women?type=wristlets" },
          { label: "Bag Charms", href: "/women?type=bag-charms" },
        ],
      },
      {
        heading: "COLLECTIONS",
        links: [
          { label: "The Tabby", href: "/products/quilted-tabby-20" },
          { label: "Signature Canvas", href: "/women?material=signature-canvas" },
          { label: "The Chapter Edit", href: "/new-arrivals" },
          { label: "Cargo Canvas", href: "/products/cargo-tote" },
        ],
      },
    ],
    featured: { title: "The Quilted Tabby", image: { src: `${IMG}/tabby-quilted.png` }, href: "/products/quilted-tabby-20", cta: "Discover" },
  },
};

const MEN_CROP = {
  // Figma image-fill crops of the 81:413 cut-outs inside a square box.
  backpack: { left: "14.1%", top: "-1.92%", width: "81.58%", height: "98.42%" },
  briefcase: { left: "10.31%", top: "-11.51%", width: "84.44%", height: "105.42%" },
  camera: { left: "2.5%", top: "-35.39%", width: "95%", height: "118.6%" },
  messenger: { left: "3.21%", top: "-25.99%", width: "108.18%", height: "108.18%" },
  duffle: { left: "2.34%", top: "-28.95%", width: "96.77%", height: "120.81%" },
};

/** Figma "09 — Men": desktop 80:402, mobile 80:503, states 80:612. */
export const men: CategoryConfig = {
  slug: "men",
  path: "/men",
  title: "Men",
  seo: {
    title: "Men’s Bags & Small Leather",
    description:
      "From signature canvas briefcases to pebble-leather messengers — men’s bags and small leather goods, cut for the commute, the weekend and everything after.",
  },
  hero: {
    eyebrow: { desktop: "MEN — BAGS & SMALL LEATHER", mobile: "MEN — BAGS" },
    tagline: "Built for the long way round.",
    intro: {
      desktop: "From signature canvas briefcases to pebble-leather messengers — cut for the commute, the weekend and everything after.",
      mobile: "From signature canvas briefcases to pebble-leather messengers — cut for the commute and the weekend.",
    },
    stage: {
      // Figma "Hero / Stage" 80:414 (640×440) and 80:513 (358×260); paint order backpack → briefcase → camera bag.
      desktop: {
        width: 640,
        height: 440,
        blob: { x: 70, y: 10, w: 500, h: 452 },
        images: [
          { src: `${IMG}/backpack.png`, crop: MEN_CROP.backpack, alt: "Charter Backpack in black signature canvas", x: 30, y: 121, size: 320 },
          { src: `${IMG}/briefcase.png`, crop: MEN_CROP.briefcase, alt: "Gotham Briefcase in charcoal signature canvas", x: 200, y: 147, size: 300 },
          { src: `${IMG}/camera-bag.png`, crop: MEN_CROP.camera, alt: "Charter Camera Bag in charcoal signature jacquard", x: 375, y: 252, size: 220 },
        ],
      },
      mobile: {
        width: 358,
        height: 260,
        blob: { x: 39, y: 10, w: 280, h: 253.12 },
        images: [
          { src: `${IMG}/backpack.png`, crop: MEN_CROP.backpack, alt: "Charter Backpack in black signature canvas", x: 20, y: 75, size: 190 },
          { src: `${IMG}/briefcase.png`, crop: MEN_CROP.briefcase, alt: "Gotham Briefcase in charcoal signature canvas", x: 110, y: 89, size: 180 },
          { src: `${IMG}/camera-bag.png`, crop: MEN_CROP.camera, alt: "Charter Camera Bag in charcoal signature jacquard", x: 200, y: 138, size: 140 },
        ],
      },
    },
  },
  silhouettes: {
    eyebrow: "SHOP BY CATEGORY",
    title: "Find Your Carry",
    tiles: [
      { type: "backpacks", label: "Backpacks", image: { src: `${IMG}/backpack.png`, crop: MEN_CROP.backpack } },
      { type: "briefcases", label: "Briefcases", image: { src: `${IMG}/briefcase.png`, crop: MEN_CROP.briefcase } },
      { type: "messengers", label: "Messengers", image: { src: `${IMG}/messenger.png`, crop: MEN_CROP.messenger } },
      { type: "crossbody", label: "Crossbody", image: { src: `${IMG}/camera-bag.png`, crop: MEN_CROP.camera } },
    ],
  },
  collection: {
    eyebrow: "THE COLLECTION",
    title: "All Men’s Bags",
    // Figma grid order (80:469); the duffle is only in the editorial tile, so it follows.
    featured: ["charter-backpack", "charter-camera-bag", "hudson-messenger", "gotham-briefcase", "burnished-duffle"],
    config: {
      types: [
        { key: "backpacks", label: "Backpacks" },
        { key: "briefcases", label: "Briefcases" },
        { key: "messengers", label: "Messengers" },
        { key: "crossbody", label: "Crossbody" },
        { key: "duffles", label: "Duffles" },
        { key: "wallets", label: "Wallets", hidden: true },
        { key: "card-cases", label: "Card Cases", hidden: true },
        { key: "belts", label: "Belts", hidden: true },
        { key: "key-fobs", label: "Key Fobs", hidden: true },
      ],
      // Figma mobile filter sheet 92:3184.
      prices: [
        { key: "under-300", label: "Under $300", max: 299.99 },
        { key: "300-450", label: "$300 – $450", min: 300, max: 450 },
        { key: "450-plus", label: "$450+", min: 450.01 },
      ],
      sorts: women.collection.config.sorts,
      defaultSort: "featured",
      // Figma shows one row of 4 before the editorial row ("You’ve viewed 4 of 24 pieces") on both breakpoints.
      pageSize: { desktop: 4, mobile: 4 },
      grid: "four-medium",
      empty: women.collection.config.empty,
    },
  },
  editorials: [
    {
      kind: "feature",
      key: "duffle",
      eyebrow: "THE WEEKENDER",
      title: "The Burnished Duffle",
      body: {
        desktop: "Hand-burnished leather that deepens at every edge, with a detachable webbing strap — packed for two nights, made for twenty years.",
        mobile: "Hand-burnished leather that deepens at every edge, with a detachable webbing strap.",
      },
      cta: { label: "Discover the Duffle", href: "/products/burnished-duffle" },
      // Figma 80:477 / 80:567.
      stage: {
        desktop: {
          width: 300,
          height: 408,
          blob: { x: 25, y: 91, w: 250, h: 226 },
          images: [{ src: `${IMG}/duffle.png`, crop: MEN_CROP.duffle, alt: "Burnished Duffle in hand-burnished brown leather", x: 20, y: 74, size: 260 }],
        },
        mobile: {
          width: 358,
          height: 220,
          blob: { x: 79, y: 20, w: 200, h: 180.8 },
          images: [{ src: `${IMG}/duffle.png`, crop: MEN_CROP.duffle, alt: "Burnished Duffle in hand-burnished brown leather", x: 74, y: 6, size: 210 }],
        },
      },
      desktopAfter: 4,
      mobileAfter: 4,
    },
    // Same "Make It Yours" promo as Women, sharing the editorial's row (80:475) instead of closing the first page.
    { ...(women.editorials.find((e) => e.kind === "promo") as Extract<EditorialBlockConfig, { kind: "promo" }>), desktopAfter: 4, mobileAfter: 4 },
  ],
  menu: {
    // Figma "Nav — Men Menu Open" 80:613.
    columns: [
      {
        heading: "BAGS",
        links: [
          { label: "All Bags", href: "/men" },
          { label: "Backpacks", href: "/men?type=backpacks" },
          { label: "Briefcases", href: "/men?type=briefcases" },
          { label: "Messengers", href: "/men?type=messengers" },
          { label: "Crossbody", href: "/men?type=crossbody" },
          { label: "Duffles", href: "/men?type=duffles" },
        ],
      },
      {
        heading: "SMALL LEATHER",
        links: [
          { label: "Wallets", href: "/men?type=wallets" },
          { label: "Card Cases", href: "/men?type=card-cases" },
          { label: "Belts", href: "/men?type=belts" },
          { label: "Key Fobs", href: "/men?type=key-fobs" },
        ],
      },
      {
        heading: "COLLECTIONS",
        links: [
          { label: "The Charter", href: "/products/charter-backpack" },
          { label: "Signature Jacquard", href: "/men?material=signature-jacquard" },
          { label: "The Gotham Edit", href: "/products/gotham-briefcase" },
          { label: "Burnished Leather", href: "/men?material=burnished-leather" },
        ],
      },
    ],
    featured: { title: "The Burnished Duffle", image: { src: `${IMG}/duffle.png`, crop: MEN_CROP.duffle }, href: "/products/burnished-duffle", cta: "Discover" },
  },
};

const BAG_CROP = {
  // Figma image-fill crops (Bags tiles 86:427 / 86:434 are inset contain-crops; the rest reuse Men's cut-out crops).
  cityTile: { left: "10.32%", top: "10.32%", width: "79.37%", height: "79.37%" },
  nolitaTile: { left: "11.54%", top: "11.54%", width: "76.92%", height: "76.92%" },
};

/** Figma "10 — Bags": desktop 86:402, mobile 86:503, states 86:612. A cross-category view of every bag. */
export const bags: CategoryConfig = {
  slug: "bags",
  path: "/bags",
  title: "Bags",
  source: { productType: "bag" },
  seo: {
    title: "Bags for Women & Men",
    description:
      "Totes, shoulder bags, backpacks and briefcases for her and for him — cut from the same leathers and the same canvas, made to be carried every day.",
  },
  hero: {
    eyebrow: { desktop: "BAGS — WOMEN & MEN", mobile: "BAGS — WOMEN & MEN" },
    tagline: "Made to be carried, every day.",
    intro: {
      desktop: "Totes, shoulder bags, backpacks and briefcases — for her and for him, cut from the same leathers and the same canvas.",
      mobile: "Totes, backpacks and briefcases for her and for him — cut from the same leathers and canvas.",
    },
    stage: {
      // Figma "Hero / Stage" 86:414 / 86:513 — paint order city tote → backpack → Tabby.
      desktop: {
        width: 640,
        height: 440,
        blob: { x: 70, y: 10, w: 500, h: 452 },
        images: [
          { src: `${IMG}/city-tote.png`, alt: "City Tote in brown signature canvas", x: 40, y: 116, size: 290 },
          { src: `${IMG}/backpack.png`, crop: MEN_CROP.backpack, alt: "Charter Backpack in black signature canvas", x: 300, y: 145, size: 300 },
          { src: `${IMG}/tabby-quilted.png`, alt: "Quilted Tabby 20 in chalk nappa leather", x: 180, y: 211, size: 260 },
        ],
      },
      mobile: {
        width: 358,
        height: 260,
        blob: { x: 39, y: 10, w: 280, h: 253.12 },
        images: [
          { src: `${IMG}/city-tote.png`, alt: "City Tote in brown signature canvas", x: 30, y: 65, size: 180 },
          { src: `${IMG}/backpack.png`, crop: MEN_CROP.backpack, alt: "Charter Backpack in black signature canvas", x: 160, y: 75, size: 190 },
          { src: `${IMG}/tabby-quilted.png`, alt: "Quilted Tabby 20 in chalk nappa leather", x: 95, y: 134, size: 160 },
        ],
      },
    },
  },
  silhouettes: {
    eyebrow: "SHOP BY CATEGORY",
    title: "Every Way to Carry",
    tiles: [
      { type: "totes", label: "Totes", image: { src: `${IMG}/city-tote.png`, crop: BAG_CROP.cityTile } },
      { type: "crossbody", label: "Crossbody", image: { src: `${IMG}/nolita-pink.png`, crop: BAG_CROP.nolitaTile } },
      { type: "backpacks", label: "Backpacks", image: { src: `${IMG}/backpack.png`, crop: MEN_CROP.backpack } },
      { type: "briefcases", label: "Briefcases", image: { src: `${IMG}/briefcase.png`, crop: MEN_CROP.briefcase } },
    ],
  },
  collection: {
    eyebrow: "THE COLLECTION",
    title: "All Bags",
    // Figma grid order (86:469).
    featured: [
      "city-tote",
      "charter-backpack",
      "quilted-tabby-20",
      "gotham-briefcase",
      "nolita-19",
      "hudson-messenger",
      "chapter-shoulder-bag",
      "charter-camera-bag",
    ],
    config: {
      audiences: [
        { key: "her", label: "For Her", category: "women", noun: "women’s bags" },
        { key: "him", label: "For Him", category: "men", noun: "men’s bags" },
      ],
      types: [
        { key: "totes", label: "Totes" },
        { key: "crossbody", label: "Crossbody" },
        { key: "backpacks", label: "Backpacks" },
        // Tile + mega-menu destinations without a chip (86:459 shows only the three above).
        { key: "briefcases", label: "Briefcases", hidden: true },
        { key: "top-handle", label: "Top Handle", hidden: true },
        { key: "shoulder-bags", label: "Shoulder Bags", hidden: true },
        { key: "mini-bags", label: "Mini Bags", hidden: true },
        { key: "messengers", label: "Messengers", hidden: true },
        { key: "duffles", label: "Duffles", hidden: true },
      ],
      // Figma sheet 92:3279: "Signature Canvas" and a grouped "Leather".
      materials: [
        "Signature Canvas",
        { label: "Leather", matches: ["Pebble Leather", "Nappa Leather", "Glove-tanned Leather", "Burnished Leather"] },
      ],
      edits: [
        { key: "weekend", label: "The Weekend Edit", tag: "weekend-edit" },
        { key: "charter", label: "The Charter", tag: "charter" },
      ],
      prices: women.collection.config.prices,
      sorts: women.collection.config.sorts,
      defaultSort: "featured",
      // "You’ve viewed 8 of 56" desktop / "6 of 56" mobile — same paging as Women.
      pageSize: { desktop: 8, mobile: 6 },
      grid: "four-medium",
      empty: women.collection.config.empty,
    },
  },
  editorials: [
    {
      kind: "feature",
      key: "weekend",
      eyebrow: "THE WEEKEND EDIT",
      title: "Packed for Two",
      body: {
        desktop: "The canvas Cargo Tote and the Burnished Duffle — one for her, one for him, both ready for a Friday-night train.",
        mobile: "The canvas Cargo Tote and the Burnished Duffle — ready for a Friday-night train.",
      },
      cta: { label: "Shop the Edit", href: "/bags?edit=weekend#collection" },
      // Figma 86:477 / 86:567 — two cut-outs on one blob.
      stage: {
        desktop: {
          width: 300,
          height: 408,
          blob: { x: 30, y: 92, w: 250, h: 226 },
          images: [
            { src: `${IMG}/cargo-tote.png`, alt: "Cargo Tote in natural canvas", x: 32, y: 160, size: 160 },
            { src: `${IMG}/duffle.png`, crop: MEN_CROP.duffle, alt: "Burnished Duffle in hand-burnished leather", x: 138, y: 171, size: 180 },
          ],
        },
        mobile: {
          width: 358,
          height: 220,
          blob: { x: 79, y: 20, w: 200, h: 180.8 },
          images: [
            { src: `${IMG}/cargo-tote.png`, alt: "Cargo Tote in natural canvas", x: 50, y: 44, size: 160 },
            { src: `${IMG}/duffle.png`, crop: MEN_CROP.duffle, alt: "Burnished Duffle in hand-burnished leather", x: 172, y: 63, size: 170 },
          ],
        },
      },
      desktopAfter: 4,
      mobileAfter: 4,
    },
    {
      kind: "promo",
      key: "care",
      eyebrow: "COMPLIMENTARY",
      title: "Care for Life",
      body: {
        desktop: "Bring any Coach bag back for a clean, condition and edge repaint — at any boutique, at no charge.",
        mobile: "A clean, condition and edge repaint for any Coach bag, at no charge.",
      },
      cta: { label: { desktop: "Find a boutique", mobile: "Find a boutique" }, href: "/the-house#stores" },
      hangtag: "CARE",
      desktopAfter: 8,
      mobileAfter: 6,
    },
  ],
  menu: {
    // Figma "Nav — Bags Menu Open" 86:613 — every link lands on a filtered /bags view.
    columns: [
      {
        heading: "FOR HER",
        links: [
          { label: "All Women’s Bags", href: "/bags?for=her" },
          { label: "Totes", href: "/bags?for=her&type=totes" },
          { label: "Top Handle", href: "/bags?for=her&type=top-handle" },
          { label: "Shoulder Bags", href: "/bags?for=her&type=shoulder-bags" },
          { label: "Crossbody", href: "/bags?for=her&type=crossbody" },
          { label: "Mini Bags", href: "/bags?for=her&type=mini-bags" },
        ],
      },
      {
        heading: "FOR HIM",
        links: [
          { label: "All Men’s Bags", href: "/bags?for=him" },
          { label: "Backpacks", href: "/bags?for=him&type=backpacks" },
          { label: "Briefcases", href: "/bags?for=him&type=briefcases" },
          { label: "Messengers", href: "/bags?for=him&type=messengers" },
        ],
      },
      {
        heading: "COLLECTIONS",
        links: [
          { label: "Signature Canvas", href: "/bags?material=signature-canvas" },
          { label: "The Tabby", href: "/products/quilted-tabby-20" },
          { label: "The Charter", href: "/bags?edit=charter" },
          { label: "Cargo Canvas", href: "/products/cargo-tote" },
        ],
      },
    ],
    featured: { title: "The Weekend Edit", image: { src: `${IMG}/cargo-tote.png` }, href: "/bags?edit=weekend", cta: "Discover" },
  },
};

export const categories = { women, men, bags } satisfies Partial<Record<CategorySlug, CategoryConfig>>;

export function getCategory(slug: CategorySlug): CategoryConfig | undefined {
  return (categories as Partial<Record<CategorySlug, CategoryConfig>>)[slug];
}
