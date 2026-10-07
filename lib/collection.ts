import type { CategorySlug, Product, ProductStyle } from "@/lib/products";

/*
 * Shared product-collection model — filter facets, sort, URL (de)serialisation.
 * Used by New Arrival and every category page (Women / Men / Bags) through components/collection.
 */

export type TypeOption = {
  key: ProductStyle;
  label: string;
  /** Hidden from the chip row / filter sheet but still valid in the URL (e.g. mega-menu "Wallets"). */
  hidden?: boolean;
};

export type PriceOption = { key: string; label: string; min?: number; max?: number };

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";
export type SortOption = { key: SortKey; label: string };

export type ColourOption = { name: string; hex: string };

/** A material chip; `matches` lets one chip cover several materials (Bags sheet 92:3283 "Leather"). */
export type MaterialOption = { label: string; matches: string[] };

/** Chip-row audience filter (Bags "For Her" / "For Him", 86:461) — `?for=her`. */
export type AudienceOption = { key: string; label: string; category: CategorySlug; noun: string };

/** A curated edit (Bags "The Weekend Edit") — `?edit=weekend` matches products tagged `tag`. */
export type EditOption = { key: string; label: string; tag: string };

export type CollectionConfig = {
  types: TypeOption[];
  /** Explicit colour list; derived from the products when omitted. */
  colours?: ColourOption[];
  /** Explicit material chips (plain names or grouped options); derived from the products when omitted. */
  materials?: (string | MaterialOption)[];
  /** Optional audience chips shown before the type chips (Bags). */
  audiences?: AudienceOption[];
  /** Optional curated edits reachable by URL / editorial links (not shown as chips). */
  edits?: EditOption[];
  prices: PriceOption[];
  sorts: SortOption[];
  defaultSort: SortKey;
  /** Cards revealed per "Load more" click on each breakpoint. */
  pageSize: { desktop: number; mobile: number };
  /** Desktop grid: 3 × Large cards (New Arrival) or 4 × Medium cards (category pages). */
  grid: "three-large" | "four-medium";
  /** Empty-state copy + secondary CTA. */
  empty: {
    title: string;
    /** Rendered when no filter is active (only possible on a URL with an unknown type). */
    fallbackBody: string;
    /** `{summary}` is replaced with "totes in Petal" (phrase) or "Petal · Glove-tanned Leather · $300+" (list). */
    body: string;
    summary: "phrase" | "list";
    style: "plain" | "card";
    secondary: { kind: "link"; label: string; href: string } | { kind: "notify"; label: string };
  };
};

export type FilterState = {
  audience: string | null;
  edit: string | null;
  type: ProductStyle | null;
  colour: string | null;
  material: string | null;
  price: string | null;
  sort: SortKey;
};

export type FacetKey = "audience" | "edit" | "type" | "colour" | "material" | "price";

export const emptyFacets = { audience: null, edit: null, type: null, colour: null, material: null, price: null } satisfies Omit<FilterState, "sort">;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function colourOptions(config: CollectionConfig, items: Product[], includeSoldOut = false): ColourOption[] {
  if (config.colours) return config.colours;
  // Chips only offer colours you can actually buy; URLs may still name a sold-out one (it then matches nothing).
  const seen = new Map<string, string>();
  for (const p of items) for (const c of p.colours) if ((includeSoldOut || c.available) && !seen.has(c.name)) seen.set(c.name, c.hex);
  return [...seen].map(([name, hex]) => ({ name, hex }));
}

