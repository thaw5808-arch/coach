import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCollection, ProductCollectionFallback, type CollectionBlock } from "@/components/collection/ProductCollection";
import { Blob } from "@/components/ui/Blob";
import type { CategoryConfig } from "@/lib/categories";
import { getProductsByType, getProductsInCategory, type Product } from "@/lib/products";
import { SITE_URL, ogImagePath, pageMetadata } from "@/lib/seo";
import { EditorialFeature, PromoPanel } from "./EditorialBlocks";
import { CutoutStage } from "./CutoutStage";
import { SilhouetteTiles } from "./SilhouetteTiles";

export function categoryMetadata(category: CategoryConfig): Metadata {
  // Filtered / sorted views (?type=…&sort=…) all canonicalise to the clean category URL.
  return pageMetadata({
    title: category.seo.title,
    description: category.seo.description,
    path: category.path,
    image: ogImagePath(category.slug),
    imageAlt: `${category.seo.title} — COACH bags on a pale blue stage`,
  });
}

/** Curated "Featured" order first, then any remaining pieces in catalogue order. */
function featuredOrder(items: Product[], featured: string[]) {
  const rank = (p: Product) => {
    const i = featured.indexOf(p.id);
    return i === -1 ? featured.length : i;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

/**
 * Shared category template — Women (08), Men (09), Bags (10). Every section is driven by `lib/categories.ts`.
 * Figma: desktop 71:2 (1440), mobile 72:224 (390).
 */
export function CategoryPage({ category }: { category: CategoryConfig }) {
  const source = category.source ? getProductsByType(category.source.productType) : getProductsInCategory(category.slug);
  const items = featuredOrder(source, category.collection.featured);
  const { hero, collection } = category;

  const blocks: CollectionBlock[] = category.editorials.map((block) => ({
    key: block.key,
    node: block.kind === "feature" ? <EditorialFeature block={block} /> : <PromoPanel block={block} />,
    desktopAfter: block.desktopAfter,
    mobileAfter: block.mobileAfter,
    desktopSpan: 2,
    showAtEnd: block.kind === "promo",
  }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: category.title, item: `${SITE_URL}${category.path}` },
    ],
  };

  return (
    <div className="bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />

      <div className="mx-auto max-w-[1440px] desk:px-[clamp(24px,6.667vw,96px)]">
        {/* Hero — Figma 71:37 / 72:242 */}
        <section className="relative flex flex-col gap-5 px-4 pt-6 desk:flex-row desk:items-center desk:justify-between desk:gap-12 desk:px-0 desk:pt-12">
          <Blob className="-top-[142px] right-[-90px] h-[199px] w-[220px] desk:-top-[190px] desk:right-[-254px] desk:h-[359px] desk:w-[397px]" />
          {/* On mobile the copy column dissolves (display: contents) so the stage can sit between title and intro. */}
          <div className="contents desk:relative desk:z-10 desk:flex desk:min-w-0 desk:max-w-[520px] desk:flex-1 desk:flex-col desk:gap-8">
            <nav aria-label="Breadcrumb" className="relative z-10 order-1">
              <ol className="type-caption flex gap-2">
                <li>
                  <Link href="/" className="text-ink-muted hover:text-ink">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-ink-muted">
                  /
                </li>
                <li aria-current="page" className="text-ink">
                  {category.title}
                </li>
              </ol>
            </nav>
            <div className="relative z-10 order-2 flex flex-col items-start gap-2.5 desk:gap-4">
              <p className="type-eyebrow text-accent-deep">
                <span className="desk:hidden">{hero.eyebrow.mobile}</span>
                <span className="hidden desk:inline">{hero.eyebrow.desktop}</span>
              </p>
              <h1 className="type-display-mobile text-ink desk:type-display-xl">{category.title}</h1>
              <p className="type-italic-sm text-accent-deep desk:type-italic">{hero.tagline}</p>
            </div>
            <p className="type-body relative z-10 order-4 text-ink-muted desk:type-body-lg desk:max-w-[460px]">
              <span className="desk:hidden">{hero.intro.mobile}</span>
              <span className="hidden desk:inline">{hero.intro.desktop}</span>
            </p>
          </div>
          <div className="relative z-10 order-3 overflow-hidden desk:hidden">
            <CutoutStage stage={hero.stage.mobile} eager />
          </div>
          <CutoutStage stage={hero.stage.desktop} className="z-10 hidden w-[min(640px,51.28%)] shrink-0 desk:block" eager />
        </section>

        <SilhouetteTiles category={category} items={items} />

        {/* Collection — Figma "Collection / Header" 71:83 / 72:280 */}
        <section id="collection" aria-labelledby="collection-title" className="flex scroll-mt-4 flex-col gap-4 pt-12 desk:gap-8 desk:pt-32">
          <div className="flex items-end justify-between px-4 desk:px-0">
            <div className="flex flex-col items-start gap-1.5 desk:gap-3">
              <p className="type-eyebrow text-accent-deep">
                {collection.eyebrow}
                <span className="desk:hidden"> · {items.length} PIECES</span>
              </p>
              <h2 id="collection-title" className="type-h1-mobile text-ink desk:type-h1">
                {collection.title}
              </h2>
            </div>
            <p className="type-caption hidden text-ink-muted desk:block">{items.length} pieces</p>
          </div>
          <Suspense fallback={<ProductCollectionFallback config={collection.config} />}>
            <ProductCollection items={items} config={collection.config} blocks={blocks} />
          </Suspense>
        </section>
      </div>
      <div className="h-16 desk:h-32" aria-hidden="true" />
    </div>
  );
}
