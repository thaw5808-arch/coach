import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutFooterStrip } from "@/components/checkout/CheckoutFooterStrip";
import { CheckoutProvider } from "@/lib/checkout/CheckoutContext";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      <div className="relative flex min-h-dvh flex-col overflow-x-clip">
        <CheckoutHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <CheckoutFooterStrip />
      </div>
    </CheckoutProvider>
  );
}
