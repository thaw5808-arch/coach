import { bags, men, women, type MegaMenuContent } from "@/lib/categories";

/** `menu` = desktop mega-menu panel (Figma "Nav — Women Menu Open" 73:336). Men / Bags plug theirs in the same way. */
export type NavLink = { label: string; href: string; menu?: MegaMenuContent };

/** Primary navigation — order and labels from Figma "Nav / Desktop" (13:51). */
export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "New Arrival", href: "/new-arrivals" },
  { label: "Women", href: "/women", menu: women.menu },
  { label: "Men", href: "/men", menu: men.menu },
  { label: "Bags", href: "/bags", menu: bags.menu },
];

/** Secondary links — Figma "P / Overlay / Mobile Menu" (103:2721). */
export const secondaryNav: NavLink[] = [
  { label: "Account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Find a Store", href: "/the-house#stores" },
  { label: "Client Care", href: "/client-care" },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
