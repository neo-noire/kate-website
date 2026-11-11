/** The production site's origin, from Vercel's project setting; used for canonical URLs, sitemap and robots. */
export const siteOrigin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "katematus-website.vercel.app"}`;
