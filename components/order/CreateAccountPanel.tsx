"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { FormField } from "@/components/checkout/FormField";
import Link from "@/components/ui/SiteLink";
import { useSession, validatePassword } from "@/lib/auth/SessionContext";
import type { Order } from "@/lib/orders";

/** Figma "Create Account" (Order Confirmation Desktop 63:158) + "State / Create Account — Error & Success" (66:266). */
export function CreateAccountPanel({ order, onAccountCreated }: { order: Order; onAccountCreated: () => void }) {
  const { createAccount } = useSession();
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exists, setExists] = useState(false);

  const error = touched ? validatePassword(password) : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validatePassword(password) || busy) return;
    setBusy(true);
    const a = order.shippingAddress;
    const result = await createAccount({
      email: order.contactEmail,
      firstName: order.firstName,
      lastName: order.lastName,
      password,
      // "This order, your address and your saved pieces are now in one place."
      address: a ? { label: "Home", firstName: a.firstName, lastName: a.lastName, address1: a.address1, address2: a.address2, city: a.city, state: a.state, zip: a.zip, country: a.country } : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setExists(true);
      return;
    }
    setSuccess(true);
    onAccountCreated();
  }

  if (success) {
    return (
      <div className="flex w-full flex-col items-start gap-4 rounded-pill bg-surface px-6 py-8 desk:px-12">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent-deep text-surface">
            <CheckIcon size={14} />
          </span>
          <p className="type-h3 text-ink">Your Account Is Ready</p>
        </div>
        <p className="type-body text-ink-muted">Welcome, {order.firstName}. This order, your address and your saved pieces are now in one place.</p>
        <Button href="/account" variant="secondary" showArrow>
          Go to your account
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-pill bg-surface px-6 py-8 desk:flex-row desk:items-end desk:justify-between desk:gap-12 desk:px-12">
      <div className="flex flex-col items-start gap-3">
        <p className="type-eyebrow text-accent-deep">SAVE FOR NEXT TIME</p>
        <p className="type-h1-mobile text-ink desk:type-h1">Create an Account in One Step</p>
        <p className="type-body text-ink-muted desk:w-[520px]">Follow this order, keep your addresses and save pieces to your wishlist. We already have your email.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-end gap-4 desk:w-auto desk:flex-row">
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched) setTouched(false);
          }}
          onBlur={() => setTouched(true)}
          error={error ?? (exists ? "There’s already an account for this email." : undefined)}
          className="w-full desk:w-[320px]"
        />
        <Button type="submit" showArrow={false} status={busy ? "loading" : "idle"} className="w-full desk:w-auto">
          Create account
        </Button>
      </form>
      {exists && (
        <Link href={`/account?next=${encodeURIComponent(`/order/${order.id}`)}`} className="type-caption text-ink underline decoration-from-font">
          Sign in instead
        </Link>
      )}
    </div>
  );
}
