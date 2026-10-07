import type { Metadata } from "next";
import { ClientCareView } from "@/components/client-care/ClientCareView";
import { FAQS } from "@/lib/clientCare";
import { ogImagePath, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Client Care",
  description: "Contact Client Care, delivery and returns, leather care and answers to common questions — every day, 9am to 9pm.",
  path: "/client-care",
  image: ogImagePath("client-care"),
  imageAlt: "The Quilted Tabby on a pale blue stage",
});

/** FAQPage structured data — the same questions and answers the page renders. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
};

export default function ClientCarePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <ClientCareView />
    </>
  );
}
