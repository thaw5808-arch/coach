import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Iconify streamline-flex-color:shopping-cart-2 — the exact icon used in Figma. */
export function BagIcon({ size = 38, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path fill="#d7e0ff" d="M13.203 3.505a11 11 0 0 1-.767 3.124a1.87 1.87 0 0 1-1.383 1.126c-.64.125-1.611.25-2.928.25a18 18 0 0 1-2.338-.142c-1.104-.142-1.883-1.045-2.06-2.144l-.52-3.213h9.043c.552 0 1.005.449.953.999" />
      <g stroke="#4147d5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}>
        <path d="M13.203 3.505a11 11 0 0 1-.767 3.124a1.87 1.87 0 0 1-1.383 1.126c-.64.125-1.611.25-2.928.25a18 18 0 0 1-2.338-.142c-1.104-.142-1.883-1.045-2.06-2.144l-.52-3.213h9.043c.552 0 1.005.449.953.999" />
        <path d="M11.75 10.506H6.202a2 2 0 0 1-1.974-1.68l-.956-5.89a2 2 0 0 0-1.974-1.68H.75" />
        <path fill="#fff" d="M5.104 12.744a1.12 1.12 0 1 0 0-2.238a1.12 1.12 0 0 0 0 2.238" />
        <path fill="#fff" d="M11.75 12.744a1.12 1.12 0 1 0 0-2.238a1.12 1.12 0 0 0 0 2.238" />
      </g>
    </svg>
  );
}

/** Iconify flowbite:user-solid — the exact icon used in Figma. */
export function AccountIcon({ size = 38, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8m-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4z" />
    </svg>
  );
}

/** Figma icon/search (Nav / Mobile 13:76, node 92:3641) — exact geometry. */
export function SearchIcon({ size = 28, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" {...props}>
      <circle cx="11.9" cy="11.9" r="6.1" stroke="currentColor" strokeWidth={1.8} />
      <line x1="18.1225" y1="16.8497" x2="21.0075" y2="19.7347" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/menu (Nav / Mobile 13:76, node 13:77) — exact geometry. */
export function MenuIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 8H21M3 16H15" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/close (Mobile Menu 103:2702, node 103:2705) — exact geometry. */
export function CloseIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/arrow (Button 13:103, node 13:93) — exact geometry. */
export function ArrowIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <path d="M2 9H15M10.5 13.5L15 9L10.5 4.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma icon/check (Button 13:103, node 34:292) — exact geometry. */
export function CheckIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <path d="M3.375 9.5625L6.75 12.9375L14.625 5.0625" stroke="currentColor" strokeWidth={1.575} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma icon/heart (Wishlist Button 18:340) — exact geometry; filled = Saved state. */
export function HeartIcon({ size = 20, filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 17.0833C10 17.0833 3.75 13.25 2.25 9.41667C1.16667 6.66667 2.83333 3.75 5.75 3.75C7.5 3.75 8.75 4.75 10 6.25C11.25 4.75 12.5 3.75 14.25 3.75C17.1667 3.75 18.8333 6.66667 17.75 9.41667C16.25 13.25 10 17.0833 10 17.0833Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.08333}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma icon/plus (Footer / Mobile accordion, node 103:1415) — exact geometry. */
export function PlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/minus (Accordion Item 27:420, node 27:417) — exact geometry. */
export function MinusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 8H14" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/zoom (Product Detail 29:2, node 27:378) — exact geometry. */
export function ZoomIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth={1.3} />
      <path d="M12.5 12.5L17 17M8.5 6V11M6 8.5H11" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/share (Product Detail 29:2, node 27:390) — exact geometry. */
export function ShareIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M10 3V13M14 6.5L10 3L6 6.5M4 11V16H16V11" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma icon/back (Product Detail Mobile 32:172, node 32:190) — exact geometry. */
export function BackIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M12.8 8H3.2M6.8 11.6L3.2 8L6.8 4.4" stroke="currentColor" strokeWidth={1.12} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma icon/prev (Icon Button 27:365) — exact geometry. */
export function PrevIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M16 10H4M8.5 14.5L4 10L8.5 5.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma icon/next (Icon Button 27:368) — exact geometry. */
export function NextIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M4 10H16M11.5 14.5L16 10L11.5 5.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma icon/remove (Promo Applied chip, Shopping Bag States 45:326) — exact geometry. */
export function RemoveIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth={1.05} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/lock (Checkout Header 50:161) — exact geometry. */
export function LockIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M11 7H5C3.89543 7 3 7.89543 3 9V12C3 13.1046 3.89543 14 5 14H11C12.1046 14 13 13.1046 13 12V9C13 7.89543 12.1046 7 11 7Z" stroke="currentColor" strokeWidth={1.2} />
      <path d="M5.5 7V5C5.5 4.33696 5.76339 3.70107 6.23223 3.23223C6.70107 2.76339 7.33696 2.5 8 2.5C8.66304 2.5 9.29893 2.76339 9.76777 3.23223C10.2366 3.70107 10.5 4.33696 10.5 5V7" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}

/** Figma icon/error (Checkout States 54:177) — exact geometry. */
export function ErrorIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth={1.2} />
      <path d="M9 5.5V9.7M9 12.3V12.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

/** Figma icon/pin (Address autocomplete suggestions, Checkout States 54:177) — exact geometry. */
export function PinIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 14.5C8 14.5 3.5 10.3 3.5 6.8C3.5 5.60653 3.97411 4.46193 4.81802 3.61802C5.66193 2.77411 6.80653 2.3 8 2.3C9.19347 2.3 10.3381 2.77411 11.182 3.61802C12.0259 4.46193 12.5 5.60653 12.5 6.8C12.5 10.3 8 14.5 8 14.5Z" stroke="currentColor" strokeWidth={1.1} />
      <circle cx="8" cy="6.8" r="1.6" stroke="currentColor" strokeWidth={1.1} />
    </svg>
  );
}

/** Figma icon/marker — "active" ring+dot timeline marker (Order Timeline 62:252) — exact geometry. */
export function ActiveMarkerIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="11.25" fill="white" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}

/** Generic info-circle glyph (CVC help trigger, Checkout Payment States 59:133) — not a literal Figma export, matches the surrounding icon weight/style. */
export function InfoIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth={1.2} />
      <path d="M9 8.25V13" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="9" cy="5.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

/** Figma icon/chevron (Select Field 50:102) — exact geometry. */
export function ChevronIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
