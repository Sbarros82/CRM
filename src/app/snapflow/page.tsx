import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Snap Flow — menus e FAQ no WhatsApp",
  description:
    "Fluxo com botões, listas e handoff para o consultor. A triagem é automática; quem fecha é gente.",
  robots: { index: true, follow: true },
};

export default function SnapFlowPage() {
  return <LandingPage product="snapflow" />;
}
