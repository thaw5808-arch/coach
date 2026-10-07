"use client";

import { ServerErrorCard } from "@/components/errors/ServerErrorCard";

/** A checkout step failed: the 500 card inside the checkout header / footer strip (the bag is untouched). */
export default function CheckoutError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ServerErrorCard error={error} retry={retry} />;
}
