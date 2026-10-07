"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/SessionContext";

/** The last piece taken off the list — the Wishlist page offers an 8-second Undo for it (Figma "Item — Removed"). */
export type WishlistRemoval = { id: string; index: number; at: number; reason: "removed" | "moved" };

type WishlistContextValue = {
  ids: string[];
  hydrated: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  add: (productIds: string[]) => void;
  remove: (productId: string, reason?: WishlistRemoval["reason"]) => void;
  /** Put a removed piece back where it was. */
  restore: (productId: string, index: number) => void;
  lastRemoval: WishlistRemoval | null;
  dismissRemoval: () => void;
  count: number;
};

const STORAGE_KEY = "coach.wishlist.v1";
const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Device wishlist (localStorage) that also lives on the signed-in account: signing in merges the account's saved
 * pieces with this device's, and every change while signed in is written back — so the list "follows you to every
 * device" (mock: the account registry in lib/auth/SessionContext.tsx). Signing out keeps the device copy.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session, account, hydrated: sessionHydrated, saveWishlist } = useSession();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastRemoval, setLastRemoval] = useState<WishlistRemoval | null>(null);
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds([...new Set(parsed.filter((id): id is string => typeof id === "string"))]);
      }
    } catch {
      /* corrupted or unavailable storage — start with an empty wishlist */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* storage full or blocked — wishlist still works for this session */
    }
  }, [ids, hydrated]);

  // Sign-in: merge the account's list into this device's once per account.
  useEffect(() => {
    if (!hydrated || !sessionHydrated) return;
    if (!session) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === session.email) return;
    mergedFor.current = session.email;
    const fromAccount = account?.wishlist ?? [];
    setIds((prev) => [...new Set([...prev, ...fromAccount])]);
  }, [hydrated, sessionHydrated, session, account?.wishlist]);

  // While signed in, the account mirrors the device list.
  useEffect(() => {
    if (!hydrated || !session || mergedFor.current !== session.email) return;
    if (JSON.stringify(account?.wishlist ?? []) !== JSON.stringify(ids)) saveWishlist(ids);
  }, [ids, hydrated, session, account?.wishlist, saveWishlist]);

  const remove = useCallback((productId: string, reason: WishlistRemoval["reason"] = "removed") => {
    setIds((prev) => {
      const index = prev.indexOf(productId);
      if (index === -1) return prev;
      setLastRemoval({ id: productId, index, at: Date.now(), reason });
      return prev.filter((id) => id !== productId);
    });
  }, []);

  const toggle = useCallback(
    (productId: string) => {
      if (ids.includes(productId)) remove(productId);
      else setIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    },
    [ids, remove],
  );

  const add = useCallback((productIds: string[]) => setIds((prev) => [...new Set([...prev, ...productIds])]), []);

  const restore = useCallback((productId: string, index: number) => {
    setIds((prev) => {
      if (prev.includes(productId)) return prev;
      const next = [...prev];
      next.splice(Math.max(0, Math.min(index, next.length)), 0, productId);
      return next;
    });
    setLastRemoval(null);
  }, []);

  const dismissRemoval = useCallback(() => setLastRemoval(null), []);
  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const value = useMemo(
    () => ({ ids, hydrated, has, toggle, add, remove, restore, lastRemoval, dismissRemoval, count: ids.length }),
    [ids, hydrated, has, toggle, add, remove, restore, lastRemoval, dismissRemoval],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
