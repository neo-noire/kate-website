import "server-only";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getSession, isAdmin } from "./session";

/**
 * The signed-in admin's session for an admin page. Visitors who aren't signed in go to sign
 * in; signed-in non-admins get a 404, so the admin area isn't advertised.
 */
export async function requireAdminPage(next: string) {
  const locale = await getLocale();
  const session = await getSession();
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next } }, locale });
  if (!isAdmin(session.user)) notFound();
  return session;
}
