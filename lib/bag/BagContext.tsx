"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProductById } from "@/lib/products";
import { getPromoByCode, validatePromo, type PromoResult } from "@/lib/promos";

export type BagLine = { productId: string; colour?: string; quantity: number; initials?: string; finish?: string };
export type Gift = { wrapped: boolean; note: string };

type BagContextValue = {
  lines: BagLine[];
  savedForLater: BagLine[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  gift: Gift;
  add: (productId: string, colour?: string, quantity?: number, personalise?: { initials?: string; finish?: string }) => void;
  remove: (productId: string, colour?: string) => void;
  restoreLine: (line: BagLine, index: number) => void;
  setQuantity: (productId: string, quantity: number, colour?: string) => void;
  clear: () => void;
  moveToSaved: (productId: string, colour?: string) => void;
  moveToBag: (productId: string, colour?: string) => void;
  applyPromo: (code: string) => PromoResult;
  removePromo: () => void;
  setGiftWrapped: (wrapped: boolean) => void;
  setGiftNote: (note: string) => void;
};

const STORAGE_KEY = "coach.bag.v1";
const BagContext = createContext<BagContextValue | null>(null);
const same = (a: BagLine, id: string, colour?: string) => a.productId === id && a.colour === colour;

type PersistedState = { lines: BagLine[]; savedForLater: BagLine[]; promoCode: string | null; gift: Gift };

function isBagLine(l: unknown): l is BagLine {
  return !!l && typeof l === "object" && typeof (l as BagLine).productId === "string" && (l as BagLine).quantity > 0;
}

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [savedForLater, setSavedForLater] = useState<BagLine[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [gift, setGift] = useState<Gift>({ wrapped: false, note: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Legacy shape: a bare array of lines.
          setLines(parsed.filter(isBagLine));
        } else if (parsed && typeof parsed === "object") {
          const state = parsed as Partial<PersistedState>;
          if (Array.isArray(state.lines)) setLines(state.lines.filter(isBagLine));
          if (Array.isArray(state.savedForLater)) setSavedForLater(state.savedForLater.filter(isBagLine));
          if (typeof state.promoCode === "string") setPromoCode(state.promoCode);
          if (state.gift && typeof state.gift === "object") setGift({ wrapped: !!state.gift.wrapped, note: typeof state.gift.note === "string" ? state.gift.note : "" });
        }
      }
    } catch {
      /* corrupted or unavailable storage — start with an empty bag */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: PersistedState = { lines, savedForLater, promoCode, gift };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — bag still works for this session */
    }
  }, [lines, savedForLater, promoCode, gift, hydrated]);

  const add = useCallback((productId: string, colour?: string, quantity = 1, personalise?: { initials?: string; finish?: string }) => {
    setLines((prev) =>
      prev.some((l) => same(l, productId, colour))
        ? prev.map((l) => (same(l, productId, colour) ? { ...l, quantity: l.quantity + quantity, ...personalise } : l))
        : [...prev, { productId, colour, quantity, ...personalise }],
    );
  }, []);

  const remove = useCallback((productId: string, colour?: string) => {
    setLines((prev) => prev.filter((l) => !same(l, productId, colour)));
  }, []);

  /** Re-insert a just-removed line at its original index (undo). */
  const restoreLine = useCallback((line: BagLine, index: number) => {
    setLines((prev) => {
      if (prev.some((l) => same(l, line.productId, line.colour))) return prev;
      const next = [...prev];
      next.splice(Math.max(0, Math.min(index, next.length)), 0, line);
      return next;
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number, colour?: string) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => !same(l, productId, colour)) : prev.map((l) => (same(l, productId, colour) ? { ...l, quantity } : l)),
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setPromoCode(null);
    setGift({ wrapped: false, note: "" });
  }, []);

  const moveToSaved = useCallback((productId: string, colour?: string) => {
    setLines((prev) => {
      const line = prev.find((l) => same(l, productId, colour));
      if (!line) return prev;
      setSavedForLater((saved) => (saved.some((l) => same(l, productId, colour)) ? saved : [...saved, { ...line, quantity: 1 }]));
      return prev.filter((l) => !same(l, productId, colour));
    });
  }, []);

  const moveToBag = useCallback((productId: string, colour?: string) => {
    setSavedForLater((prev) => {
      const line = prev.find((l) => same(l, productId, colour));
      if (!line) return prev;
      setLines((bagLines) =>
        bagLines.some((l) => same(l, productId, colour))
          ? bagLines.map((l) => (same(l, productId, colour) ? { ...l, quantity: l.quantity + 1 } : l))
          : [...bagLines, line],
      );
      return prev.filter((l) => !same(l, productId, colour));
    });
  }, []);

  const applyPromo = useCallback((code: string): PromoResult => {
    const result = validatePromo(code);
    if (result.ok) setPromoCode(result.promo.code);
    return result;
  }, []);

  const removePromo = useCallback(() => setPromoCode(null), []);
  const setGiftWrapped = useCallback((wrapped: boolean) => setGift((g) => ({ ...g, wrapped })), []);
  const setGiftNote = useCallback((note: string) => setGift((g) => ({ ...g, note })), []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (getProductById(l.productId)?.price ?? 0) * l.quantity, 0),
    [lines],
  );

  const discount = useMemo(() => {
    const promo = promoCode ? getPromoByCode(promoCode) : undefined;
    return promo?.type === "percent" ? Math.round(subtotal * (promo.value / 100) * 100) / 100 : 0;
  }, [promoCode, subtotal]);

  const total = Math.max(0, subtotal - discount);

  const value = useMemo(
    () => ({
      lines,
      savedForLater,
      hydrated,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal,
      discount,
      total,
      promoCode,
      gift,
      add,
      remove,
      restoreLine,
      setQuantity,
      clear,
      moveToSaved,
      moveToBag,
      applyPromo,
      removePromo,
      setGiftWrapped,
      setGiftNote,
    }),
    [
      lines,
      savedForLater,
      hydrated,
      subtotal,
      discount,
      total,
      promoCode,
      gift,
      add,
      remove,
      restoreLine,
      setQuantity,
      clear,
      moveToSaved,
      moveToBag,
      applyPromo,
      removePromo,
      setGiftWrapped,
      setGiftNote,
    ],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside <BagProvider>");
  return ctx;
}
