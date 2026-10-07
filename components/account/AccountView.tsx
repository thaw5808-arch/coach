"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath, useSession } from "@/lib/auth/SessionContext";
import { ACCOUNT_TABS, AccountDashboard, type AccountTab } from "./AccountDashboard";
import { SignedOutView } from "./SignedOutView";

const isTab = (v: string | null): v is AccountTab => ACCOUNT_TABS.some((t) => t.key === v);

/** /account — signed-out (93:30 / 93:131) or the signed-in dashboard (94:176). `?next=` returns after auth; `?tab=` picks a section. */
export function AccountView() {
  const { hydrated, session, signOut } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  // Only same-site paths are honoured — `?next=https://evil.com` or `//evil.com` falls back to the dashboard.
  const next = rawNext ? safeNextPath(rawNext, "") : "";
  const tabParam = params.get("tab");
  const tab: AccountTab = isTab(tabParam) ? tabParam : "overview";
  const [notice, setNotice] = useState<string | null>(null);
  const redirecting = useRef(false);

  // Already signed in (or just signed in) with a valid `next` → go there.
  useEffect(() => {
    if (!hydrated || !session || !next || redirecting.current) return;
    redirecting.current = true;
    router.replace(next);
  }, [hydrated, session, next, router]);

  const setTab = useCallback(
    (t: AccountTab) => {
      const qs = t === "overview" ? "" : `?tab=${t}`;
      window.history.pushState(null, "", `/account${qs}`);
      window.scrollTo({ top: 0 });
    },
    [],
  );

  const handleSignOut = useCallback(() => {
    signOut();
    setNotice("You’re signed out. Your bag is still here.");
    window.history.replaceState(null, "", "/account");
  }, [signOut]);

  const shell = "mx-auto w-full max-w-[1440px] px-4 desk:px-[clamp(24px,6.667vw,96px)]";

  if (!hydrated || (session && next)) {
    return <div className={`${shell} min-h-[70vh]`} aria-busy="true" />;
  }

  return (
    <div className={shell}>
      {session ? (
        <AccountDashboard tab={tab} onTabChange={setTab} onSignOut={handleSignOut} />
      ) : (
        <SignedOutView
          notice={notice}
          // `?mode=create` (e.g. from the wishlist banner's "Create account") opens the registration form.
          startCreate={params.get("mode") === "create"}
          onAuthenticated={() => {
            setNotice(null);
            if (!next) window.scrollTo({ top: 0 });
          }}
        />
      )}
    </div>
  );
}
