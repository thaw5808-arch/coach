import { ArrowIcon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/format";

/** Figma "Quick Checkout" (Shopping Bag Mobile 44:244) — compact total + checkout at the top of the page. */
export function QuickCheckoutCard({
  total,
  disabled,
  loading,
  onCheckout,
}: {
  total: number;
  disabled: boolean;
  loading: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-pill bg-surface p-4 desk:hidden">
      <div className="flex w-full items-baseline justify-between">
        <p className="type-caption text-ink-muted">Total · Complimentary delivery</p>
        <p className="type-price text-ink">{formatPrice(total)}</p>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled || loading}
        className="type-button flex h-[53px] w-full items-center justify-center gap-3 rounded-pill bg-ink text-surface disabled:opacity-35"
      >
        <span>Checkout</span>
        <ArrowIcon size={18} />
      </button>
    </div>
  );
}
