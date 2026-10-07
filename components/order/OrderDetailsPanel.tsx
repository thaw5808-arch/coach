import Link from "@/components/ui/SiteLink";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/format";
import { countryName, formatCityLine, HOME_COUNTRY } from "@/lib/address/countries";
import { getTax, taxLabel } from "@/lib/checkout/tax";
import { DELIVERY_TITLE } from "@/lib/checkout/delivery";
import type { Order, OrderLineSnapshot } from "@/lib/orders";
import { getProductById } from "@/lib/products";
import { getStoreById } from "@/lib/stores";

type DetailLine = OrderLineSnapshot & { image: string; material?: string };

function ItemRow({ line }: { line: DetailLine }) {
  return (
    <div className="flex w-full items-center gap-5 border-t border-line py-5">
      <div className="relative size-[72px] shrink-0 overflow-hidden rounded-pill bg-bg desk:size-24">
        <SafeImage src={line.image} alt="" fill sizes="96px" className="object-contain p-1.5" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="type-h4 text-ink">{line.name}</p>
        <p className="type-caption text-ink-muted desk:hidden">
          {line.colour} · Qty {line.quantity}
        </p>
        <p className="type-caption hidden text-ink-muted desk:block">
          {line.colour}
          {line.material ? ` · ${line.material}` : ""} · Qty {line.quantity}
        </p>
        {line.initials && (
          <p className="type-caption text-accent-deep">
            Initials: {line.initials} {line.finish ? `(${line.finish})` : ""}
          </p>
        )}
      </div>
      <p className="type-price-sm text-ink">{formatPrice(line.unitPrice * line.quantity)}</p>
    </div>
  );
}

