/**
 * Where to go after signing in: a same-site path from the `next` query parameter, else the
 * dashboard. Rejects absolute and protocol-relative URLs so the parameter can't send people
 * to another site.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  return next;
}
