import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/json-ld";
import { LandingPage } from "@/components/marketing/landing-page";
import { marketingMetadata, SEO } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = marketingMetadata({
  title: SEO.flowTitle,
  description: SEO.flowDescription,
  path: "/snapflow",
});

export default function SnapFlowPage() {
  return (
    <>
      <JsonLd product="snapflow" />
      <LandingPage product="snapflow" />
    </>
  );
}
