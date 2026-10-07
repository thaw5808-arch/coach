import Link from "@/components/ui/SiteLink";
import { Checkbox } from "@/components/ui/Checkbox";
import type { FieldKey } from "@/lib/checkout/validation";
import { FormField } from "./FormField";

export function ContactSection({
  email,
  emailOptIn,
  error,
  signedIn,
  onChange,
  onBlur,
  onOptInChange,
}: {
  email: string;
  emailOptIn: boolean;
  error?: string;
  signedIn: boolean;
  onChange: (value: string) => void;
  onBlur: (field: FieldKey) => void;
  onOptInChange: (optIn: boolean) => void;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-5">
      <div className="flex w-full items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <p className="type-eyebrow text-accent-deep">01</p>
          <p className="type-h3 text-ink">Contact</p>
        </div>
        {!signedIn && (
          <p className="type-caption flex gap-1.5 text-ink-muted">
            Have an account?
            <Link href="/account?next=/checkout/delivery" className="text-ink underline decoration-from-font">
              Sign in
            </Link>
          </p>
        )}
      </div>

      <FormField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onBlur("email")}
        error={error}
        disabled={signedIn}
      />

      <div className="flex items-center gap-1">
        <Checkbox checked={emailOptIn} onChange={onOptInChange} label="Email me early access to new chapters and private events" />
        <p className="type-caption text-ink">Email me early access to new chapters and private events</p>
      </div>
    </div>
  );
}
