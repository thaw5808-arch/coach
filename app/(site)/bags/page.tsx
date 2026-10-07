import { connection } from "next/server";
import { CategoryPage, categoryMetadata } from "@/components/category/CategoryPage";
import { bags } from "@/lib/categories";

export const metadata = categoryMetadata(bags);

export default async function BagsPage() {
  // Render per request so the filtered grid (?type=…&colour=…) is in the server HTML, not client-only.
  await connection();
  return <CategoryPage category={bags} />;
}
