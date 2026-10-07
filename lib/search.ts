import { getCategory } from "@/lib/categories";
import type { CollectionConfig } from "@/lib/collection";
import { products, type Product, type ProductStyle } from "@/lib/products";

/*
 * Catalogue search — no server, no index service: the 13 products are scored in memory.
 *
 * Matching is case- and accent-insensitive, tolerant of simple plurals ("totes" → tote, "backpacks" → backpack)
 * and partial words typed from the start ("tab" → tabby), but never fuzzy inside a word ("blk" ≠ black).
 * Every query word must match somewhere; the score favours the name, then the bag type, then anything else.
 */

export const STYLE_LABELS: Record<ProductStyle, string> = {
  "shoulder-bags": "Shoulder Bags",
  crossbody: "Crossbody",
  "mini-bags": "Mini Bags",
  "chain-straps": "Chain Straps",
  totes: "Totes",
  "top-handle": "Top Handle",
  wallets: "Wallets",
  "card-cases": "Card Cases",
  wristlets: "Wristlets",
  "bag-charms": "Bag Charms",
  backpacks: "Backpacks",
  briefcases: "Briefcases",
  messengers: "Messengers",
  duffles: "Duffles",
  belts: "Belts",
  "key-fobs": "Key Fobs",
};

const STOP_WORDS = new Set(["the", "a", "an", "and", "for", "in", "of", "with", "s"]);
/** Query words of this length or more also match as a prefix ("tab" → tabby). */
const PREFIX_MIN = 3;
/** Name > bag type > the colour the card shows > everything else. */
const WEIGHT = { name: 100, type: 60, shownColour: 30, other: 20 } as const;

/** Lower-case, strip accents and apostrophes ("Men’s" → "mens", "Écru" → "ecru"), punctuation → spaces. */
export function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Plural → singular, applied to both sides so "canvas"/"canvases" and "totes"/"tote" meet. */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(ses|xes|ches|shes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokens(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w));
}

type Field = { weight: number; words: string[] };
type Indexed = { product: Product; fields: Field[]; order: number; name: string };

function categoryWords(product: Product) {
  const cats = [product.category, ...(product.alsoIn ?? [])];
  const words: string[] = [];
  if (cats.includes("women")) words.push("women", "womens", "woman", "her");
  if (cats.includes("men")) words.push("men", "mens", "man", "him");
  if (cats.includes("bags")) words.push("bags");
  return words;
}

function index(product: Product, order: number): Indexed {
  const typeText = [...product.styles.map((s) => STYLE_LABELS[s]), product.type === "bag" ? "bag" : "small leather goods"].join(" ");
  const other = [
    ...product.colours.map((c) => c.name),
    product.material,
    product.cardDetail?.full ?? "",
    product.eyebrow,
    product.badge?.full ?? "",
    ...product.tags.map((t) => t.replace(/-/g, " ")),
    ...categoryWords(product),
  ].join(" ");
  const field = (weight: number, text: string): Field => ({ weight, words: tokens(text).map(stem) });
  return {
    product,
    order,
    name: normalise(product.name),
    fields: [field(WEIGHT.name, product.name), field(WEIGHT.type, typeText), field(WEIGHT.shownColour, product.colours[0].name), field(WEIGHT.other, other)],
  };
}

const INDEX = products.map(index);

function wordMatch(queryWord: string, word: string): "exact" | "prefix" | null {
  if (word === queryWord) return "exact";
  if (queryWord.length >= PREFIX_MIN && word.startsWith(queryWord)) return "prefix";
  return null;
}

/** Best score this query word earns on a product (0 = no match anywhere). */
function scoreWord(queryWord: string, item: Indexed): number {
  let best = 0;
  for (const f of item.fields) {
    for (const w of f.words) {
      const m = wordMatch(queryWord, w);
      if (m) best = Math.max(best, f.weight + (m === "exact" ? 5 : 0));
    }
  }
  return best;
}

export type SearchHit = { product: Product; score: number };

/** Ranked products for a query; ties keep the catalogue's curated order. */
export function searchProducts(query: string): SearchHit[] {
  const words = tokens(query).map(stem);
  if (!words.length) return [];
  const phrase = normalise(query);
  const hits: SearchHit[] = [];
  for (const item of INDEX) {
    let score = 0;
    let all = true;
    for (const w of words) {
      const s = scoreWord(w, item);
      if (!s) {
        all = false;
        break;
      }
      score += s;
    }
    if (!all) continue;
    if (item.name.startsWith(phrase)) score += 50;
    else if (item.name.includes(phrase)) score += 25;
    hits.push({ product: item.product, score });
  }
  return hits.sort((a, b) => b.score - a.score || INDEX.findIndex((i) => i.product === a.product) - INDEX.findIndex((i) => i.product === b.product));
}

