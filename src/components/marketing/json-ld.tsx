import { SEO } from "@/lib/seo";
import { marketingOrigin } from "@/lib/site";

export function JsonLd({ product = "snap" }: { product?: "snap" | "snapflow" }) {
  const origin = marketingOrigin();
  const isFlow = product === "snapflow";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#org`,
        name: SEO.name,
        url: origin,
        logo: `${origin}/icon.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: SEO.name,
        inLanguage: SEO.localeBcp47,
        publisher: { "@id": `${origin}/#org` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#app`,
        name: isFlow ? "Snap Flow" : "Snap",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: isFlow ? `${origin}/snapflow` : origin,
        description: isFlow ? SEO.flowDescription : SEO.description,
        inLanguage: SEO.localeBcp47,
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/OnlineOnly",
          url: origin,
          description:
            "Demonstração com consultor no WhatsApp. Valor combinado com o time.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
