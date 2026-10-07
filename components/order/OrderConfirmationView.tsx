"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateAccountPanel } from "./CreateAccountPanel";
import { ManageOrderPanel } from "./ManageOrderPanel";
import { OrderDetailsPanel } from "./OrderDetailsPanel";
import { OrderHero, type HeroImage } from "./OrderHero";
import { OrderLoadingSkeleton } from "./OrderLoadingSkeleton";
import { OrderNotFound } from "./OrderNotFound";
import { OrderProgressPanel } from "./OrderProgressPanel";
import { ResendEmail } from "./ResendEmail";
import { SignedInBanner } from "./SignedInBanner";
import { WhileYouWait } from "./WhileYouWait";
import { getOrder, type Order } from "@/lib/orders";
import { formatDeadlineTime, getOrderStage, isWithinManageWindow, manageWindowDeadline, type OrderStage } from "@/lib/orderStatus";
import { getProductById } from "@/lib/products";
import { useSession } from "@/lib/auth/SessionContext";

const DEV_STAGE_OVERRIDE = process.env.NODE_ENV !== "production";

export function OrderConfirmationView({ orderId }: { orderId: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const { session } = useSession();
  // Keep the panel (and its "Your Account Is Ready" state) mounted after creating an account here.
  const [createdHere, setCreatedHere] = useState(false);
  const [overrideStage, setOverrideStage] = useState<OrderStage | null>(null);

  useEffect(() => {
    setOrder(getOrder(orderId));
    if (DEV_STAGE_OVERRIDE) {
      const param = new URLSearchParams(window.location.search).get("stage");
      if (param === "shipped" || param === "delivered" || param === "preparing") setOverrideStage(param);
    }
    setHydrated(true);
  }, [orderId]);

  const stage = order ? getOrderStage(order, overrideStage) : "preparing";
  const withinWindow = order ? isWithinManageWindow(order) : false;
  const deadlineLabel = order ? formatDeadlineTime(manageWindowDeadline(order)) : "";

  const heroImages: HeroImage[] = useMemo(() => {
    if (!order) return [];
    const seen = new Set<string>();
    const images: HeroImage[] = [];
    for (const line of order.lines) {
      if (seen.has(line.productId) || images.length >= 2) continue;
      seen.add(line.productId);
      const product = getProductById(line.productId);
      const colour = product?.colours.find((c) => c.name === line.colour) ?? product?.colours[0];
      if (colour) images.push({ src: colour.image.src, alt: product?.name ?? "" });
    }
    return images;
  }, [order]);

  if (!hydrated) return <OrderLoadingSkeleton />;
  if (!order) return <OrderNotFound />;

  return (
    <div className="flex w-full flex-col items-center bg-bg pb-20">
      <div className="w-full max-w-[1440px]">
        <OrderHero order={order} images={heroImages} />
        <div className="px-4 pt-4 desk:px-[clamp(24px,6.667vw,96px)]">
          <ResendEmail email={order.contactEmail} />
        </div>

        <div className="px-4 pt-10 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-16">
          <OrderProgressPanel order={order} stage={stage} />
        </div>

        <OrderDetailsPanel order={order} withinWindow={withinWindow} deadlineLabel={deadlineLabel}>
          {withinWindow && <ManageOrderPanel order={order} deadlineLabel={deadlineLabel} onOrderChange={setOrder} />}
        </OrderDetailsPanel>

        <div className="px-4 pt-12 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-24">
          {session && !createdHere ? <SignedInBanner /> : <CreateAccountPanel order={order} onAccountCreated={() => setCreatedHere(true)} />}
        </div>

        <WhileYouWait />
      </div>
    </div>
  );
}
