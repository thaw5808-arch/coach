import { SafeImage } from "@/components/ui/SafeImage";
import type { Product } from "@/lib/products";

/** Figma "The Craft" (Product Detail 29:2 node 29:151 / 32:172 node 32:287). */
export function CraftSection({ product }: { product: Product }) {
  if (!product.craft) return null;
  const { title, body, features } = product.craft;
  const image = product.colours[0].image;
  const hotspots = [
    { left: "27%", top: "40%" },
    { left: "46%", top: "51%" },
    { left: "77%", top: "48%" },
  ];

  return (
    // id="craft" — The House "How a Tabby is made" links here.
    <div id="craft" className="w-full scroll-mt-6 px-4 pt-16 desk:px-0 desk:pt-32">
      <div className="flex w-full flex-col overflow-hidden rounded-pill bg-surface desk:flex-row">
        <div className="relative h-[320px] w-full shrink-0 overflow-hidden desk:h-[600px] desk:w-[624px]">
          <span aria-hidden="true" className="pointer-events-none absolute z-0 left-[14%] top-[15%] h-[70%] w-[73%] rounded-[50%] bg-blob" />
          <div className="absolute left-1/2 top-1/2 size-[90%] max-w-[480px] -translate-x-1/2 -translate-y-1/2 -rotate-10">
            <SafeImage src={image.src} alt="" fill sizes="480px" className="object-contain" />
          </div>
          {hotspots.map((h, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="type-badge absolute flex size-7 items-center justify-center rounded-full border border-accent-deep bg-surface text-accent-deep desk:size-8"
              style={{ left: h.left, top: h.top }}
            >
              {features[i]?.n}
            </span>
          ))}
        </div>
        <div className="flex flex-col items-start gap-4 px-4 pb-8 pt-2 desk:flex-1 desk:gap-6 desk:px-24 desk:pl-12 desk:py-16">
          <p className="type-eyebrow text-accent-deep">THE CRAFT</p>
          <h2 className="type-h1-mobile text-ink desk:type-h1">{title}</h2>
          <p className="type-body text-ink-muted desk:type-body-lg desk:w-[440px]">{body}</p>
          <div className="flex w-full flex-col items-start">
            {features.map((f) => (
              <div key={f.n} className="flex w-full gap-3 border-t border-line py-4 desk:gap-4">
                <p className="type-eyebrow shrink-0 text-accent-deep">{f.n}</p>
                <div className="flex flex-col gap-1">
                  <p className="type-h4 text-ink desk:type-h3">{f.title}</p>
                  <p className="type-caption text-ink-muted desk:type-body">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
