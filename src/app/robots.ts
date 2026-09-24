import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostRole, marketingOrigin } from "@/lib/site";

/**
 * robots.txt is always public — crawlers (and anyone) can open it.
 * We do NOT enumerate CRM paths here: on snap.ia.br those routes
 * redirect to app.snap.ia.br, and the app host disallows everything.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const role = hostRole((await headers()).get("host"));
  const origin = marketingOrigin();

  // CRM host: nothing should be indexed.
  if (role === "app") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  // Marketing host: only public site pages. No CRM route map.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https:\/\//, ""),
  };
}
