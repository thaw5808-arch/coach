function Bar({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded-full bg-line ${className}`} />;
}

/** Shown while the order is being read from localStorage, so there's no flash of "not found". */
export function OrderLoadingSkeleton() {
  return (
    <div aria-hidden="true" className="flex w-full flex-col items-start gap-10 px-4 pt-10 desk:px-[clamp(24px,6.667vw,96px)] desk:pt-16">
      <div className="flex w-full flex-col items-start gap-4 desk:max-w-[552px]">
        <Bar className="h-12 w-12 rounded-full" />
        <Bar className="h-4 w-48" />
        <Bar className="h-12 w-full max-w-[480px]" />
        <Bar className="h-6 w-64" />
      </div>
      <Bar className="h-40 w-full rounded-pill" />
      <Bar className="h-96 w-full rounded-pill" />
    </div>
  );
}
