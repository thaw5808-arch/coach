"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/ui/Icons";

const COOLDOWN_SECONDS = 30;

/** Figma "Resend" + "Toast" (Order Confirmation States 66:328) — simulated send, rate-limited. */
export function ResendEmail({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!showToast) return;
    const id = window.setTimeout(() => setShowToast(false), 3000);
    return () => window.clearTimeout(id);
  }, [showToast]);

  function handleResend() {
    if (sending || cooldown > 0) return;
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setShowToast(true);
      setCooldown(COOLDOWN_SECONDS);
    }, 700);
  }

  return (
    <div className="flex w-full flex-col items-start gap-3">
      {showToast && (
        <div role="status" className="flex items-center gap-3 rounded-pill bg-ink py-3.5 pl-4 pr-6 text-surface">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent-deep">
            <CheckIcon size={14} />
          </span>
          <p className="type-body">Confirmation sent again to {email}</p>
        </div>
      )}
      <p className="type-caption flex flex-wrap gap-x-1.5 text-ink-muted">
        <span>Didn’t receive it? Check spam or</span>
        {cooldown > 0 ? (
          <span>resend available in {cooldown}s</span>
        ) : (
          <button type="button" onClick={handleResend} disabled={sending} className="text-ink underline decoration-from-font disabled:opacity-50">
            {sending ? "Sending…" : "resend the email"}
          </button>
        )}
      </p>
    </div>
  );
}
