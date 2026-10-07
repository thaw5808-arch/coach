import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { CollectionSection } from "./CollectionSection";
import { Promises } from "./Promises";
import { formatPrice } from "@/lib/format";
import { getProductById, products } from "@/lib/products";

/** The hero tag names a real piece — its price always comes from the catalogue. */
const HERO_PRODUCT = getProductById("chapter-shoulder-bag")!;

/** Figma "P / Mobile / New Arrival" (103:1328), 390 wide. */
export function NewArrivalMobile() {
  return (
    <div className="desk:hidden">
      <section className="relative px-4 pt-2">
        <Blob className="-top-[90px] right-[-15%] h-[180px] w-[200px]" />
        <div className="relative z-10 flex flex-col items-start gap-6">
          <p className="type-caption">
            <span className="text-ink-muted">Home /</span> <span className="text-ink">New Arrival</span>
          </p>
          <div className="flex flex-col items-start gap-3">
            <p className="type-eyebrow text-accent-deep">AUTUMN CHAPTER — 2026</p>
            <h1 className="type-display-mobile text-ink">New Arrivals</h1>
            <p className="type-italic text-accent-deep">Fresh chapters, ready to be carried.</p>
          </div>

          <div className="relative h-[300px] w-full">
            <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[8.1%] top-[2.67%] h-[90.4%] w-[83.8%] rounded-[50%] bg-blob" />
            <div className="absolute left-[9.5%] top-[-7.33%] h-[96.67%] w-[81%]">
              <SafeImage src="/images/home/bag-black.png" alt="Chapter Shoulder Bag in black" fill sizes="290px" className="object-contain" loading="eager" fetchPriority="high" />
            </div>
            <div className="absolute left-[51.4%] top-[40.2%] h-[46.67%] w-[39.1%] rotate-16">
              <SafeImage src="/images/home/bag-bow-pink.png" alt="Petal Chain Bag" fill sizes="140px" className="object-contain" />
            </div>
            <div className="absolute left-0 top-[88.3%] flex items-center gap-2 rounded-pill bg-surface py-2 pl-3 pr-4">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent-deep" />
              <span className="type-h4 text-ink">Chapter Shoulder Bag</span>
              <span className="type-price-sm text-ink-muted">{formatPrice(HERO_PRODUCT.price)}</span>
            </div>
          </div>

          <p className="type-body w-full text-ink-muted">
            Twenty-four new pieces, cut from glove-tanned leather and finished by hand — in the quiet tones of early autumn.
          </p>

          <div className="flex w-full flex-col items-center gap-2">
            <Button href="/bags" className="w-full">
              Shop new arrivals
            </Button>
            <Button href="/bags" variant="text">
              Discover the Blush Edit
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-start gap-6 pt-16">
        <div className="flex flex-col items-start gap-2 px-4">
          <p className="type-eyebrow text-accent-deep">THE COLLECTION · {products.length} PIECES</p>
          <h2 className="type-h1-mobile text-ink">Every Piece, Newly Arrived</h2>
        </div>

        <CollectionSection />
      </section>

      <div className="relative">
        <Blob className="-left-[30%] bottom-0 h-[180px] w-[200px]" />
        <Promises />
      </div>
    </div>
  );
}
