import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to follow orders, manage saved addresses and keep your wishlist.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-hidden="true" />}>
      <AccountView />
    </Suspense>
  );
}
