"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice, getGallery, getRelatedProducts, type Product } from "@/lib/products";
import { ProductGallery } from "./ProductGallery";
import { ProductGalleryMobile } from "./ProductGalleryMobile";
import { GalleryLightbox } from "./GalleryLightbox";
import { ProductPurchasePanel, type AddedLine } from "./ProductPurchasePanel";
import { MiniBagDrawer } from "./MiniBagDrawer";
import { MobileAddedSheet } from "./MobileAddedSheet";
import { CraftSection } from "./CraftSection";
import { RelatedProducts } from "./RelatedProducts";

const CATEGORY_LABEL: Record<Product["category"], string> = { women: "Women", men: "Men", bags: "Bags" };

export function ProductDetailView({ product }: { product: Product }) {
  const [colourIndex, setColourIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [miniBagOpen, setMiniBagOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lastLine, setLastLine] = useState<AddedLine | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  const addToBagAnchorRef = useRef<HTMLDivElement | null>(null);
  const footerSentinelRef = useRef<HTMLDivElement | null>(null);
  const pastButton = useRef(false);
  const nearFooter = useRef(false);

  const gallery = getGallery(product.colours[colourIndex]);

  // Hydrate the selected colour from ?colour= on mount only, so SSR and first client render stay in sync.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("colour");
    if (!requested) return;
    const i = product.colours.findIndex((c) => c.name.toLowerCase() === requested.toLowerCase());
    if (i >= 0) setColourIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("colour", product.colours[colourIndex].name.toLowerCase());
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [colourIndex, product.colours]);

  // Keyboard arrows move the active gallery image (ignored while typing in a field or a modal with its own handling isn't relevant here, since arrows don't conflict).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowLeft") setGalleryIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setGalleryIndex((i) => Math.min(gallery.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery.length]);

  useEffect(() => {
    const buttonEl = addToBagAnchorRef.current;
    const footerEl = footerSentinelRef.current;
    if (!buttonEl || !footerEl) return;

    const update = () => setStickyVisible(pastButton.current && !nearFooter.current);

    const buttonObserver = new IntersectionObserver(
      ([entry]) => {
        pastButton.current = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        update();
      },
      { threshold: 0 },
    );
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        nearFooter.current = entry.isIntersecting;
        update();
      },
      { threshold: 0, rootMargin: "0px 0px 100px 0px" },
    );
    buttonObserver.observe(buttonEl);
    footerObserver.observe(footerEl);
    return () => {
      buttonObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  function handleColourChange(i: number) {
    setColourIndex(i);
    setGalleryIndex(0);
  }

  function handleAdded(line: AddedLine) {
    setLastLine(line);
    // One confirmation per breakpoint: the drawer on desktop (Figma 29:2), the bottom sheet on mobile (32:172).
    if (window.matchMedia("(min-width: 1024px)").matches) setMiniBagOpen(true);
    else setMobileSheetOpen(true);
  }

  return (
    <div className="bg-bg pb-16">
      <nav aria-label="Breadcrumb" className="hidden px-[clamp(24px,6.667vw,96px)] pt-12 desk:block">
        <ol className="type-caption flex items-center gap-1 text-ink-muted">
          <li>
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${product.category}`} className="hover:text-ink">
              {CATEGORY_LABEL[product.category]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductGalleryMobile
        gallery={gallery}
        productName={product.name}
        productId={product.id}
        index={galleryIndex}
        onSelect={setGalleryIndex}
        backHref={`/${product.category}`}
        backLabel={CATEGORY_LABEL[product.category]}
      />

      <div className="flex flex-col gap-8 px-4 pt-4 desk:flex-row desk:gap-24 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-8">
        <ProductGallery gallery={gallery} productName={product.name} index={galleryIndex} onSelect={setGalleryIndex} onZoom={() => setLightboxOpen(true)} />
        <ProductPurchasePanel product={product} colourIndex={colourIndex} onColourChange={handleColourChange} onAdded={handleAdded} addToBagRef={(el) => (addToBagAnchorRef.current = el)} />
      </div>

      <div className="px-4 desk:px-[clamp(24px,6.667vw,96px)]">
        <CraftSection product={product} />
        <RelatedProducts
          items={getRelatedProducts(product)}
          viewAllHref={`/${product.category}`}
          viewAllLabel={`View all ${product.category === "men" ? "men's bags" : product.category === "women" ? "women's bags" : "bags"}`}
        />
      </div>
      <div ref={footerSentinelRef} aria-hidden="true" />

      <GalleryLightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} gallery={gallery} productName={product.name} index={galleryIndex} onSelect={setGalleryIndex} />
      <MiniBagDrawer open={miniBagOpen} onClose={() => setMiniBagOpen(false)} product={product} line={lastLine} />
      <MobileAddedSheet open={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)} product={product} line={lastLine} />

      {stickyVisible && !miniBagOpen && !mobileSheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface px-4 pb-7 pt-3 desk:hidden">
          <div className="flex-1">
            <p className="type-h4 text-ink">{product.name}</p>
            <p className="type-caption text-ink-muted">
              {formatPrice(product.price, product.currency)} · {product.colours[colourIndex].name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => addToBagAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="type-button rounded-pill bg-ink px-5 py-[17px] text-surface"
          >
            Add to bag
          </button>
        </div>
      )}
    </div>
  );
}
