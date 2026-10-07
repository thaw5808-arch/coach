import type { Metadata } from "next";
import { HomeDesktop } from "@/components/home/HomeDesktop";
import { HomeMobile } from "@/components/home/HomeMobile";
import { ogImagePath, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "COACH — Carried Through Every Chapter",
  absoluteTitle: true,
  description: "Heritage leather bags shaped by master artisans, designed to grow richer with time.",
  path: "/",
  image: ogImagePath("home"),
  imageAlt: "Three COACH shoulder bags on a pale blue stage",
});

export default function HomePage() {
  return (
    <div className="[--m:calc(min(100vw,390px)/390)] [--u:calc(min(100vw,1440px)/1440)]">
      <HomeDesktop />
      <HomeMobile />
    </div>
  );
}
