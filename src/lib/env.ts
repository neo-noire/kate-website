import { z } from "zod";

/**
 * Checks the environment once at server start (see src/instrumentation.ts), so a deployment with a
 * missing or mismatched setting fails loudly instead of breaking sign-in or checkout at runtime.
 * Every rule here mirrors how the code uses the variable.
 */

const optional = z.string().trim().optional().transform((value) => value || undefined);
const email = z.string().trim().email();

export const envSchema = z
  .object({
    DATABASE_URL: z.string().trim().startsWith("postgres", "must be a Postgres connection string"),
    DATABASE_URL_UNPOOLED: optional,
    BETTER_AUTH_SECRET: z.string().trim().min(32, "must be at least 32 characters (openssl rand -base64 32)"),
    BETTER_AUTH_URL: optional,
    ADMIN_EMAILS: optional,
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    STRIPE_SECRET_KEY: optional,
    STRIPE_WEBHOOK_SECRET: optional,
    RESEND_API_KEY: optional,
    VERCEL_ENV: optional,
  })
  .superRefine((env, ctx) => {
    const problem = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    for (const address of env.ADMIN_EMAILS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []) {
      if (!email.safeParse(address).success) problem("ADMIN_EMAILS", `"${address}" is not an email address`);
    }

    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      problem("GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together");
    }

    if (Boolean(env.STRIPE_SECRET_KEY) !== Boolean(env.STRIPE_WEBHOOK_SECRET)) {
      problem("STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set together");
    }
    if (env.STRIPE_SECRET_KEY && !/^[sr]k_(test|live)_/.test(env.STRIPE_SECRET_KEY)) {
      problem("STRIPE_SECRET_KEY", "must be a Stripe secret or restricted key (sk_… or rk_…), not the publishable pk_… key");
    }
    if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
      problem("STRIPE_WEBHOOK_SECRET", "must be a webhook signing secret (whsec_…)");
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Settings that are legal but not what a live shop wants. Logged, never fatal: a test key must not take the site down. */
export function envWarnings(env: Env): string[] {
  const warnings: string[] = [];
  if (env.VERCEL_ENV === "production" && env.STRIPE_SECRET_KEY && !/^[sr]k_live_/.test(env.STRIPE_SECRET_KEY)) {
    warnings.push("STRIPE_SECRET_KEY is a test key: checkout runs in Stripe test mode and takes no real payments");
  }
  return warnings;
}

/** Validates `source` (the process environment by default). Throws one error listing every problem. */
export function validateEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) {
    for (const warning of envWarnings(result.data)) console.warn(`[env] ${warning}`);
    return result.data;
  }
  const lines = result.error.issues.map((issue) => `  ${issue.path.join(".") || "env"}: ${issue.message}`);
  throw new Error(`Environment is not configured correctly:\n${lines.join("\n")}\nSee .env.example.`);
}