// ───────────────────────── suggestions (overlay) ─────────────────────────

const singular = (label: string) => label.replace(/(Bags|Totes|Backpacks|Briefcases|Messengers|Duffles)$/, (m) => m.slice(0, -1)).toLowerCase();

/** Phrases worth completing to: collection names, materials, styles, colour + style pairs that exist. */
const PHRASES: string[] = (() => {
  const set = new Set<string>();
  for (const p of products) {
    set.add(p.name.toLowerCase());
    set.add(p.material.toLowerCase());
    const collection = p.eyebrow.split("—")[1]?.trim().toLowerCase().replace(/^the /, "");
    const isCollection = collection && !["new arrival", "new in", "bestseller", "limited edition", "online exclusive"].includes(collection);
    if (isCollection) set.add(collection);
    for (const s of p.styles) {
      set.add(STYLE_LABELS[s].toLowerCase());
      if (isCollection) set.add(`${collection} ${singular(STYLE_LABELS[s])}`);
      for (const c of p.colours) set.add(`${c.name.toLowerCase()} ${singular(STYLE_LABELS[s])}`);
    }
    for (const c of p.colours) set.add(c.name.toLowerCase());
  }
  return [...set];
})();

/** Completions where every typed word starts a word of the phrase, best (starts-with, shortest) first. */
export function suggestPhrases(query: string, limit = 3): string[] {
  const q = normalise(query);
  const qWords = q.split(" ").filter(Boolean);
  if (q.length < PREFIX_MIN || !qWords.length) return [];
  return PHRASES.filter((phrase) => {
    const words = normalise(phrase).split(" ");
    return qWords.every((qw) => words.some((w) => w.startsWith(qw) || stem(w).startsWith(stem(qw))));
  })
    .filter((phrase) => normalise(phrase) !== q)
    .sort((a, b) => Number(normalise(b).startsWith(q)) - Number(normalise(a).startsWith(q)) || a.length - b.length || a.localeCompare(b))
    .slice(0, limit);
}

export type CollectionLink = { label: string; detail: string; href: string };

/** Where a bag style can be browsed: Bags lists every bag style, Women/Men list their own. */
function styleHref(style: ProductStyle): string {
  for (const slug of ["bags", "women", "men"] as const) {
    const cfg = getCategory(slug);
    if (cfg?.collection.config.types.some((t) => t.key === style)) return `${cfg.path}?type=${style}#collection`;
  }
  return `/search?q=${encodeURIComponent(STYLE_LABELS[style])}`;
}

const COLLECTIONS: (CollectionLink & { keywords: string })[] = [
  { label: "Women", detail: "Category", href: "/women", keywords: "women womens woman her ladies" },
  { label: "Men", detail: "Category", href: "/men", keywords: "men mens man him" },
  { label: "Bags", detail: "Category", href: "/bags", keywords: "bags bag handbags" },
  { label: "New Arrival", detail: "Collection", href: "/new-arrivals", keywords: "new arrival arrivals latest" },
  { label: "The Weekend Edit", detail: "Bags · Edit", href: "/bags?edit=weekend#collection", keywords: "weekend edit weekender travel" },
  { label: "The Charter", detail: "Bags · Edit", href: "/bags?edit=charter#collection", keywords: "charter" },
  ...(Object.keys(STYLE_LABELS) as ProductStyle[])
    .filter((s) => products.some((p) => p.styles.includes(s)))
    .map((s) => {
      const href = styleHref(s);
      const where = href.startsWith("/bags") ? "Bags" : href.startsWith("/women") ? "Women" : href.startsWith("/men") ? "Men" : "Search";
      return { label: STYLE_LABELS[s], detail: where, href, keywords: STYLE_LABELS[s] };
    }),
];

/** Categories, edits and filtered style views whose words start with every typed word. */
export function suggestCollections(query: string, limit = 3): CollectionLink[] {
  const qWords = tokens(query).map(stem);
  if (!qWords.length || normalise(query).length < 2) return [];
  return COLLECTIONS.filter((c) => {
    const words = tokens(`${c.label} ${c.keywords}`).map(stem);
    return qWords.every((qw) => words.some((w) => w === qw || (qw.length >= PREFIX_MIN && w.startsWith(qw))));
  })
    .slice(0, limit)
    .map(({ label, detail, href }) => ({ label, detail, href }));
}

// ───────────────────────── highlighting + spelling ─────────────────────────

export type Segment = { text: string; match: boolean };

