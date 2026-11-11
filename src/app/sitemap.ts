import type { MetadataRoute } from "next";
import { LEGAL_DOCS } from "@/content/legal";
import { routing } from "@/i18n/routing";
import { getPublishedCoursePaths } from "@/lib/catalog/queries";
import { siteOrigin } from "@/lib/site-url";

/** Every public page in every language, with hreflang alternates. Private pages are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", ...LEGAL_DOCS.map((doc) => `/${doc}`), ...(await getPublishedCoursePaths())];
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteOrigin}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteOrigin}/${l}${path}`])),
      },
    })),
  );
}
