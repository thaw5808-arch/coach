import Link from "@/components/ui/SiteLink";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/Icons";
import { ErrorState } from "./ErrorState";

const CHIPS = [
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "The Tabby", href: "/search?q=tabby" },
  { label: "Client Care", href: "/client-care" },
];

/**
 * Figma "404 / Content" (101:345 desktop, 101:131 mobile). Server-rendered; the search field is a plain GET form to
 * /search, so it works before (or without) JavaScript. `eyebrow` / `title` / `body` let the order and shared-wishlist
 * misses reuse the same design with their own words.
 */
export function NotFoundContent({
  eyebrow = "PAGE NOT FOUND",
  title = "This Chapter Is Missing",
  body = "The page you’re looking for has moved or no longer exists. Let’s get you back to something beautiful.",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-8 desk:px-[clamp(24px,6.667vw,96px)] desk:pb-40 desk:pt-16" data-not-found>
      <ErrorState glyph="404" size="page" eyebrow={eyebrow} title={title} body={body}>
        <div className="flex w-full flex-col items-center gap-3 desk:w-auto desk:flex-row">
          <Button href="/" className="w-full max-w-[358px] desk:w-auto">
            Back to home
          </Button>
          <Button href="/new-arrivals" variant="text">
            Shop new arrivals
          </Button>
        </div>
        <form action="/search" method="get" role="search" className="flex h-[52px] w-full max-w-[480px] items-center gap-3 rounded-[24px] border border-line bg-surface px-5 focus-within:border-[1.5px] focus-within:border-accent-deep">
          <SearchIcon size={38} className="shrink-0 text-ink" aria-hidden="true" />
          <input
            type="search"
            name="q"
            required
            enterKeyHint="search"
            placeholder="Search bags, collections, stores"
            aria-label="Search COACH"
            className="type-body min-w-0 flex-1 text-ellipsis bg-transparent text-ink placeholder:text-ink-muted focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </form>
        <ul className="flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="type-chip flex h-[42px] items-center rounded-pill bg-surface px-6 text-ink hover:bg-blob">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </ErrorState>
    </div>
  );
}
