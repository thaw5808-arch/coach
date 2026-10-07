import { Button } from "@/components/ui/Button";

/** Figma "Signed-In Banner" (Order Confirmation States 66:340) — replaces Create Account once signed in. */
export function SignedInBanner() {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-pill bg-surface px-6 py-6 desk:flex-row desk:items-center desk:justify-between desk:px-10">
      <div className="flex flex-col items-start gap-1">
        <p className="type-h4 text-ink">Saved to Your Account</p>
        <p className="type-caption text-ink-muted">Follow progress and download receipts any time.</p>
      </div>
      <Button href="/account" variant="text">
        View in your account
      </Button>
    </div>
  );
}
