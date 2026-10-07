"use client";

import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { HeartIcon } from "./Icons";

/** Figma "Wishlist Button" (18:340) — Default / Hover / Saved (filled accent-deep heart). */
export function WishlistButton({ productId, size = 40, className = "" }: { productId: string; size?: number; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      style={{ width: size, height: size }}
      // One text colour at a time — with both classes present, `text-ink` won and saved hearts rendered black.
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface transition-colors duration-150 hover:bg-blob ${
        saved ? "text-accent-deep" : "text-ink"
      } ${className}`}
    >
      <HeartIcon size={20} filled={saved} />
    </button>
  );
}
