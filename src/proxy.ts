import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Redirects paths without a locale (e.g. "/") to the saved language (NEXT_LOCALE cookie),
// then the browser's Accept-Language, then English.
export default createMiddleware(routing);

export const config = {
  // Skip Next internals and files with an extension (images, icons, robots.txt).
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
