const TIPS = [
  { n: "01", title: "Let It Breathe", body: "Store your bag in its dust bag, lightly stuffed, away from direct sunlight and heat." },
  { n: "02", title: "Treat Gently", body: "Wipe with a soft, dry cloth. Avoid water, alcohol and household cleaners." },
  { n: "03", title: "Return to Us", body: "Our artisans will condition and repair your piece — complimentary, for life." },
];

/** Figma "While You Wait" (Order Confirmation Desktop 63:174 / Mobile 64:260) — editorial leather-care tips. */
export function WhileYouWait() {
  return (
    <div className="flex w-full flex-col items-start gap-8 px-4 pb-16 pt-16 desk:gap-12 desk:px-[clamp(24px,6.667vw,96px)] desk:pb-0 desk:pt-32">
      <div className="flex flex-col items-start gap-2 desk:gap-3">
        <p className="type-eyebrow text-accent-deep">WHILE YOU WAIT</p>
        <h2 className="type-h1-mobile text-ink desk:type-h1">Caring for Your Leather</h2>
      </div>
      <div className="flex w-full flex-col gap-8 desk:flex-row desk:gap-12">
        {TIPS.map((tip) => (
          <div key={tip.n} className="flex w-full flex-col items-start gap-2 border-t border-line pt-5 desk:flex-1 desk:gap-3 desk:pt-6">
            <p className="type-eyebrow text-accent-deep">{tip.n}</p>
            <p className="type-h3 text-ink">{tip.title}</p>
            <p className="type-body text-ink-muted">{tip.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
