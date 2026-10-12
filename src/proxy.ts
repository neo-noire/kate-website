import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Redirects paths without a locale (e.g. "/") to the saved language (NEXT_LOCALE cookie),
// then the browser's Accept-Language, then English.
const intl = createMiddleware(routing);

const signedInOnly = new RegExp(`^/(${routing.locales.join("|")})/dashboard(?:/|$)`);

export default function proxy(request: NextRequest) {
  // Fast path for signed-out visitors: no session cookie means no session. The dashboard
  // page still validates the session itself.
  const match = request.nextUrl.pathname.match(signedInOnly);
  if (match && !getSessionCookie(request)) {
    const signIn = new URL(`/${match[1]}/sign-in`, request.url);
    signIn.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(signIn);
  }
  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (images, icons, robots.txt).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