export function materialOptions(config: CollectionConfig, items: Product[]): MaterialOption[] {
  if (config.materials) return config.materials.map((m) => (typeof m === "string" ? { label: m, matches: [m] } : m));
  // Most common first — keeps the sheet's leading chips the ones most likely to return results.
  const counts = new Map<string, number>();
  for (const p of items) counts.set(p.material, (counts.get(p.material) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([m]) => ({ label: m, matches: [m] }));
}

/** Reads + validates filter state from the query string; unknown values are dropped. */
export function parseFilters(params: URLSearchParams, config: CollectionConfig, items: Product[]): FilterState {
  const type = params.get("type");
  const audience = params.get("for");
  const edit = params.get("edit");
  const colour = params.get("colour");
  const material = params.get("material");
  const price = params.get("price");
  const sort = params.get("sort");
  const colourMatch = colour ? colourOptions(config, items, true).find((c) => slugify(c.name) === colour) : undefined;
  const materialMatch = material ? materialOptions(config, items).find((m) => slugify(m.label) === material) : undefined;
  return {
    audience: config.audiences?.find((a) => a.key === audience)?.key ?? null,
    edit: config.edits?.find((e) => e.key === edit)?.key ?? null,
    type: config.types.find((t) => t.key === type)?.key ?? null,
    colour: colourMatch?.name ?? null,
    material: materialMatch?.label ?? null,
    price: config.prices.some((p) => p.key === price) ? price : null,
    sort: config.sorts.find((s) => s.key === sort)?.key ?? config.defaultSort,
  };
}

/** Serialises filter state, preserving any unrelated params already in the URL. */
export function toQueryString(state: FilterState, config: CollectionConfig, base = new URLSearchParams()) {
  const params = new URLSearchParams(base);
  const set = (key: string, value: string | null) => (value ? params.set(key, value) : params.delete(key));
  set("for", state.audience);
  set("edit", state.edit);
  set("type", state.type);
  set("colour", state.colour && slugify(state.colour));
  set("material", state.material && slugify(state.material));
  set("price", state.price);
  set("sort", state.sort === config.defaultSort ? null : state.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function activeFacetCount(state: FilterState) {
  return [state.audience, state.edit, state.type, state.colour, state.material, state.price].filter(Boolean).length;
}

export function applyFilters(items: Product[], state: FilterState, config: CollectionConfig): Product[] {
  const price = config.prices.find((p) => p.key === state.price);
  const audience = config.audiences?.find((a) => a.key === state.audience);
  const edit = config.edits?.find((e) => e.key === state.edit);
  const material = state.material ? materialOptions(config, items).find((m) => m.label === state.material) : undefined;
  const list = items.filter((p) => {
    if (audience && p.category !== audience.category && !p.alsoIn?.includes(audience.category)) return false;
    if (edit && !p.tags.includes(edit.tag)) return false;
    if (state.type && !p.styles.includes(state.type)) return false;
    if (state.colour && !p.colours.some((c) => c.available && c.name === state.colour)) return false;
    if (material && !material.matches.includes(p.material)) return false;
    if (price && ((price.min !== undefined && p.price < price.min) || (price.max !== undefined && p.price > price.max))) return false;
    return true;
  });
  // `items` arrive in the curated "featured" order; every sort is stable against it.
  const sorted = [...list];
  if (state.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (state.sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (state.sort === "newest") sorted.sort((a, b) => Number(b.tags.includes("new-arrival")) - Number(a.tags.includes("new-arrival")));
  return sorted;
}

/** Human summary for the empty state: "totes in Petal at under $250" or "Petal · Totes · Under $250". */
export function describeFilters(state: FilterState, config: CollectionConfig) {
  const typeLabel = config.types.find((t) => t.key === state.type)?.label;
  const price = config.prices.find((p) => p.key === state.price)?.label;
  const audience = config.audiences?.find((a) => a.key === state.audience);
  const edit = config.edits?.find((e) => e.key === state.edit);
  if (config.empty.summary === "list") return [state.colour, state.material, typeLabel, price].filter(Boolean).join(" · ");
  const type = typeLabel?.toLowerCase();
  // "backpacks", "women’s bags" (Bags 92:3539), "totes for her", "pieces from the weekend edit".
  let summary = type ? (audience ? `${type} ${audience.label.toLowerCase()}` : type) : (audience?.noun ?? "pieces");
  if (edit) summary += ` from ${edit.label.replace(/^The /, "the ")}`;
  if (state.material) summary += ` in ${state.material.toLowerCase()}`;
  if (state.colour) summary += `${state.material ? "," : ""} in ${state.colour}`;
  if (price) summary += ` at ${price.replace(/^Under/, "under")}`;
  return summary;
}
