import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { heroBags } from "./heroBags";

/*
 * Figma "P / Desktop / Coach2" (103:59), 1440 × 1024.
 * Every position is expressed in --u (1 Figma px at 1440 wide) so the composition
 * scales proportionally between 1024px and 1440px and stays centred beyond 1440px.
 * Top values are frame-y minus the 80px header.
 */
const u = (n: number) => `calc(${n} * var(--u))`;
const rise = (fromY: number) => ({ "--from-y": u(fromY) }) as CSSProperties;

function TiltedBag({ bag, box, rotate, left, top, fromY, lcp }: {
  bag: (typeof heroBags)[keyof typeof heroBags];
  box: number;
  rotate: number;
  left: number;
  top: number;
  fromY: number;
  lcp?: boolean;
}) {
  return (
    <div className="intro-rise absolute flex items-center justify-center" style={{ left: u(left), top: u(top), width: u(box), height: u(box), ...rise(fromY) }}>
      <div className="relative" style={{ width: u(393), height: u(393), transform: `rotate(${rotate}deg)` }}>
        <SafeImage src={bag.src} alt={bag.alt} fill sizes="(min-width: 1440px) 393px, 28vw" className="object-cover" loading="eager" fetchPriority={lcp ? "high" : "auto"} />
      </div>
    </div>
  );
}

export function HomeDesktop() {
  return (
    <div className="hidden desk:block">
      {/* Blob layer covers the full 1440×1024 frame, behind the header */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto overflow-hidden" style={{ width: u(1440), height: u(1024) }}>
        <span className="pointer-events-none absolute z-0 rounded-[50%] bg-blob" style={{ left: u(1201), top: u(-110), width: u(397), height: u(359) }} />
        <span className="pointer-events-none absolute z-0 rounded-[50%] bg-blob" style={{ left: u(-122), top: u(790), width: u(397), height: u(359) }} />
      </div>

      <section aria-labelledby="home-title" className="relative z-10 mx-auto" style={{ width: u(1440), height: u(944) }}>
        <h1
          id="home-title"
          className="intro-reveal absolute -translate-x-1/2 whitespace-nowrap font-display font-bold"
          style={{ left: u(732), top: u(80), fontSize: `max(24px, ${u(32)})`, lineHeight: 1.2 }}
        >
          Carried Through Every Chapter
        </h1>

        <TiltedBag bag={heroBags.signature} box={452.065} rotate={-9.43} left={16} top={335.47} fromY={649} />
        <div className="intro-rise absolute" style={{ left: u(475.53), top: u(206), width: u(428), height: u(428), ...rise(869) }}>
          <SafeImage src={heroBags.black.src} alt={heroBags.black.alt} fill sizes="(min-width: 1440px) 428px, 30vw" className="object-cover" loading="eager" />
        </div>
        <TiltedBag bag={heroBags.bow} box={505.524} rotate={20.45} left={918.27} top={308.74} fromY={909} lcp />

        {/* Intro copy + (launch decision) the concept-study note in flow beneath it — Home has no site footer (103:59). */}
        <div className="absolute flex flex-col items-start gap-3" style={{ left: u(30), top: u(810), width: u(372) }}>
          <p className="intro-rise font-display font-bold text-intro-soft" style={{ fontSize: `max(13px, ${u(16)})`, lineHeight: 1.25, ...rise(170) }}>
            Born from heritage leather and shaped by master artisans, every Coach piece is designed to grow richer with time, carrying your story from the first day to the last.
          </p>
          <footer>
            <p className="type-caption whitespace-nowrap text-ink-muted">© 2026 Coach — concept study. Not affiliated.</p>
          </footer>
        </div>
      </section>
    </div>
  );
}
