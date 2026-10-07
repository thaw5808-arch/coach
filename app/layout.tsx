import type { Metadata, Viewport } from "next";
import "@fontsource/bona-nova/400.css";
import "@fontsource/bona-nova/400-italic.css";
import "@fontsource/bona-nova/700.css";
import "@fontsource/bona-nova-sc/400.css";
import "@fontsource/bona-nova-sc/700.css";
import "./globals.css";
import { BagProvider } from "@/lib/bag/BagContext";
import { WishlistProvider } from "@/lib/wishlist/WishlistContext";
import { SessionProvider } from "@/lib/auth/SessionContext";
import { DevErrorTrigger } from "@/components/errors/DevErrorTrigger";
import { OfflineNotice } from "@/components/errors/OfflineNotice";
import { OG_SIZE, SITE_NAME, SITE_URL, ogImagePath } from "@/lib/seo";

const DEFAULT_DESCRIPTION = "Heritage leather bags shaped by master artisans — a design concept study, not affiliated with Coach.";
const DEFAULT_IMAGES = [{ url: ogImagePath("home"), ...OG_SIZE, alt: "Three COACH shoulder bags on a pale blue stage" }];

/** Site-wide defaults; indexable pages override with lib/seo pageMetadata() (canonical + their own OG card). */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", title: SITE_NAME, description: DEFAULT_DESCRIPTION, images: DEFAULT_IMAGES },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: DEFAULT_DESCRIPTION, images: DEFAULT_IMAGES },
};

export const viewport: Viewport = { themeColor: "#f0f9ff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BagProvider>
          {/* Session wraps Wishlist: a signed-in account carries its saved pieces across devices. */}
          <SessionProvider>
            <WishlistProvider>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2">
              Skip to content
            </a>
            {children}
            <OfflineNotice />
            {process.env.NODE_ENV === "development" && <DevErrorTrigger />}
            </WishlistProvider>
          </SessionProvider>
        </BagProvider>
      </body>
    </html>
  );
}
