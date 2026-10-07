"use client";

import { useEffect, useState } from "react";

/**
 * Stays broken until the 500 card has actually been shown (React re-renders once by itself after an error, which
 * would otherwise "recover" before anyone sees the card). The card announces itself with `coach:error-shown`.
 * Browser-only: resets on every full page load.
 */
let armed = true;
if (typeof window !== "undefined") window.addEventListener("coach:error-shown", () => (armed = false));

export function ThrowOnce() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted && armed) throw new Error("Dev-only test: a section failed to render");
  return (
    <div data-recovered={mounted || undefined} className="mx-auto min-h-[50vh] max-w-[576px] px-4 py-24 text-center">
      {mounted && (
        <>
          <p className="type-eyebrow text-accent-deep">RECOVERED</p>
          <h1 className="type-h1 text-ink">The page rendered on retry.</h1>
        </>
      )}
    </div>
  );
}
