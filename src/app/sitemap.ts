import type { MetadataRoute } from "next";
import { marketingOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = marketingOrigin();
  const now = new Date();
  return [
    {
      url: origin,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/snapflow`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
