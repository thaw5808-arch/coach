import type { Metadata } from "next";
import { BagView } from "@/components/bag/BagView";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Review the pieces in your bag before checkout.",
  robots: { index: false, follow: false },
};

export default function BagPage() {
  return <BagView />;
}
