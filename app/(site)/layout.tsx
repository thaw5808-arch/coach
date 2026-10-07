import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-clip">
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
