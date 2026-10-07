/**
 * Routes the UI already links to whose pages aren't built yet. Empty since The House (page 15) shipped — every
 * linked page exists; keep the mechanism for future pages.
 * Links to them must not be prefetched — in production every prefetch would 404 on every page.
 * Remove an entry when its page ships; `scripts/audit.ts` reports these as "pending".
 */
export const PENDING_ROUTES: string[] = [];

export function isPendingRoute(href: string) {
  const path = href.split(/[?#]/)[0];
  return PENDING_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
}