/** Figma "Details" (Order Confirmation Desktop 63:100 / Mobile 64:192). */
export function OrderDetailsPanel({
  order,
  withinWindow,
  deadlineLabel,
  children,
}: {
  order: Order;
  withinWindow: boolean;
  deadlineLabel: string;
  children?: ReactNode;
}) {
  const lines: DetailLine[] = order.lines.map((l) => {
    const product = getProductById(l.productId);
    const colour = product?.colours.find((c) => c.name === l.colour) ?? product?.colours[0];
    return { ...l, image: colour?.image.src ?? "", material: product?.material };
  });

  const placedDate = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const taxInfo = order.deliveryMethod === "store" || !order.shippingAddress ? getTax(HOME_COUNTRY, "") : getTax(order.shippingAddress.country, order.shippingAddress.state);

  return (
    <div className="flex w-full flex-col gap-6 px-4 pt-8 desk:flex-row desk:items-start desk:gap-12 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-12">
      <div className="flex w-full flex-col items-start gap-4 rounded-pill bg-surface px-5 py-6 desk:w-[744px] desk:gap-4 desk:px-10 desk:py-8">
        <div className="flex w-full items-baseline justify-between gap-4">
          <p className="type-h3 text-ink">Order Details</p>
          <p className="type-caption shrink-0 text-ink-muted">
            Placed {placedDate} · Nº {order.id}
          </p>
        </div>

        <div className="flex w-full flex-col border-b border-line">
          {lines.map((line, i) => (
            <ItemRow key={`${line.productId}-${i}`} line={line} />
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 pt-1">
          <div className="flex w-full items-start justify-between">
            <p className="type-body text-ink-muted">Subtotal</p>
            <p className="type-body text-ink">{formatPrice(order.subtotal)}</p>
          </div>
          {order.discount > 0 && (
            <div className="flex w-full items-start justify-between">
              <p className="type-body text-ink-muted">Discount</p>
              <p className="type-body text-accent-deep">−{formatPrice(order.discount)}</p>
            </div>
          )}
          <div className="flex w-full items-start justify-between">
            <p className="type-body text-ink-muted">Delivery</p>
            <p className="type-body text-ink">{order.deliveryPrice === 0 ? "Complimentary" : formatPrice(order.deliveryPrice)}</p>
          </div>
          <div className="flex w-full items-start justify-between">
            <p className="type-body text-ink-muted">{taxLabel(taxInfo)}</p>
            <p className="type-body text-ink">{formatPrice(order.tax)}</p>
          </div>
          {order.giftCardAmount > 0 && (
            <div className="flex w-full items-start justify-between">
              <p className="type-body text-ink-muted">Gift card</p>
              <p className="type-body text-accent-deep">−{formatPrice(order.giftCardAmount)}</p>
            </div>
          )}
        </div>

        <div className="flex w-full items-baseline justify-between border-t border-line pt-4">
          <p className="type-h3 text-ink">Total Paid</p>
          <p className="type-price-lg text-ink">{formatPrice(order.total)}</p>
        </div>

        <div className="flex w-full items-center justify-between gap-4">
          <p className="type-caption text-ink-muted">
            {"method" in order.payment ? (order.payment.method === "paypal" ? "Paid with PayPal" : "Paid with Apple Pay") : `Paid with ${order.payment.brand} ending in ${order.payment.last4}`}
          </p>
          <button type="button" className="type-caption shrink-0 text-ink underline decoration-from-font">
            Download receipt
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-4 desk:w-[456px]">
        <div className="flex w-full flex-col items-start gap-2 rounded-pill bg-surface px-6 py-6 desk:px-8">
          <p className="type-eyebrow text-accent-deep">DELIVERY</p>
          <div className="flex flex-col items-start gap-0 pt-1 text-ink">
            {order.deliveryMethod === "store" ? (
              <>
                <p className="type-body">
                  {order.firstName} {order.lastName}
                </p>
                <p className="type-body">{getStoreById(order.storeId ?? "")?.name ?? "Boutique pickup"}</p>
                <p className="type-body">{getStoreById(order.storeId ?? "")?.address}</p>
              </>
            ) : (
              <>
                <p className="type-body">
                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                </p>
                <p className="type-body">
                  {order.shippingAddress?.address1}
                  {order.shippingAddress?.address2 ? `, ${order.shippingAddress.address2}` : ""}
                </p>
                {order.shippingAddress && (
                  <p className="type-body">
                    {formatCityLine(order.shippingAddress)}, {countryName(order.shippingAddress.country)}
                  </p>
                )}
              </>
            )}
          </div>
          <p className="type-caption pt-1 text-ink-muted">{DELIVERY_TITLE[order.deliveryMethod]}</p>
        </div>

        <div className="flex w-full flex-col items-start gap-2 rounded-pill bg-surface px-6 py-6 desk:px-8">
          <p className="type-eyebrow text-accent-deep">CONTACT</p>
          <div className="flex flex-col items-start pt-1 text-ink">
            <p className="type-body">{order.contactEmail}</p>
            <p className="type-body">{order.contactPhone}</p>
          </div>
        </div>

        <NeedToMakeAChangeCard order={order} deadlineLabel={deadlineLabel} withinWindow={withinWindow} />
        {children}
      </div>
    </div>
  );
}

function NeedToMakeAChangeCard({ order, deadlineLabel, withinWindow }: { order: Order; deadlineLabel: string; withinWindow: boolean }) {
  return (
    <div className="flex w-full flex-col items-start gap-2 rounded-pill bg-surface px-6 py-6 desk:px-8">
      <p className="type-eyebrow text-accent-deep">NEED TO MAKE A CHANGE?</p>
      {order.status === "cancelled" ? (
        <p className="type-body pt-1 text-ink">This order has been cancelled.</p>
      ) : withinWindow ? (
        <p className="type-body pt-1 text-ink">Edit or cancel until {deadlineLabel} today.</p>
      ) : (
        <p className="type-body pt-1 text-ink">The 1-hour change window has closed.</p>
      )}
      <p className="type-caption text-ink-muted">After that, Client Care can still help with delivery updates.</p>
      <div className="flex items-center gap-6 pt-1">
        {withinWindow && order.status !== "cancelled" && (
          <a href="#manage-order" className="type-caption text-ink underline decoration-from-font">
            Manage order
          </a>
        )}
        <Link href="/client-care#contact" className="type-caption text-ink underline decoration-from-font">
          Contact Client Care
        </Link>
      </div>
    </div>
  );
}
