import { notFound } from "next/navigation";
import { OfflinePreview } from "./OfflinePreview";

/** Dev-only: /__test/offline renders the offline card without cutting the connection. */
export default function TestOfflinePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <OfflinePreview />;
}
