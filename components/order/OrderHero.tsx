import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/orders";

export type HeroImage = { src: string; alt: string };

/** Figma "Hero" (Order Confirmation Desktop 63:37 / Mobile 64:136). */
export function OrderHero({ order, images }: { order: Order; images: HeroImage[] }) {
  const pieceCount = order.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="flex w-full flex-col items-center gap-10 pt-10 desk:flex-row desk:items-center desk:justify-between desk:gap-16 desk:pt-16">
      <div className="flex w-full max-w-[552px] flex-col items-start gap-6 px-4 desk:gap-8 desk:px-0">
        <span className="flex size-10 items-center justify-center rounded-full bg-accent-deep text-surface desk:size-12">
          <CheckIcon size={18} />
        </span>
        <div className="flex flex-col items-start gap-3 desk:gap-4">
          <p className="type-eyebrow text-accent-deep">ORDER CONFIRMED — Nº {order.id}</p>
          <h1 className="type-display-mobile text-ink desk:type-display-xl">Thank You, {order.firstName}.</h1>
          <p className="type-italic text-accent-deep">Your next chapter is on its way.</p>
        </div>
        <p className="type-body text-ink-muted desk:hidden">A confirmation is on its way to {order.contactEmail}. We’ll write again once your pieces ship.</p>
        <p className="type-body-lg hidden text-ink-muted desk:block desk:w-[480px]">
          A confirmation is on its way to {order.contactEmail}. We’ll write again when your pieces leave the atelier, with tracking details.
        </p>
        <div className="flex w-full flex-col items-stretch gap-4 desk:w-auto desk:flex-row desk:items-center desk:gap-8">
          <Button href="#order-progress">Track your order</Button>
          <Button href="/new-arrivals" variant="text">
            Continue shopping
          </Button>
        </div>
      </div>

      <div className="relative h-[280px] w-full max-w-[358px] shrink-0 desk:h-[520px] desk:w-[624px] desk:max-w-none">
        <Blob className="left-[11%] top-[6%] h-[80%] w-[74%] desk:left-[13%] desk:top-[10%] desk:h-[80%] desk:w-[74%]" />
        {images[0] && (
          <div className="absolute left-[14%] top-[11%] size-[53%] desk:left-[17.6%] desk:top-[11.5%] desk:size-[51.3%]">
            <SafeImage src={images[0].src} alt={images[0].alt} fill sizes="320px" className="object-contain" loading="eager" fetchPriority="high" />
          </div>
        )}
        {images[1] && (
          <div className="absolute left-[32%] top-[30%] size-[59%] desk:left-[36%] desk:top-[29.4%] desk:size-[54.5%]">
            <SafeImage src={images[1].src} alt={images[1].alt} fill sizes="340px" className="object-contain" />
          </div>
        )}
        <div className="absolute left-[7%] top-[89.6%] hidden items-center gap-3 rounded-pill bg-surface py-3 pl-4 pr-5 desk:flex">
          <span aria-hidden="true" className="size-2 rounded-full bg-accent-deep" />
          <span className="type-h4 text-ink">
            {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
          </span>
          <span className="type-price-sm text-ink-muted">{formatPrice(order.total)} paid</span>
        </div>
      </div>
    </div>
  );
}
