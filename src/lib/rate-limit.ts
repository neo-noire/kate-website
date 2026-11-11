import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { rateLimit } from "@/db/schema";

/**
 * A fixed-window counter in the database, shared by every serverless instance. One row per key;
 * the count restarts when the window has passed since the last request.
 * ponytail: fixed window, not sliding; good enough for forms and promo checks. Move to Upstash if traffic grows.
 */
export async function consumeRateLimit(key: string, { max, windowSeconds }: { max: number; windowSeconds: number }) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const [row] = await db
    .insert(rateLimit)
    .values({ key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.lastRequest} < ${windowStart} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: now,
      },
    })
    .returning({ count: rateLimit.count });
  return { allowed: row.count <= max, count: row.count };
}

/** The caller's IP as Vercel reports it, for keying public (signed-out) actions. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/** Rate limit for a public server action, keyed by action name and caller IP. */
export async function allowPublicAction(action: string, limits: { max: number; windowSeconds: number }) {
  return (await consumeRateLimit(`action:${action}:${await clientIp()}`, limits)).allowed;
}
