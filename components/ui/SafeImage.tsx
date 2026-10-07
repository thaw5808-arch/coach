"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** next/image with a quiet fallback so a missing asset never breaks the layout. */
export function SafeImage({ alt, className = "", ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span role="img" aria-label={alt} className={`block size-full rounded-[24px] bg-blob ${className}`} />;
  }
  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
