import { connection } from "next/server";
import { CategoryPage, categoryMetadata } from "@/components/category/CategoryPage";
import { men } from "@/lib/categories";

export const metadata = categoryMetadata(men);

export default async function MenPage() {
  // Render per request so the filtered grid (?type=…&colour=…) is in the server HTML, not client-only.
  await connection();
  return <CategoryPage category={men} />;
}
