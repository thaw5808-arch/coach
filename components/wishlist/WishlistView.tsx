"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/ui/SiteLink";
import { NotFoundContent } from "@/components/errors/NotFoundContent";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { CutoutImage } from "@/components/ui/CutoutImage";
import { HeartIcon } from "@/components/ui/Icons";
import { ProductCard, ProductCardSkeleton } from "@/components/ui/ProductCard";
import { useSession } from "@/lib/auth/SessionContext";
import { useBag } from "@/lib/bag/BagContext";
import { numberWord } from "@/lib/format";
import { getProductById, type Product } from "@/lib/products";
import { shareProduct } from "@/lib/share";
import { useWishlist } from "@/lib/wishlist/WishlistContext";

/** Figma: "Removing is instant and reversible for eight seconds." */
const UNDO_MS = 8000;
/** How long "Added to bag" confirms in place before the piece leaves the list. */
const MOVED_CONFIRM_MS = 1600;
const MAX_SHARED = 48;

const pieces = (n: number) => `${n} piece${n === 1 ? "" : "s"}`;
const shell = "mx-auto w-full max-w-[1440px] px-4 desk:px-[clamp(24px,6.667vw,96px)]";

/** The colour that goes in the bag: the card's colour, or the first one still available. */
function bagColour(product: Product) {
  return product.colours[0].available ? product.colours[0] : product.colours.find((c) => c.available);
}

function Hero({ eyebrow, tagline }: { eyebrow: string; tagline: string }) {
  return (
    <div className="relative flex flex-col items-start gap-3 pt-6 desk:gap-4 desk:pt-12">
      <Blob className="-top-[142px] right-[-90px] h-[199px] w-[220px] desk:-top-[190px] desk:right-[-254px] desk:h-[359px] desk:w-[397px]" />
      <nav aria-label="Breadcrumb" className="relative z-10">
        <ol className="type-caption flex gap-2">
          <li>
            <Link href="/" className="text-ink-muted hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-ink-muted">
            /
          </li>
          <li aria-current="page" className="text-ink">
            Wishlist
          </li>
        </ol>
      </nav>
      <div className="relative z-10 flex flex-col items-start gap-2">
        <p className="type-eyebrow text-accent-deep">{eyebrow}</p>
        <h1 className="type-display-mobile text-ink desk:type-display-xl">Wishlist</h1>
        <p className="type-italic-sm text-accent-deep desk:type-italic">{tagline}</p>
      </div>
    </div>
  );
}

/** Figma "Item" — card + "Move to bag", which confirms in place ("Item — Moved to Bag") before leaving the list. */
function WishlistItem({ product, onMoved, leaveOnMove }: { product: Product; onMoved: (product: Product, previousQty: number) => void; leaveOnMove: boolean }) {
  const bag = useBag();
  const [added, setAdded] = useState(false);
  const colour = bagColour(product);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function moveToBag() {
    if (!colour || added) return;
    const previousQty = bag.lines.find((l) => l.productId === product.id && l.colour === colour.name)?.quantity ?? 0;
    bag.add(product.id, colour.name);
    setAdded(true);
    timer.current = window.setTimeout(() => {
      if (leaveOnMove) onMoved(product, previousQty);
      else setAdded(false);
    }, MOVED_CONFIRM_MS);
  }

  return (
    <li className="flex min-w-0 flex-col gap-4" data-wishlist-item={product.id}>
      <ProductCard product={product} size="compact" className="desk:hidden" />
      <ProductCard product={product} size="medium" className="hidden desk:flex" />
      {colour ? (
        <Button
          variant="secondary"
          showArrow={false}
          status={added ? "success" : "idle"}
          onClick={moveToBag}
          aria-live="polite"
          // Name starts with the visible words (WCAG 2.5.3 label in name), then says which piece.
          aria-label={added ? `Added to bag: ${product.name}` : `Move to bag: ${product.name}`}
          className={`w-full px-3 ${added ? "!bg-accent-deep !text-surface" : ""}`}
        >
          {added ? "Added to bag" : "Move to bag"}
        </Button>
      ) : (
        <Button variant="secondary" showArrow={false} disabled className="w-full px-3">
          Sold out
        </Button>
      )}
    </li>
  );
}

