"use client";

import { usePathname } from "next/navigation";

/**
 * Development only (not rendered in production builds): visiting /__test/global-error throws inside the root
 * layout, which only app/global-error.tsx can catch.
 */
export function DevErrorTrigger() {
  const pathname = usePathname();
  if (pathname === "/__test/global-error") throw new Error("Dev-only test: root layout failure");
  return null;
}
