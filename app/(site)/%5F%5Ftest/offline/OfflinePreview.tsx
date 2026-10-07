"use client";

import { OfflineCard } from "@/components/errors/OfflineNotice";

export function OfflinePreview() {
  return (
    <div className="mx-auto w-full max-w-[576px] px-4 py-16 desk:py-24">
      <OfflineCard onRetry={() => window.location.reload()} />
    </div>
  );
}
