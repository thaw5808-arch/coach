"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "./ErrorState";

/** The designed card (Figma "Error — Offline" 101:428), also used by the dev preview route. */
export function OfflineCard({ onRetry, checking, stillOffline }: { onRetry: () => void; checking?: boolean; stillOffline?: boolean }) {
  return (
    <ErrorState
      glyph="···"
      size="card"
      card
      headingLevel={2}
      eyebrow="YOU’RE OFFLINE"
      title="Connection Lost"
      body="Your bag is saved on this device. We’ll pick up where you left off as soon as you’re back online."
    >
      <Button onClick={onRetry} status={checking ? "loading" : "idle"} aria-busy={checking || undefined}>
        Retry
      </Button>
      <p role="status" className="type-caption min-h-[21px] text-ink-muted">
        {stillOffline ? "Still offline — we’ll reconnect automatically." : ""}
      </p>
    </ErrorState>
  );
}

/**
 * Watches navigator.onLine + online/offline events. Offline → the designed card over the page (nothing underneath is
 * lost: bag, wishlist and checkout live in local/session storage). Back online → it closes by itself and refreshes
 * server data; "Retry" checks with a real request.
 */
export function OfflineNotice() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  const recover = useCallback(() => {
    setOffline(false);
    setStillOffline(false);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!navigator.onLine) setOffline(true);
    const goOffline = () => setOffline(true);
    const goOnline = () => recover();
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [recover]);

  // Focus moves into the card while it's up and comes back afterwards.
  useEffect(() => {
    if (offline) {
      previousFocus.current = document.activeElement;
      panel.current?.querySelector<HTMLElement>("[data-error-heading]")?.focus();
    } else (previousFocus.current as HTMLElement | null)?.focus?.();
  }, [offline]);

  async function retry() {
    setChecking(true);
    try {
      await fetch(`/?online-check=${Date.now()}`, { method: "HEAD", cache: "no-store" });
      recover();
    } catch {
      setStillOffline(true);
    } finally {
      setChecking(false);
    }
  }

  if (!offline) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/30 px-4" data-offline>
      <div ref={panel} role="alertdialog" aria-modal="true" aria-labelledby="offline-title" className="w-full max-w-[576px]">
        <span id="offline-title" className="sr-only">
          You’re offline
        </span>
        <OfflineCard onRetry={retry} checking={checking} stillOffline={stillOffline} />
      </div>
    </div>
  );
}
