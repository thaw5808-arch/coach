import { Button } from "@/components/ui/Button";
import { Blob } from "@/components/ui/Blob";
import { SafeImage } from "@/components/ui/SafeImage";
import { heroBags } from "./heroBags";

/*
 * Figma "P / Mobile / Home — Mobile 390" (103:1314).
 * The bag stage uses --m (1 Figma px at 390 wide) so it scales down on narrower phones.
 */
const m = (n: number) => `calc(${n} * var(--m))`;

export function HomeMobile() {
  return (
    <div className="desk:hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <Blob className="top-[-90px] right-[-100px] h-[217px] w-[240px]" />
        <Blob className="top-[700px] left-[-120px] h-[235px] w-[260px]" />
      </div>

      <section aria-labelledby="home-title-mobile" className="intro-fade relative z-10 flex min-h-[calc(100dvh-52px)] flex-col items-center pb-11">
        <h1 id="home-title-mobile" className="mt-[60px] max-w-[min(320px,calc(100%-32px))] text-center font-display text-[28px] font-bold leading-[1.2]">
          Carried Through Every Chapter
        </h1>

        <div className="relative mt-5 w-full max-w-[390px]" style={{ height: m(360) }}>
          <div className="absolute flex items-center justify-center" style={{ left: m(-6), top: m(121.84), width: m(205.94), height: m(205.94) }}>
            <div className="relative -rotate-9" style={{ width: m(180), height: m(180) }}>
              <SafeImage src={heroBags.signature.src} alt={heroBags.signature.alt} fill sizes="180px" className="object-cover" loading="eager" />
            </div>
          </div>
          <div className="absolute flex items-center justify-center" style={{ left: m(144.44), top: m(180), width: m(230.71), height: m(230.71) }}>
            <div className="relative rotate-20" style={{ width: m(180), height: m(180) }}>
              <SafeImage src={heroBags.bow.src} alt={heroBags.bow.alt} fill sizes="180px" className="object-cover" loading="eager" fetchPriority="high" />
            </div>
          </div>
          <div className="absolute" style={{ left: m(85), top: m(20), width: m(220), height: m(220) }}>
            <SafeImage src={heroBags.black.src} alt={heroBags.black.alt} fill sizes="220px" className="object-cover" loading="eager" />
          </div>
        </div>

        <p className="relative mt-[30px] max-w-[min(326px,calc(100%-32px))] text-center font-display text-[14px] font-bold leading-[22px] text-accent-deep">
          Born from heritage leather and shaped by master artisans, every Coach piece is designed to grow richer with time, carrying your story from the first day to the last.
        </p>

        <Button href="/new-arrivals" className="mt-[22px]">
          Shop new arrivals
        </Button>
        <Button href="/bags" variant="text" className="mt-3">
          Explore all bags
        </Button>
        {/* Home has no site footer (Figma 103:29); the concept-study note still has to be on screen (launch decision). */}
        <footer className="mt-8 px-4 text-center">
          <p className="type-caption text-ink-muted">© 2026 Coach — concept study. Not affiliated.</p>
        </footer>
      </section>
    </div>
  );
}
