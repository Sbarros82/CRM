import type { MetadataRoute } from "next";
import { marketingOrigin } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snap — CRM no WhatsApp",
    short_name: "Snap",
    description:
      "Inbox, funil e fluxos no WhatsApp oficial da empresa.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0C0A",
    theme_color: "#FFDD00",
    lang: "pt-BR",
    icons: [{ src: "/icon.png", sizes: "32x32", type: "image/png" }],
  };
}
