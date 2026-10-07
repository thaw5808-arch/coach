import Link from "next/link";
import { CutoutImage } from "@/components/ui/CutoutImage";
import type { CategoryConfig } from "@/lib/categories";
import type { Product } from "@/lib/products";

/** Figma "Shop by Silhouette" — 4-up tiles on desktop (71:50), horizontal rail on mobile (72:254). Each tile is a filtered view. */
export function SilhouetteTiles({ category, items }: { category: CategoryConfig; items: Product[] }) {
  const { eyebrow, title, tiles } = category.silhouettes;
  return (
    <section aria-labelledby="silhouettes-title" className="flex flex-col gap-4 pt-12 desk:gap-8 desk:pt-24">
      <div className="flex flex-col items-start gap-1.5 px-4 desk:gap-3 desk:px-0">
        <p className="type-eyebrow text-accent-deep">{eyebrow}</p>
        <h2 id="silhouettes-title" className="type-h1-mobile text-ink desk:type-h1">
          {title}
        </h2>
      </div>
      <ul className="no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 desk:grid desk:grid-cols-4 desk:gap-8 desk:overflow-visible desk:px-0">
        {tiles.map((tile) => {
          const count = items.filter((p) => p.styles.includes(tile.type)).length;
          return (
            <li key={tile.type} className="w-[150px] shrink-0 snap-start desk:w-auto">
              <Link href={`${category.path}?type=${tile.type}#collection`} className="group flex flex-col items-start gap-2.5 desk:gap-4">
                <span className="relative block aspect-square w-full overflow-hidden rounded-pill bg-surface">
                  <span
                    aria-hidden="true"
                    className="absolute left-[13.33%] top-[20%] h-[66.29%] w-[73.33%] rounded-[50%] bg-blob transition-colors duration-200 group-hover:bg-[#e1eaff] desk:left-[15.28%] desk:top-[18.06%] desk:h-[62.78%] desk:w-[69.44%]"
                  />
                  <span className="absolute left-[11.33%] top-[11.33%] size-[77.33%] transition-transform duration-300 ease-out group-hover:-translate-y-1 desk:left-[13.19%] desk:top-[13.19%] desk:size-[73.61%]">
                    <CutoutImage image={tile.image} sizes="(min-width: 1024px) 212px, 116px" />
                  </span>
                </span>
                <span className="flex w-full items-baseline justify-between gap-2">
                  <span className="type-h4 text-ink group-hover:text-accent-deep desk:type-h3">
                    <span className="desk:hidden">{tile.mobileLabel ?? tile.label}</span>
                    <span className="hidden desk:inline">{tile.label}</span>
                  </span>
                  <span className="type-caption hidden text-ink-muted desk:inline">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
