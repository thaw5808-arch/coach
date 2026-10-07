import Link from "next/link";
import type { ComponentProps } from "react";
import { isPendingRoute } from "@/lib/routes";

/**
 * next/link that skips prefetching (a) routes whose pages don't exist yet (see lib/routes.ts) and (b) search
 * results: they're per-query and dynamic, and in production builds the router's prefetch of a query with an
 * encoded space (`/search?q=cargo%20canvas`) never settles — leaving a request open on every page with the chips.
 */
export default function SiteLink(props: ComponentProps<typeof Link>) {
  const href = typeof props.href === "string" ? props.href : (props.href.pathname ?? "");
  const noPrefetch = isPendingRoute(href) || href === "/search" || href.startsWith("/search?");
  return <Link {...props} prefetch={noPrefetch ? false : props.prefetch} />;
}
