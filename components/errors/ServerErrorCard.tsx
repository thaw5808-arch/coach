"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "./ErrorState";

/**
 * Figma "Error — 500" (101:408). Shared by every error boundary. Never shows the error itself to people — in
 * development it goes to the console only.
 */
export function ServerErrorCard({ error, retry, headingLevel = 1 }: { error: Error & { digest?: string }; retry: () => void; headingLevel?: 1 | 2 }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error("[COACH] Caught by an error boundary:", error);
    window.dispatchEvent(new Event("coach:error-shown"));
    // Move focus to the heading so keyboard and screen-reader users land on the message.
    ref.current?.querySelector<HTMLElement>("[data-error-heading]")?.focus();
  }, [error]);

  return (
    <div ref={ref} role="alert" data-error-500 className="mx-auto w-full max-w-[576px] px-4 py-16 desk:py-24">
      <ErrorState
        glyph="500"
        size="card"
        card
        headingLevel={headingLevel}
        eyebrow="SOMETHING WENT WRONG"
        title="We’re Mending This"
        body="A seam came loose on our side. Try again in a moment — or Client Care can place your order by phone."
      >
        <div className="flex flex-col items-center gap-3">
          <Button onClick={() => retry()}>Try again</Button>
          <Button href="/client-care#contact" variant="text">
            Contact Client Care
          </Button>
        </div>
      </ErrorState>
    </div>
  );
}
