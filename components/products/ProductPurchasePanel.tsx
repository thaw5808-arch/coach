"use client";

import { useRef, useState } from "react";
import { useBag } from "@/lib/bag/BagContext";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { formatPrice, type Product } from "@/lib/products";
import { AccordionItem } from "@/components/ui/AccordionItem";
import { ArrowIcon, CheckIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { ColorSwatch } from "@/components/ui/ColorSwatch";
import { EmailField } from "@/components/ui/EmailField";
import { FilterChip } from "@/components/ui/FilterChip";
import { POLICY_COPY } from "@/lib/policies";

const FINISHES = ["Gold", "Silver", "Blind Emboss"] as const;
const DELIVERY_RETURNS = POLICY_COPY.deliveryReturns;

export type AddedLine = { colourName: string; material: string; initials?: string; finish?: string };

export function ProductPurchasePanel({
  product,
  colourIndex,
  onColourChange,
  onAdded,
  addToBagRef,
}: {
  product: Product;
  colourIndex: number;
  onColourChange: (i: number) => void;
  onAdded: (line: AddedLine) => void;
  addToBagRef?: (el: HTMLDivElement | null) => void;
}) {
  const bag = useBag();
  const wishlist = useWishlist();
  const colour = product.colours[colourIndex];
  const saved = wishlist.has(product.id);

  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [personaliseOpen, setPersonaliseOpen] = useState(false);
  const [initials, setInitials] = useState<string[]>(["", "", ""]);
  const [finish, setFinish] = useState<(typeof FINISHES)[number]>("Gold");
  const [savedInitials, setSavedInitials] = useState<{ text: string; finish: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const disabled = product.availability === "sold-out";
  const initialsText = initials.filter(Boolean).join(".") + (initials.some(Boolean) ? "." : "");

  function handleAddToBag() {
    if (disabled || !colour.available || status !== "idle") return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      bag.add(product.id, colour.name, 1, { initials: savedInitials?.text, finish: savedInitials?.finish });
      setTimeout(() => {
        setStatus("idle");
        onAdded({ colourName: colour.name, material: product.material, initials: savedInitials?.text, finish: savedInitials?.finish });
      }, 1400);
    }, 600);
  }

  function handleInitialChange(i: number, value: string) {
    const char = value.slice(-1).toUpperCase();
    if (char && !/^[A-Z]$/.test(char)) return;
    setInitials((prev) => prev.map((v, idx) => (idx === i ? char : v)));
    if (char && i < 2) inputRefs.current[i + 1]?.focus();
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 desk:w-[456px] desk:gap-8">
      <div className="flex w-full flex-col items-start gap-2 desk:gap-3">
        <p className="type-eyebrow text-accent-deep">{product.eyebrow}</p>
        <h1 className="type-product-mobile text-ink desk:type-product">{product.name}</h1>
        <p className="type-italic text-accent-deep">{product.tagline}</p>
        <div className="flex items-baseline gap-3 pt-1">
          <p className="type-price-lg text-ink">{formatPrice(product.price, product.currency)}</p>
          <p className="type-caption text-ink-muted">or 4 payments of {formatPrice(product.price / 4, product.currency)}</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex items-center gap-3">
          <p className="type-eyebrow text-ink">COLOUR</p>
          <p className="type-caption text-ink-muted">{colour.available ? colour.name : `${colour.name} — Sold out`}</p>
        </div>
        <div className="-ml-2 flex flex-wrap">
          {product.colours.map((c, i) => (
            <ColorSwatch key={c.name} hex={c.hex} name={c.name} available={c.available} selected={i === colourIndex} onClick={() => onColourChange(i)} />
          ))}
        </div>
      </div>

      {product.personalise && (
        <div className="flex w-full flex-col items-start gap-5 rounded-pill bg-surface p-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="type-h4 text-ink">Add Your Initials</p>
              <p className="type-caption text-ink-muted">
                {savedInitials ? `${savedInitials.text} (${savedInitials.finish})` : "Complimentary hot-stamped monogram"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPersonaliseOpen((v) => !v)}
              aria-expanded={personaliseOpen}
              aria-label={personaliseOpen ? "Collapse personalisation" : "Add your initials"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bg text-ink"
            >
              {personaliseOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
            </button>
          </div>

          {personaliseOpen && (
            <>
              <div className="flex items-start gap-3">
                {initials.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    value={val}
                    onChange={(e) => handleInitialChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !val && i > 0) inputRefs.current[i - 1]?.focus();
                    }}
                    maxLength={1}
                    aria-label={`Initial ${i + 1}`}
                    className="type-h1-mobile size-14 rounded-pill border border-line bg-bg text-center text-ink focus:border-[1.5px] focus:border-accent-deep focus:outline-none"
                  />
                ))}
              </div>
              <div className="flex flex-col items-start gap-3">
                <p className="type-eyebrow text-ink">FINISH</p>
                <div className="flex flex-wrap gap-2">
                  {FINISHES.map((f) => (
                    <FilterChip key={f} active={finish === f} onClick={() => setFinish(f)}>
                      {f}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="flex w-full items-center gap-3 rounded-pill bg-bg px-4 py-3">
                <span
                  className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111]"
                  style={{ color: finish === "Silver" ? "#c7c9cc" : finish === "Gold" ? "#d4b26a" : "#3a3a3a" }}
                >
                  <span className="type-badge">{initialsText || "—"}</span>
                </span>
                <p className="type-caption text-ink-muted">Preview — {finish.toLowerCase()} on black hangtag</p>
              </div>
              <div className="flex w-full items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSavedInitials(initials.some(Boolean) ? { text: initialsText, finish } : null);
                    setPersonaliseOpen(false);
                  }}
                  className="type-button flex-1 rounded-pill bg-ink px-8 py-[17px] text-surface"
                >
                  Save initials
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInitials(["", "", ""]);
                    setPersonaliseOpen(false);
                  }}
                  className="type-button px-2 py-2 text-ink"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div ref={addToBagRef} className="flex w-full flex-col items-start gap-3">
        {colour.available ? (
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={disabled || status !== "idle"}
            className={`type-button flex h-[53px] w-full items-center justify-center gap-3 rounded-pill transition-colors focus-visible:outline-none focus-visible:border-2 focus-visible:border-accent-deep ${
              disabled ? "bg-ink text-surface opacity-35" : status === "success" ? "bg-accent-deep text-surface" : "bg-ink text-surface hover:bg-accent-deep"
            }`}
          >
            {status === "loading" ? (
              <>
                <span>Adding</span>
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </>
            ) : status === "success" ? (
              <>
                <CheckIcon size={18} />
                <span>Added to bag</span>
              </>
            ) : (
              <span>Add to bag</span>
            )}
          </button>
        ) : (
          <NotifyMe productName={product.name} colourName={colour.name} />
        )}

        <div className="flex w-full items-start gap-3">
          <button
            type="button"
            onClick={() => wishlist.toggle(product.id)}
            aria-pressed={saved}
            className={`type-button flex h-[53px] flex-1 items-center justify-center rounded-pill bg-surface text-ink ${saved ? "border border-accent-deep" : ""}`}
          >
            {saved ? "Saved to wishlist" : "Save to wishlist"}
          </button>
          <button type="button" className="type-button flex h-[53px] flex-1 items-center justify-center rounded-pill bg-surface text-ink">
            Find in store
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-3">
        <p className="type-caption text-ink">{POLICY_COPY.ships}</p>
        <p className="type-caption text-ink">{POLICY_COPY.freeReturns}</p>
        <p className="type-caption text-ink">Lifetime leather care by our artisans</p>
      </div>

      <div className="flex w-full flex-col items-start border-b border-line">
        <AccordionItem level={2} title="DESCRIPTION" defaultOpen>
          {product.description}
        </AccordionItem>
        <AccordionItem level={2} title="DETAILS & DIMENSIONS">
          <div className="flex flex-col gap-1">
            {product.details.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </AccordionItem>
        <AccordionItem level={2} title="CARE">{product.care}</AccordionItem>
        <AccordionItem level={2} title="DELIVERY & RETURNS">{DELIVERY_RETURNS}</AccordionItem>
      </div>
    </div>
  );
}

function NotifyMe({ productName, colourName }: { productName: string; colourName: string }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="flex w-full flex-col items-start gap-2">
        <EmailField className="w-full" />
        <p className="type-caption text-ink-muted">We’ll email you once — the moment {colourName} returns.</p>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Notify me when ${productName} in ${colourName} is available`}
      className="type-button flex h-[53px] w-full items-center justify-center gap-3 rounded-pill border border-ink bg-surface text-ink"
    >
      Notify me when available
      <ArrowIcon size={18} />
    </button>
  );
}
