"use client";

import { useState, type FormEvent } from "react";
import Link from "@/components/ui/SiteLink";
import { FormField } from "@/components/checkout/FormField";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useSession, validateEmail, validatePassword, PASSWORD_RULE } from "@/lib/auth/SessionContext";

const BENEFITS = [
  { n: "01", title: "Follow every order", body: "Live progress from the atelier to your door." },
  { n: "02", title: "Save your addresses", body: "Check out in a few taps next time." },
  { n: "03", title: "Keep a wishlist", body: "Saved pieces follow you to every device." },
  { n: "04", title: "Early access", body: "First look at new chapters and private events." },
];

const card = "flex w-full flex-col gap-6 rounded-[24px] p-6 desk:flex-1 desk:p-12";

/** Figma "Card / Sign In" (93:352) + "State / Sign In — Error" (94:231) + "State / Forgot Password — Sent" (94:254). */
function SignInCard({ onSignedIn }: { onSignedIn: () => void }) {
  const { signIn, requestPasswordReset } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent">("idle");
  const [resent, setResent] = useState(false);
  const [appleNote, setAppleNote] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    const next = { email: validateEmail(email) ?? undefined, password: password ? undefined : "Please enter your password." };
    setErrors(next);
    setAuthError(null);
    if (next.email || next.password) {
      document.getElementById(next.email ? "signin-email" : "signin-password")?.focus();
      return;
    }
    setStatus("loading");
    const result = await signIn(email, password, remember);
    setStatus("idle");
    if (result.ok) onSignedIn();
    else {
      // Keep the email; clear the password and say the same thing for an unknown email or a wrong password.
      setAuthError(result.error);
      setPassword("");
      document.getElementById("signin-password")?.focus();
    }
  }

  async function handleForgot() {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: "Enter your email and we’ll send a reset link." });
      document.getElementById("signin-email")?.focus();
      return;
    }
    setResetState("sending");
    await requestPasswordReset(email);
    setResetState("sent");
  }

  if (resetState === "sent") {
    return (
      <div className={`${card} items-center gap-4 bg-surface p-6 text-center desk:p-10`} role="status">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-accent-deep font-display text-[18px] font-bold text-surface">
          ✓
        </span>
        <p className="type-badge text-accent-deep">CHECK YOUR INBOX</p>
        <h2 className="type-h1-mobile text-ink desk:type-h1">A Link Is on Its Way</h2>
        <p className="type-body text-ink-muted">We’ve sent a reset link to {email.trim()}. It works for the next 30 minutes.</p>
        <Button
          showArrow={false}
          className="w-full"
          onClick={() => {
            setResetState("idle");
            setResent(false);
          }}
        >
          Back to sign in
        </Button>
        <Button
          variant="text"
          showArrow={false}
          onClick={async () => {
            setResent(false);
            await requestPasswordReset(email);
            setResent(true);
          }}
        >
          Resend the link
        </Button>
        {resent && <p className="type-caption text-accent-deep">Sent again — check your inbox.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${card} items-start bg-surface`} aria-labelledby="signin-title">
      <h2 id="signin-title" className="type-h1-mobile text-ink desk:type-h1">
        Sign In
      </h2>
      <p className="type-body text-ink-muted">Use the email you shop with. We’ll keep you signed in on this device.</p>
      <FormField
        id="signin-email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
        }}
        error={errors.email}
      />
      <FormField
        id="signin-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
        }}
        error={errors.password ?? authError ?? undefined}
      />
      <div className="flex w-full flex-col items-start gap-2 desk:flex-row desk:items-center desk:gap-3">
        <div className="flex items-center gap-3">
          <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
          <span aria-hidden="true" className="type-caption text-ink">
            Keep me signed in
          </span>
        </div>
        <span className="hidden flex-1 desk:block" />
        <Button variant="text" showArrow={false} type="button" onClick={handleForgot} status={resetState === "sending" ? "loading" : "idle"}>
          Forgot password?
        </Button>
      </div>
      <Button type="submit" className="w-full justify-start" status={status === "loading" ? "loading" : "idle"}>
        {status === "loading" ? "Signing in" : "Sign in"}
      </Button>
      {authError && (
        <Button variant="text" type="button" onClick={handleForgot}>
          Reset your password
        </Button>
      )}
      <div className="flex w-full items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="type-caption text-ink-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" type="button" showArrow={false} className="w-full justify-start border border-line" onClick={() => setAppleNote(true)}>
        Continue with Apple
      </Button>
      {appleNote && (
        <p role="status" className="type-caption text-ink-muted">
          Sign in with Apple isn’t available in this preview — use your email above.
        </p>
      )}
    </form>
  );
}

/** Figma "Card / Create Account" (93:388). The registration form itself isn't drawn — it reuses the Sign In card's fields. */
function CreateAccountCard({ onCreated, startOpen = false }: { onCreated: () => void; startOpen?: boolean }) {
  const { createAccount } = useSession();
  const [open, setOpen] = useState(startOpen);
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [optIn, setOptIn] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next = {
      firstName: values.firstName.trim() ? undefined : "Please enter your first name.",
      lastName: values.lastName.trim() ? undefined : "Please enter your last name.",
      email: validateEmail(values.email) ?? undefined,
      password: validatePassword(values.password) ?? undefined,
    };
    setErrors(next);
    const first = (Object.keys(next) as (keyof typeof next)[]).find((k) => next[k]);
    if (first) {
      document.getElementById(`create-${first}`)?.focus();
      return;
    }
    setBusy(true);
    const result = await createAccount({ ...values, emailOptIn: optIn });
    setBusy(false);
    if (result.ok) onCreated();
    else {
      setErrors({ email: result.error });
      document.getElementById("create-email")?.focus();
    }
  }

  return (
    <div className={`${card} items-start bg-blob`}>
      <p className="type-eyebrow text-accent-deep">NEW TO COACH</p>
      <h2 className="type-h1-mobile text-ink desk:type-h1">Create an Account</h2>
      <p className="type-body text-ink-muted">One account for every chapter — free, and it takes less than a minute.</p>
      {!open ? (
        <>
          <ul className="flex w-full flex-col">
            {BENEFITS.map((b, i) => (
              <li key={b.n} className={`flex w-full items-start gap-4 py-4 ${i ? "border-t border-line" : ""}`}>
                <span className="type-badge pt-0.5 text-accent-deep">{b.n}</span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="type-h4 text-ink">{b.title}</span>
                  <span className="type-caption text-ink-muted">{b.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button variant="secondary" aria-expanded={false} aria-controls="create-account-form" onClick={() => setOpen(true)}>
            Create account
          </Button>
        </>
      ) : (
        <form id="create-account-form" onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-start gap-5">
          <div className="flex w-full flex-col gap-5 desk:flex-row">
            <FormField id="create-firstName" label="First name" autoComplete="given-name" value={values.firstName} onChange={set("firstName")} error={errors.firstName} autoFocus />
            <FormField id="create-lastName" label="Last name" autoComplete="family-name" value={values.lastName} onChange={set("lastName")} error={errors.lastName} />
          </div>
          <FormField id="create-email" label="Email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} error={errors.email} />
          <FormField
            id="create-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={set("password")}
            error={errors.password}
            aria-describedby={errors.password ? "create-password-error" : "create-password-hint"}
          />
          {!errors.password && (
            <p id="create-password-hint" className="type-caption -mt-3 text-ink-muted">
              {PASSWORD_RULE}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Checkbox checked={optIn} onChange={setOptIn} label="Early access to new chapters and private events" />
            <span aria-hidden="true" className="type-caption text-ink">
              Early access to new chapters and private events
            </span>
          </div>
          <div className="flex w-full flex-col items-start gap-3 desk:flex-row desk:items-center desk:gap-6">
            <Button type="submit" status={busy ? "loading" : "idle"} className="w-full desk:w-auto">
              Create account
            </Button>
            <Button variant="text" type="button" showArrow={false} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Figma "Account — Desktop 1440" (93:30) / "Mobile 390" (93:131): hero + Sign In / Create Account cards. */
export function SignedOutView({ onAuthenticated, notice, startCreate = false }: { onAuthenticated: () => void; notice?: string | null; startCreate?: boolean }) {
  return (
    <>
      <div className="relative flex flex-col items-start gap-3 pt-6 desk:gap-4 desk:pt-12">
        <Blob className="-top-[142px] right-[-90px] h-[199px] w-[220px] desk:-top-[190px] desk:right-[-254px] desk:h-[359px] desk:w-[397px]" />
        <nav aria-label="Breadcrumb" className="relative z-10">
          <ol className="type-caption flex gap-2">
            <li>
              <Link href="/" className="text-ink-muted hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-muted">
              /
            </li>
            <li aria-current="page" className="text-ink">
              Account
            </li>
          </ol>
        </nav>
        <div className="relative z-10 flex flex-col items-start gap-2">
          <p className="type-eyebrow text-accent-deep">MY COACH</p>
          <h1 className="type-display-mobile text-ink desk:type-display-xl">Welcome Back</h1>
          <p className="type-italic-sm text-accent-deep desk:type-italic">Your orders, addresses and wishlist — in one place.</p>
        </div>
      </div>
      {notice && (
        <p role="status" className="type-caption mt-6 text-accent-deep">
          {notice}
        </p>
      )}
      <div className="flex flex-col items-start gap-4 pb-16 pt-8 desk:flex-row desk:gap-8 desk:pb-32 desk:pt-16">
        <SignInCard onSignedIn={onAuthenticated} />
        <CreateAccountCard onCreated={onAuthenticated} startOpen={startCreate} />
      </div>
    </>
  );
}
