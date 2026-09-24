import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snap — Inbox e equipe",
    short_name: "Snap",
    description:
      "Conversas ao vivo no WhatsApp e chat interno da equipe. CRM completo no computador.",
    start_url: "/inbox",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0C0C0A",
    theme_color: "#0C0C0A",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/meta-app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/meta-app-icon-1024.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
