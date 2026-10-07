"use client";

import { ServerErrorCard } from "@/components/errors/ServerErrorCard";

/** A group layout itself failed (so its header can't be trusted): wordmark + the 500 card. */
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex h-20 max-w-[1440px] items-end px-4 desk:px-[clamp(24px,6.667vw,96px)]">
        <a href="/" className="type-logo">
          COACH
        </a>
      </div>
      <main id="main">
        <ServerErrorCard error={error} retry={retry} />
      </main>
    </div>
  );
}
