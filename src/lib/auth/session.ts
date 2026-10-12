import "server-only";
import { headers } from "next/headers";
import { auth } from "./server";

/** Emails from the ADMIN_EMAILS setting (comma separated), lowercased. */
function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Admins can edit the catalog and grant access. The ADMIN_EMAILS setting is the main list;
 * a user's `role` column can also make them an admin.
 */
export function isAdmin(user: { email: string; role?: string | null }) {
  return user.role === "admin" || adminEmails().has(user.email.toLowerCase());
}

/** The signed-in user's session for this request, or null. Reads request headers. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export class NotAuthorizedError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/** The session of a signed-in admin; throws for anyone else. For server actions. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdmin(session.user)) throw new NotAuthorizedError();
  return session;
}
