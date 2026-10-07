import { connection } from "next/server";
import { CategoryPage, categoryMetadata } from "@/components/category/CategoryPage";
import { women } from "@/lib/categories";

export const metadata = categoryMetadata(women);

export default async function WomenPage() {
  // Render per request so the filtered grid (?type=…&colour=…) is in the server HTML, not client-only.
  await connection();
  return <CategoryPage category={women} />;
}
