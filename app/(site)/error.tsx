"use client";

import { ServerErrorCard } from "@/components/errors/ServerErrorCard";

/** A page inside the site failed: the 500 card replaces only that page — header and footer keep working. */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ServerErrorCard error={error} retry={retry} />;
}
