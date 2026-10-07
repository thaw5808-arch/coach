import Link from "next/link";

/* Figma "Nav Item" (13:50): Default → ink; Hover → accent-deep; Active → blob pill + accent-deep. */
export function navItemClass(active: boolean, open = false) {
  return `type-nav rounded-pill px-4 py-[9px] uppercase transition-colors duration-200 hover:text-accent-deep ${
    active ? "bg-blob text-accent-deep" : open ? "text-accent-deep" : "text-ink"
  }`;
}

export function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={navItemClass(active)}>
      {label}
    </Link>
  );
}
