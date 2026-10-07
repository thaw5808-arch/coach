import type { Metadata } from "next";
import { CheckoutDeliveryView } from "@/components/checkout/CheckoutDeliveryView";

export const metadata: Metadata = {
  title: "Checkout — Delivery",
  robots: { index: false, follow: false },
};

export default function CheckoutDeliveryPage() {
  return <CheckoutDeliveryView />;
}
