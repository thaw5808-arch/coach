"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckoutSteps } from "@/components/ui/CheckoutSteps";
import { BackIcon, LockIcon } from "@/components/ui/Icons";

const STEP_BY_PATH: Record<string, 1 | 2 | 3> = {
  "/checkout/delivery": 2,
  "/checkout/payment": 3,
};

/** Figma "Checkout Header" (50:161) — distraction-free: wordmark, steps, secure indicator. */
export function CheckoutHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const step = STEP_BY_PATH[pathname] ?? 2;

  return (
    <header className="relative z-20">
      <div className="mx-auto hidden h-20 max-w-[1440px] items-center px-[clamp(24px,6.667vw,96px)] desk:flex">
        <div className="flex w-full items-center justify-between">
          <div className="w-[240px] shrink-0">
            <Link href="/" className="type-logo text-ink" aria-label="COACH home">
              COACH
            </Link>
          </div>
          <CheckoutSteps step={step} />
          <div className="flex w-[240px] shrink-0 items-center justify-end gap-2">
            <span className="text-accent-deep">
              <LockIcon size={16} />
            </span>
            <span className="type-caption text-ink">Secure checkout</span>
          </div>
        </div>
      </div>

      <div className="flex h-[60px] items-center justify-between px-4 desk:hidden">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="flex size-11 items-center justify-center text-ink">
          <BackIcon size={20} />
        </button>
        <Link href="/" className="type-logo-mobile text-ink" aria-label="COACH home">
          COACH
        </Link>
        <span className="flex size-11 items-center justify-center text-accent-deep" aria-hidden="true">
          <LockIcon size={20} />
        </span>
      </div>

      <div className="px-4 pt-4 desk:hidden">
        <CheckoutSteps step={step} />
      </div>
    </header>
  );
}
