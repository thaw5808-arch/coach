import { notFound } from "next/navigation";
import { ThrowOnce } from "./ThrowOnce";

/** Dev-only: /__test/error throws once inside the site, so the 500 card and its "Try again" can be QA'd. */
export default function TestErrorPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ThrowOnce />;
}
