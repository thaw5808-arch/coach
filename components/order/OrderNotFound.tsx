import { NotFoundContent } from "@/components/errors/NotFoundContent";

/** A well-formed order number that isn't on this device — the shared 404 design (Figma 101:345) with order copy. */
export function OrderNotFound() {
  return (
    <NotFoundContent
      eyebrow="ORDER NOT FOUND"
      title="We Couldn’t Find That Order"
      body="The number may be mistyped, or this isn’t the browser you checked out with — order confirmations stay on the device in this preview."
    />
  );
}
