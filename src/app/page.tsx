import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Snap — CRM no WhatsApp para o seu time",
  description:
    "Inbox compartilhado, funil, transmissões e IA que tria. O fechamento fica com o consultor.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <LandingPage />;
}
