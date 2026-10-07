import Link from "next/link";

/** Figma "Review Row" (Checkout Payment 57:57) — a read-only summary line with an edit link back to Delivery. */
export function ReviewRow({ label, value, editHref }: { label: string; value: string; editHref: string }) {
  return (
    <div className="flex w-full items-start justify-between gap-4 border-b border-line py-4">
      <div className="flex flex-col gap-0.5">
        <p className="type-caption text-ink-muted">{label}</p>
        <p className="type-body text-ink">{value}</p>
      </div>
      <Link href={editHref} className="type-caption shrink-0 text-ink underline decoration-from-font">
        Change
      </Link>
    </div>
  );
}
