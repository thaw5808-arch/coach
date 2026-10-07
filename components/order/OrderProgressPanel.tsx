import { OrderTimeline } from "@/components/ui/OrderTimeline";
import type { Order } from "@/lib/orders";
import { getDeliveredDate, getTimelineDates, getTrackingNumber, type OrderStage } from "@/lib/orderStatus";

/** Figma "Order Progress" (Desktop 63:64 / Mobile 64:158) + "State / Order Progress — Shipped & Delivered" (66:182). */
export function OrderProgressPanel({ order, stage }: { order: Order; stage: OrderStage }) {
  const dates = getTimelineDates(order);

  return (
    <div id="order-progress" tabIndex={-1} className="flex w-full flex-col items-start gap-6 rounded-pill bg-surface px-5 py-8 focus:outline-none desk:gap-8 desk:px-12 desk:py-10">
      <div className="flex w-full flex-col items-start gap-2 desk:flex-row desk:items-baseline desk:justify-between desk:gap-4">
        <p className="type-h3 text-ink">Order Progress</p>
        {stage === "shipped" && (
          <p className="type-caption text-ink-muted">
            Tracking Nº {getTrackingNumber(order)} · <span className="text-ink underline decoration-from-font">Track shipment</span>
          </p>
        )}
        {stage === "delivered" && (
          <p className="type-caption text-ink-muted">
            Delivered {getDeliveredDate(order).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} ·{" "}
            <span className="text-ink underline decoration-from-font">Care guide</span>
          </p>
        )}
        {stage === "preparing" && <p className="type-caption text-ink-muted">We’ll email you at every step.</p>}
      </div>
      <OrderTimeline
        stage={stage}
        placedLabel={dates.placedLabel}
        preparingLabel={dates.preparingLabel}
        shippedLabel={dates.shippedLabel}
        deliveredLabel={dates.deliveredLabel}
      />
    </div>
  );
}
