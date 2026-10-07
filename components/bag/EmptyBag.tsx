import { Button } from "@/components/ui/Button";

/** Figma "State / Bag — Empty" (Shopping Bag States 45:326). */
export function EmptyBag({ savedCount, onViewSaved }: { savedCount: number; onViewSaved: () => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-pill bg-surface px-4 py-16 text-center desk:py-24">
      <span aria-hidden="true" className="h-[108px] w-[120px] rounded-[50%] bg-blob" />
      <p className="type-eyebrow text-accent-deep">YOUR BAG IS EMPTY</p>
      <h1 className="type-h1 text-ink">Every Chapter Starts Somewhere.</h1>
      <p className="type-body w-full max-w-[440px] text-ink-muted">
        Discover the newest arrivals, or pick up where you left off with the pieces you saved.
      </p>
      <div className="flex flex-col items-center gap-4 pt-2 desk:flex-row desk:gap-8">
        <Button href="/new-arrivals">Shop new arrivals</Button>
        {savedCount > 0 && (
          <Button variant="text" onClick={onViewSaved}>
            View saved pieces ({savedCount})
          </Button>
        )}
      </div>
    </div>
  );
}