/** Figma "Toast" (Item — Removed): ink pill, thumbnail, message, Undo. Lives for eight seconds. */
function UndoToast({ product, title, detail, onUndo, onDone }: { product: Product; title: string; detail: string; onUndo: () => void; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, UNDO_MS);
    return () => window.clearTimeout(t);
  }, [onDone, product.id]);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 flex justify-center desk:bottom-8">
      <div role="status" className="pointer-events-auto flex w-full max-w-[432px] items-center gap-4 rounded-pill bg-ink py-4 pl-4 pr-5 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
        <span className="relative block size-12 shrink-0 overflow-hidden rounded-[12px] bg-blob">
          <span className="absolute inset-[2px]">
            <CutoutImage image={product.colours[0].image} sizes="48px" />
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-h4 truncate text-surface">{title}</span>
          <span className="type-caption text-line">{detail}</span>
        </span>
        <button type="button" onClick={onUndo} className="type-button shrink-0 text-surface underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          Undo
        </button>
      </div>
    </div>
  );
}

/** Figma "State / Signed Out — Save Prompt". */
function SavePrompt({ count }: { count: number }) {
  const next = encodeURIComponent("/wishlist");
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-[24px] bg-blob px-6 py-6 desk:flex-row desk:items-center desk:gap-6 desk:px-8">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="type-h3 text-ink">Keep your wishlist on every device</p>
        <p className="type-caption text-ink-muted">
          Sign in or create an account — your {numberWord(count).toLowerCase()} saved {count === 1 ? "piece comes" : "pieces come"} with you.
        </p>
      </div>
      <div className="flex w-full flex-col-reverse items-stretch gap-2 desk:w-auto desk:flex-row desk:items-center desk:gap-6">
        <Button href={`/account?next=${next}&mode=create`} variant="text" showArrow={false} className="justify-center">
          Create account
        </Button>
        <Button href={`/account?next=${next}`}>Sign in</Button>
      </div>
    </div>
  );
}

