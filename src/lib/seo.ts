import type { Metadata } from "next";
import { marketingOrigin } from "@/lib/site";

export const SEO = {
  name: "Snap",
  locale: "pt_BR",
  localeBcp47: "pt-BR",
  title: "Snap — CRM no WhatsApp para o seu time",
  description:
    "Inbox compartilhado, funil de vendas, transmissões oficiais da Meta e fluxos no WhatsApp. A IA tria; o consultor fecha. Sem inventar preço.",
  flowTitle: "Snap Flow — menus e FAQ no WhatsApp",
  flowDescription:
    "Fluxo com lista, FAQ e handoff para o consultor. A triagem é automática; quem fecha é gente.",
  keywords: [
    "CRM WhatsApp",
    "WhatsApp Business API",
    "inbox compartilhado WhatsApp",
    "funil de vendas WhatsApp",
    "automação WhatsApp",
    "Snap CRM",
    "atendimento WhatsApp equipe",
    "Cloud API Meta",
  ],
} as const;

export function marketingMetadata(page: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const origin = marketingOrigin();
  const path = page.path ?? "/";
  const url = `${origin}${path === "/" ? "" : path}`;
  return {
    title: page.title,
    description: page.description,
    keywords: [...SEO.keywords],
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "website",
      locale: SEO.locale,
      url,
      siteName: SEO.name,
      title: page.title,
      description: page.description,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}
