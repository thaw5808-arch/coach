/** Decorative background ellipse (Figma "Blob", fill color/blob). */
export function Blob({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute z-0 rounded-[50%] bg-blob ${className}`} />;
}
