import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/*/dashboard", "/*/admin", "/*/sign-in", "/*/sign-up", "/*/forgot-password", "/api/"] },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