/** Figma "State / Wishlist — Empty". */
function EmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[24px] bg-surface px-6 py-12 text-center desk:mx-auto desk:max-w-[720px] desk:px-12 desk:py-14">
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-surface text-ink">
        <HeartIcon size={20} />
      </span>
      <p className="type-badge text-accent-deep">NOTHING SAVED YET</p>
      <h2 className="type-h1-mobile text-ink desk:type-h1">Keep What Catches Your Eye</h2>
      <p className="type-body max-w-[500px] text-ink-muted">Tap the heart on any piece to save it here — it follows you to every device once you sign in.</p>
      <div className="flex flex-col items-center gap-2 desk:flex-row desk:gap-4">
        <Button href="/new-arrivals">Shop new arrivals</Button>
        {!signedIn && (
          <Button href={`/account?next=${encodeURIComponent("/wishlist")}`} variant="text">
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-8 desk:grid-cols-4 desk:gap-8">{children}</ul>;
}

/** /wishlist — Figma "Wishlist — Desktop 1440" (94:3530) / "Mobile 390" (94:3631) + States (94:4043). */
export function WishlistView() {
  const wishlist = useWishlist();
  const bag = useBag();
  const { session } = useSession();
  const params = useSearchParams();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const [movedUndo, setMovedUndo] = useState<{ product: Product; colour: string; previousQty: number } | null>(null);

  // `?items=` = someone else's shared list: shown read-only with "Save all", never touching this device's list.
  const sharedIds = useMemo(() => {
    const raw = params.get("items");
    if (raw === null) return null;
    return [...new Set(raw.split(","))].filter((id) => getProductById(id)).slice(0, MAX_SHARED);
  }, [params]);

  const products = useMemo(
    () => (sharedIds ?? wishlist.ids).map((id) => getProductById(id)).filter((p): p is Product => !!p),
    [sharedIds, wishlist.ids],
  );

  if (!wishlist.hydrated) {
    return (
      <div className={shell}>
        <Hero eyebrow="SAVED PIECES" tagline="Kept for later." />
        <div className="pb-16 pt-12 desk:pb-32 desk:pt-24" aria-busy="true">
          <Grid>
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton size="compact" className="desk:hidden" />
                <ProductCardSkeleton size="medium" className="hidden desk:flex" />
              </li>
            ))}
          </Grid>
        </div>
      </div>
    );
  }

  // Nothing in a shared link is a real product: the shared 404 design (the server already answers 404 on load).
  if (sharedIds && products.length === 0) {
    return <NotFoundContent eyebrow="SHARED WISHLIST" title="This List Has Moved On" body="The pieces in this shared link are no longer available. Start from something new instead." />;
  }

  if (sharedIds) {
    const unsaved = sharedIds.filter((id) => !wishlist.has(id));
    return (
      <div className={shell}>
        <Hero eyebrow="SHARED WISHLIST" tagline={products.length ? `${numberWord(products.length)} ${products.length === 1 ? "piece" : "pieces"}, shared with you.` : "Nothing to show here."} />
        <div className="flex items-center justify-between gap-4 pb-4 pt-8 desk:pb-8 desk:pt-16">
          <p className="type-caption text-ink-muted">{pieces(products.length)} · Shared list</p>
          {products.length > 0 && (
            <Button variant="text" showArrow={false} disabled={unsaved.length === 0} onClick={() => wishlist.add(unsaved)}>
              {unsaved.length === 0 ? "All saved" : "Save all to my wishlist"}
            </Button>
          )}
        </div>
        <div className="pb-16 desk:pb-32">
          <Grid>
            {products.map((p) => (
              <WishlistItem key={p.id} product={p} leaveOnMove={false} onMoved={() => {}} />
            ))}
          </Grid>
        </div>
      </div>
    );
  }

  const count = products.length;
  const removal = wishlist.lastRemoval;
  const removedProduct = removal && removal.reason === "removed" && removal.at >= mountedAt ? getProductById(removal.id) : undefined;

  async function handleShare() {
    const url = `${window.location.origin}/wishlist?items=${wishlist.ids.map(encodeURIComponent).join(",")}`;
    const result = await shareProduct("My COACH wishlist", `${pieces(count)} I’m keeping an eye on.`, url);
    setShareNote(result === "copied" ? "Link copied" : result === "shared" ? "Shared" : "Couldn’t share — try again");
    window.setTimeout(() => setShareNote(null), 3000);
  }

  return (
    <div className={shell}>
      <Hero eyebrow="SAVED PIECES" tagline={count ? `${numberWord(count)} ${count === 1 ? "piece" : "pieces"}, kept for later.` : "Kept for later."} />

      {count === 0 ? (
        <div className="pb-16 pt-8 desk:pb-32 desk:pt-16">
          <EmptyState signedIn={!!session} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 pb-4 pt-8 desk:pb-8 desk:pt-16">
            <p className="type-caption text-ink-muted">
              {pieces(count)}
              <span className="hidden desk:inline"> · {session ? "Saved on this device and your account" : "Saved on this device"}</span>
            </p>
            <div className="flex items-center gap-3">
              <span role="status" className="type-caption text-accent-deep">
                {shareNote}
              </span>
              <Button variant="text" onClick={handleShare}>
                Share wishlist
              </Button>
            </div>
          </div>
          {!session && (
            <div className="pb-8">
              <SavePrompt count={count} />
            </div>
          )}
          <div className="pb-16 desk:pb-32">
            <Grid>
              {products.map((p) => (
                <WishlistItem
                  key={p.id}
                  product={p}
                  leaveOnMove
                  onMoved={(product, previousQty) => {
                    setMovedUndo({ product, colour: bagColour(product)!.name, previousQty });
                    wishlist.remove(product.id, "moved");
                  }}
                />
              ))}
            </Grid>
          </div>
        </>
      )}

      {removedProduct && removal && (
        <UndoToast
          product={removedProduct}
          title={`${removedProduct.name} removed`}
          detail={`Your wishlist now has ${pieces(count)}.`}
          onUndo={() => wishlist.restore(removal.id, removal.index)}
          onDone={wishlist.dismissRemoval}
        />
      )}
      {movedUndo && removal?.reason === "moved" && removal.id === movedUndo.product.id && (
        <UndoToast
          product={movedUndo.product}
          title={`${movedUndo.product.name} moved to your bag`}
          detail={`Your wishlist now has ${pieces(count)}.`}
          onUndo={() => {
            // A true undo: back on the list, and the bag line returns to what it was before.
            if (movedUndo.previousQty === 0) bag.remove(movedUndo.product.id, movedUndo.colour);
            else bag.setQuantity(movedUndo.product.id, movedUndo.previousQty, movedUndo.colour);
            wishlist.restore(removal.id, removal.index);
            setMovedUndo(null);
          }}
          onDone={() => {
            setMovedUndo(null);
            wishlist.dismissRemoval();
          }}
        />
      )}
    </div>
  );
}
