import type { ReactNode } from "react";

/** Figma "Gallery Thumbnail" (27:358) — Default / Hover / Selected. */
export function GalleryThumbnail({
  selected = false,
  size = 88,
  onClick,
  label,
  children,
}: {
  selected?: boolean;
  size?: number;
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={selected}
      style={{ width: size, height: size }}
      className={`relative shrink-0 overflow-hidden rounded-pill bg-surface transition-colors ${
        selected ? "border border-ink" : "border border-transparent hover:border-line"
      }`}
    >
      {children}
    </button>
  );
}
