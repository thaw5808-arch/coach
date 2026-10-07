"use client";

import "@fontsource/bona-nova/400.css";
import "@fontsource/bona-nova/400-italic.css";
import "@fontsource/bona-nova/700.css";
import "@fontsource/bona-nova-sc/400.css";
import "@fontsource/bona-nova-sc/700.css";
import "./globals.css";
import { ServerErrorCard } from "@/components/errors/ServerErrorCard";

/**
 * The root layout itself failed. Replaces the whole document, so it brings its own <html>/<body>, fonts and styles
 * (and no providers — the card only needs plain links and the retry).
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="bg-bg">
        <title>Something went wrong | COACH</title>
        <div className="mx-auto flex h-20 max-w-[1440px] items-end px-4 desk:px-[clamp(24px,6.667vw,96px)]">
          <a href="/" className="type-logo">
            COACH
          </a>
        </div>
        <main id="main">
          <ServerErrorCard error={error} retry={retry} />
        </main>
      </body>
    </html>
  );
}
