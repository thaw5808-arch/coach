import type { ButtonHTMLAttributes } from "react";
import { CloseIcon, NextIcon, PrevIcon, ShareIcon, ZoomIcon } from "./Icons";

const ICONS = { prev: PrevIcon, next: NextIcon, zoom: ZoomIcon, share: ShareIcon, close: CloseIcon };

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: keyof typeof ICONS;
  label: string;
};

/** Figma "Icon Button" (27:407) — prev / next / zoom / share / close; Default/Hover/Disabled. */
export function IconButton({ icon, label, className = "", disabled, ...props }: IconButtonProps) {
  const Icon = ICONS[icon];
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={`flex size-11 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-blob disabled:opacity-40 disabled:hover:bg-surface ${className}`}
      {...props}
    >
      <Icon size={20} />
    </button>
  );
}
