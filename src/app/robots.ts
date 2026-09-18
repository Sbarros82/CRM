import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostRole, marketingOrigin } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const role = hostRole((await headers()).get("host"));
  const origin = marketingOrigin();

  if (role === "app") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/snapflow"],
        disallow: [
          "/login",
          "/signup",
          "/forgot-password",
          "/join",
          "/dashboard",
          "/inbox",
          "/contacts",
          "/pipelines",
          "/broadcasts",
          "/automations",
          "/settings",
          "/chat",
          "/appointments",
          "/flows",
          "/guia",
          "/radar",
          "/api/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https:\/\//, ""),
  };
}
