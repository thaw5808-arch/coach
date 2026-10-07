import { notFound } from "next/navigation";

/** Dev-only: the root layout's DevErrorTrigger throws on this path, showing app/global-error.tsx. */
export default function TestGlobalErrorPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return null;
}
