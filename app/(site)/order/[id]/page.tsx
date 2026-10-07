import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmationView } from "@/components/order/OrderConfirmationView";
import { ORDER_NUMBER_RE } from "@/lib/clientCare";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Not an order number at all → a real 404. A well-formed number is looked up on the device (orders live in
  // localStorage), where a miss shows the same 404 design client-side.
  if (!ORDER_NUMBER_RE.test(decodeURIComponent(id))) notFound();
  return <OrderConfirmationView orderId={id} />;
}
