"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";
import { formatPrice } from "@/lib/format";
import { cancelOrder, type Order } from "@/lib/orders";
import { formatCountdown, manageWindowDeadline } from "@/lib/orderStatus";

const INERT_OPTIONS = ["Change delivery address", "Edit initials", "Change delivery method"];

function paymentDescription(order: Order): string {
  return "method" in order.payment ? (order.payment.method === "paypal" ? "your PayPal account" : "Apple Pay") : `your ${order.payment.brand} ending in ${order.payment.last4}`;
}

/** Figma "State / Manage Order — Within 1 Hour" (66:292) + "State / Cancel — Confirmation" (66:315). */
export function ManageOrderPanel({ order, deadlineLabel, onOrderChange }: { order: Order; deadlineLabel: string; onOrderChange: (order: Order) => void }) {
  const [countdown, setCountdown] = useState(() => formatCountdown(manageWindowDeadline(order)));
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(formatCountdown(manageWindowDeadline(order))), 1000);
    return () => window.clearInterval(id);
  }, [order]);

  function handleConfirmCancel() {
    const updated = cancelOrder(order.id);
    if (updated) onOrderChange(updated);
    setCancelOpen(false);
  }

  const pieceCount = order.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div id="manage-order" tabIndex={-1} className="flex w-full flex-col items-start gap-4 rounded-pill bg-surface px-6 py-6 focus:outline-none desk:px-8">
      <p className="type-h3 text-ink">Manage Your Order</p>
      <p className="type-caption text-accent-deep">
        Changes available until {deadlineLabel} today · {countdown} left
      </p>
      <div className="flex w-full flex-col items-start">
        {INERT_OPTIONS.map((label) => (
          <div key={label} aria-disabled="true" className="flex h-14 w-full cursor-not-allowed items-center justify-between border-t border-line text-ink-muted">
            <span className="type-body">{label}</span>
            <ChevronIcon size={16} className="-rotate-90" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="flex h-14 w-full items-center justify-between border-t border-line text-error"
        >
          <span className="type-body">Cancel order</span>
          <ChevronIcon size={16} className="-rotate-90" />
        </button>
      </div>

      <Overlay open={cancelOpen} onClose={() => setCancelOpen(false)} shape="center" label="Cancel this order">
        <div className="flex w-[90vw] max-w-[456px] flex-col items-start gap-4 p-10">
          <p className="type-h3 text-ink">Cancel This Order?</p>
          <p className="type-body text-ink-muted">
            {pieceCount === 1 ? "Your piece" : `Your ${pieceCount} pieces`} will be released and {formatPrice(order.total)} refunded to {paymentDescription(order)} within
            3–5 business days.
          </p>
          <div className="flex w-full flex-col items-start gap-4 pt-2 desk:flex-row desk:items-center">
            <Button variant="primary" showArrow={false} onClick={() => setCancelOpen(false)}>
              Keep my order
            </Button>
            <button type="button" onClick={handleConfirmCancel} className="type-body py-3 text-error underline decoration-from-font">
              Yes, cancel order
            </button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}
