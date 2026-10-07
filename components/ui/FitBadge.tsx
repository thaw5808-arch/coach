"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Tier = { text: "full" | "compact"; cls: string; stacked?: boolean };

/** Figma badge styles, largest first. 13px eyebrow (Large/Medium cards) → 11px badge (Compact) → tighter tracking. */
const T_EYEBROW = "type-eyebrow px-3 py-1.5";
const T_BADGE = "type-badge px-2 py-1";
const T_TIGHT = "type-badge px-1.5 py-1 tracking-[0.06em]";

const TIERS: Record<"roomy" | "compact", Tier[]> = {
  roomy: [
    { text: "full", cls: T_EYEBROW },
    { text: "compact", cls: T_EYEBROW },
    { text: "compact", cls: T_BADGE },
    { text: "compact", cls: T_TIGHT },
    { text: "compact", cls: T_BADGE, stacked: true },
  ],
  compact: [
    { text: "compact", cls: T_BADGE },
    { text: "compact", cls: T_TIGHT },
    { text: "compact", cls: T_BADGE, stacked: true },
  ],
};

/**
 * Product-card badge that never truncates: it measures the room left of the wishlist heart and steps down
 * through the Figma styles until the label fits; on very narrow cards (≈136px at 320) it drops to a line
 * below the heart instead of clipping. Hidden until measured so it never overlaps the heart.
 */
export function FitBadge({
  full,
  compact,
  variant,
  /** Px reserved on the right for the heart (its inset + width + a gap). */
  reserve,
  /** Left inset, top (Figma position) and the top of the stacked fallback, in px. */
  inset,
  top,
  stackedTop,
}: {
  full: string;
  compact: string;
  variant: "roomy" | "compact";
  reserve: number;
  inset: number;
  top: number;
  stackedTop: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const tiers = TIERS[variant];
  const [tier, setTier] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const well = el?.parentElement;
    if (!el || !well) return;
    const fit = () => {
      const room = well.clientWidth - inset - reserve;
      const stackedRoom = well.clientWidth - inset * 2;
      // Measure each tier on an invisible clone (never touch React's own node) and keep the first that fits.
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;left:0;top:0";
      well.append(probe);
      let chosen = tiers.length - 1;
      for (let i = 0; i < tiers.length; i++) {
        const t = tiers[i];
        probe.className = `${BASE} ${t.cls}`;
        probe.textContent = t.text === "full" ? full : compact;
        if (probe.getBoundingClientRect().width <= (t.stacked ? stackedRoom : room)) {
          chosen = i;
          break;
        }
      }
      probe.remove();
      setTier(chosen);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(well);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [full, compact, tiers, reserve, inset]);

  const t = tiers[tier ?? 0];
  return (
    <span
      ref={ref}
      data-badge
      className={`${BASE} ${t.cls} ${tier === null ? "invisible" : ""}`}
      style={{ left: inset, top: t.stacked ? stackedTop : top }}
    >
      {t.text === "full" ? full : compact}
    </span>
  );
}

const BASE = "absolute whitespace-nowrap rounded-pill bg-surface uppercase text-accent-deep";
