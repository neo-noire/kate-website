import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { googleEnabled } from "./providers";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "katematus-website.vercel.app";
const vercelHosts = [
  productionHost,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
].filter((host): host is string => Boolean(host));

export const auth = betterAuth({
  appName: "RITMO",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // The site answers on several Vercel hostnames (production domain, aliases and previews), so
  // the base URL follows the request host, limited to this project's hosts. Vercel sets the
  // VERCEL_* host variables, so renaming the domain or adding a custom one needs no code change.
  baseURL: {
    allowedHosts: [
      ...vercelHosts,
      "kate-website-*.vercel.app",
      "localhost:*",
    ],
    fallback: process.env.BETTER_AUTH_URL ?? `https://${productionHost}`,
  },
  user: {
    // Read-only for users: sign-up and profile updates can't set it.
    additionalFields: { role: { type: "string", defaultValue: "student", input: false } },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
  account: {
    // Google verifies email addresses, so signing in with Google joins an existing
    // email + password account with the same address instead of failing.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  session: {
    // Keep a short-lived signed copy of the session in a cookie to skip a database read per request.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Lets Server Actions and Server Components set the session cookie.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
