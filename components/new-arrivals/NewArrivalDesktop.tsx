import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { CollectionSection } from "./CollectionSection";
import { Promises } from "./Promises";
import { formatPrice } from "@/lib/format";
import { getProductById, products } from "@/lib/products";

/** The hero tag names a real piece — its price always comes from the catalogue. */
const HERO_PRODUCT = getProductById("chapter-shoulder-bag")!;

/** Figma "P / Desktop / New Arrival" (103:88), 1440 wide. */
export function NewArrivalDesktop() {
  return (
    <div className="hidden desk:block">
      <div className="mx-auto max-w-[1440px] px-[clamp(24px,6.667vw,96px)]">
        <section className="relative flex items-start justify-between gap-16 pt-16">
          <Blob className="-top-[110px] right-[-11%] h-[359px] w-[397px]" />
          <div className="relative z-10 flex w-[552px] max-w-full shrink-0 flex-col items-start gap-8">
            <p className="type-caption">
              <span className="text-ink-muted">Home /</span> <span className="text-ink">New Arrival</span>
            </p>
            <div className="flex flex-col items-start gap-4">
              <p className="type-eyebrow text-accent-deep">AUTUMN CHAPTER — 2026</p>
              <h1 className="type-display-xl text-ink">New Arrivals</h1>
              <p className="type-italic text-accent-deep">Fresh chapters, ready to be carried.</p>
            </div>
            <p className="type-body-lg w-[468px] max-w-full text-ink-muted">
              Twenty-four new pieces, cut from glove-tanned leather and finished by hand — introduced in the quiet tones of early
              autumn: midnight black, blush and petal pink.
            </p>
            <div className="flex items-center gap-8">
              <Button href="/bags">Shop new arrivals</Button>
              <Button href="/bags" variant="text">
                Discover the Blush Edit
              </Button>
            </div>
          </div>

          <div className="relative z-10 h-[600px] w-[clamp(400px,43.3vw,624px)] shrink-0">
            <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[12.82%] top-[16%] h-[75.33%] w-[80.13%] rounded-[50%] bg-blob" />
            <div className="absolute left-[13.14%] top-[6.67%] h-[76.67%] w-[73.72%]">
              <SafeImage src="/images/home/bag-black.png" alt="Chapter Shoulder Bag in black" fill sizes="460px" className="object-contain" loading="eager" fetchPriority="high" />
            </div>
            <div className="absolute left-[56.5%] top-[52.9%] h-[41.67%] w-[40.06%] rotate-16">
              <SafeImage src="/images/home/bag-bow-pink.png" alt="Petal Chain Bag" fill sizes="250px" className="object-contain" />
            </div>
            <div className="absolute left-[3.85%] top-[83.3%] flex items-center gap-3 rounded-pill bg-surface py-3 pl-4 pr-5">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent-deep" />
              <span className="type-h4 text-ink">Chapter Shoulder Bag</span>
              <span className="type-price-sm text-ink-muted">{formatPrice(HERO_PRODUCT.price)}</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-start gap-8 pb-16 pt-32">
          <div className="flex w-full items-end justify-between">
            <div className="flex flex-col items-start gap-3">
              <p className="type-eyebrow text-accent-deep">THE COLLECTION</p>
              <h2 className="type-h1 text-ink">Every Piece, Newly Arrived</h2>
            </div>
            <p className="type-caption text-ink-muted">{products.length} pieces</p>
          </div>

          <CollectionSection />
        </section>

        <div className="relative">
          <Blob className="-left-[11%] bottom-0 h-[359px] w-[397px]" />
          <Promises />
        </div>
      </div>
    </div>
  );
}
