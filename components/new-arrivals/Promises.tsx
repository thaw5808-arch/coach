const promises = [
  {
    n: "01",
    title: "Complimentary Delivery",
    body: "Every new arrival ships free, wrapped in our signature dust bag and box.",
  },
  {
    n: "02",
    title: "Lifetime Leather Care",
    body: "Bring your piece back to our artisans for conditioning and repair, for as long as you carry it.",
  },
  {
    n: "03",
    title: "Made to Be Yours",
    body: "Add initials or a monogrammed hangtag — personalisation is complimentary on new arrivals.",
  },
];

/** Figma "Promises" row (103:158 desktop / 103:1394 mobile). */
export function Promises() {
  return (
    <div className="relative z-10 flex w-full flex-col gap-8 px-4 py-16 desk:flex-row desk:gap-12 desk:px-0 desk:py-32">
      {promises.map((p) => (
        <div key={p.n} className="flex w-full flex-col items-start gap-2 border-t border-line pt-5 desk:flex-1 desk:gap-3 desk:pt-6">
          <p className="type-eyebrow text-accent-deep">{p.n}</p>
          <p className="type-h3 text-ink">{p.title}</p>
          <p className="type-body text-ink-muted">{p.body}</p>
        </div>
      ))}
    </div>
  );
}