/** Split `text` so the parts the user typed (word starts matching a query word) can be styled differently. */
export function highlight(text: string, query: string): Segment[] {
  const qWords = normalise(query).split(" ").filter(Boolean);
  if (!qWords.length) return [{ text, match: false }];
  const out: Segment[] = [];
  const push = (t: string, match: boolean) => {
    if (!t) return;
    const last = out[out.length - 1];
    if (last && last.match === match) last.text += t;
    else out.push({ text: t, match });
  };
  for (const part of text.split(/(\s+)/)) {
    const norm = [...part].map((ch) => normalise(ch) || ch).join("");
    const len = Math.max(0, ...qWords.filter((q) => norm.startsWith(q)).map((q) => q.length));
    push(part.slice(0, len), true);
    push(part.slice(len), false);
  }
  return out;
}

const VOCAB = [...new Set(PHRASES.flatMap((p) => normalise(p).split(" ")).filter((w) => w.length >= 4))];

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** "Did you mean …" for a zero-result query: each unknown word swapped for its nearest catalogue word (≤ 2 edits). */
export function spellingSuggestion(query: string): string | null {
  const words = normalise(query).split(" ").filter(Boolean);
  let changed = false;
  const fixed = words.map((w) => {
    if (w.length < 4 || VOCAB.includes(w)) return w;
    let best: { word: string; d: number } | null = null;
    for (const v of VOCAB) {
      const d = distance(w, v);
      if (d <= 2 && (!best || d < best.d)) best = { word: v, d };
    }
    if (best) changed = true;
    return best?.word ?? w;
  });
  const suggestion = fixed.join(" ");
  return changed && searchProducts(suggestion).length ? suggestion : null;
}

// ───────────────────────── recent searches ─────────────────────────

const RECENT_KEY = "coach.search.recent.v1";
export const RECENT_MAX = 5;

export function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function saveRecent(query: string): string[] {
  const q = query.trim().replace(/\s+/g, " ");
  if (!q) return readRecent();
  const next = [q, ...readRecent().filter((r) => normalise(r) !== normalise(q))].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — recent searches just won't persist */
  }
  return next;
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

// ───────────────────────── designed defaults ─────────────────────────

/** Figma "Popular" chips (96:291). "Gifts" has no gifting data — it opens New Arrival. */
export const POPULAR: { label: string; href: string }[] = [
  { label: "The Tabby", href: "/search?q=tabby" },
  { label: "Backpacks", href: "/search?q=backpacks" },
  { label: "Cargo Canvas", href: "/search?q=cargo%20canvas" },
  { label: "Crossbody", href: "/search?q=crossbody" },
  { label: "Gifts", href: "/new-arrivals" },
];

/** Figma "Trending now" (96:304): Quilted Tabby 20, Charter Backpack, Burnished Duffle. */
export const TRENDING_IDS = ["quilted-tabby-20", "charter-backpack", "burnished-duffle"];

/** Figma "Results — None" (96:360) routes. */
export const NO_RESULT_ROUTES: { label: string; href: string }[] = [
  { label: "Shoulder Bags", href: styleHref("shoulder-bags") },
  { label: "The Tabby", href: "/search?q=tabby" },
  { label: "Totes", href: styleHref("totes") },
];

// ───────────────────────── results page collection ─────────────────────────

/**
 * Figma "Search — Desktop 1440" (95:1268): All · For Her · For Him chips and "Sort: Relevance" — no type chips or
 * Filters drawer. Every bag style stays valid in the URL (hidden), so shared links keep working.
 */
export const SEARCH_COLLECTION: CollectionConfig = {
  audiences: [
    { key: "her", label: "For Her", category: "women", noun: "women’s pieces" },
    { key: "him", label: "For Him", category: "men", noun: "men’s pieces" },
  ],
  types: (Object.keys(STYLE_LABELS) as ProductStyle[]).map((key) => ({ key, label: STYLE_LABELS[key], hidden: true })),
  prices: getCategory("women")!.collection.config.prices,
  sorts: [
    { key: "featured", label: "Sort: Relevance" },
    { key: "newest", label: "Sort: Newest" },
    { key: "price-asc", label: "Sort: Price, Low to High" },
    { key: "price-desc", label: "Sort: Price, High to Low" },
  ],
  defaultSort: "featured",
  pageSize: { desktop: 8, mobile: 6 },
  grid: "four-medium",
  empty: {
    title: "Nothing Matches — Yet.",
    body: "No {summary} for this search. Remove the filter to see every result.",
    summary: "phrase",
    fallbackBody: "Nothing for this search right now.",
    style: "card",
    secondary: { kind: "link", label: "Start a new search", href: "/search" },
  },
};
