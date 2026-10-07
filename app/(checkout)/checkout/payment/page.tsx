import type { Metadata } from "next";
import { CheckoutPaymentView } from "@/components/checkout/CheckoutPaymentView";

export const metadata: Metadata = {
  title: "Checkout — Payment",
  robots: { index: false, follow: false },
};

export default function CheckoutPaymentPage() {
  return <CheckoutPaymentView />;
}
