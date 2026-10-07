import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * Figma "404 / Content" stage (101:346) and the 500 / Offline card stage (101:412 / 101:432): a blob, a large pale glyph
 * ("404", "500", "···") and the Petal Chain Bag tilted 12°. `size`: "page" = 320×256 desktop (240×192 on mobile),
 * "card" = 240×192 everywhere.
 */
export function ErrorStage({ glyph, size }: { glyph: string; size: "page" | "card" }) {
  const page = size === "page";
  const dots = glyph === "···";
  return (
    <div aria-hidden="true" className={`relative h-[192px] w-[240px] shrink-0 ${page ? "desk:h-[256px] desk:w-[320px]" : ""}`}>
      <span className="absolute inset-0 rounded-[50%] bg-blob" />
      <span
        className={`type-display-xl absolute top-[21.4%] whitespace-nowrap text-[110px] leading-none tracking-[-0.01em] text-line ${page ? "desk:text-[150px]" : ""} ${
          dots ? "left-[33.1%]" : "left-[12.5%] desk:left-[12.97%]"
        }`}
      >
        {glyph}
      </span>
      <span className="absolute left-[15.5%] top-[22%] h-[78.1%] w-[62.5%] rotate-12">
        <SafeImage src="/images/home/bag-bow-pink.png" alt="" fill sizes="200px" className="object-contain" />
      </span>
    </div>
  );
}

/** Shared copy block for every error state: eyebrow, title, body, then actions. */
export function ErrorState({
  glyph,
  size,
  eyebrow,
  title,
  body,
  children,
  headingLevel = 1,
  card = false,
}: {
  glyph: string;
  size: "page" | "card";
  eyebrow: string;
  title: string;
  body: ReactNode;
  children?: ReactNode;
  headingLevel?: 1 | 2;
  /** White card around it (Figma 500 / Offline). */
  card?: boolean;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className={`flex w-full flex-col items-center gap-4 text-center ${card ? "rounded-[24px] bg-surface px-6 py-12" : "desk:gap-5"}`}>
      <ErrorStage glyph={glyph} size={size} />
      <p className="type-eyebrow text-accent-deep">{eyebrow}</p>
      <H
        tabIndex={-1}
        data-error-heading
        className={`type-product-mobile text-ink focus:outline-none ${size === "page" ? "desk:type-product" : ""}`}
      >
        {title}
      </H>
      <p className={`type-body max-w-[326px] text-ink-muted ${size === "page" ? "desk:max-w-[520px]" : ""}`}>{body}</p>
      {children}
    </div>
  );
}
