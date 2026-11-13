"use server";

import { hasLocale } from "next-intl";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessage, newsletterSubscriber, user } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { adminEmails, getSession } from "@/lib/auth/session";
import { sendEmailQuietly } from "@/lib/email";
import { contactNotificationEmail } from "@/lib/emails";
import { allowPublicAction, clientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { after } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function locale(value: unknown) {
  return typeof value === "string" && hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

/**
 * Saves a message from the contact form for the admins. `website` is a hidden field people never
 * fill in; bots that do get a success response and nothing is stored.
 */
export async function sendContactMessage(form: {
  name: string;
  email: string;
  message: string;
  locale: string;
  website?: string;
}): Promise<boolean> {
  if (form.website) return true;
  const name = text(form.name, 60);
  const email = text(form.email, 254).toLowerCase();
  const message = text(form.message, 5000);
  if (!name || !message || !EMAIL.test(email)) return false;
  if (!(await allowPublicAction("contact", { max: 5, windowSeconds: 60 * 60 }))) return false;
  const session = await getSession();
  await db.insert(contactMessage).values({
    id: crypto.randomUUID(),
    name,
    email,
    message,
    locale: locale(form.locale),
    userId: session?.user.id ?? null,
  });
  const h = await headers();
  const adminUrl = `https://${h.get("x-forwarded-host") ?? h.get("host")}/${routing.defaultLocale}/admin`;
  const adminAccounts = await db.query.user.findMany({ where: eq(user.role, "admin"), columns: { email: true } });
  const admins = [...new Set([...adminEmails(), ...adminAccounts.map((account) => account.email.toLowerCase())])];
  if (!admins.length) console.warn("Contact message saved but not emailed: no admin has an email address (ADMIN_EMAILS or an admin account)");
  // after() keeps the function alive until the emails are out; a bare promise is dropped once the response is sent.
  after(() =>
    Promise.all(admins.map((admin) => sendEmailQuietly({ to: admin, ...contactNotificationEmail({ name, email, message, adminUrl }) }))),
  );
  return true;
}

/** Adds an email to the newsletter list. Signing up twice is harmless. */
export async function subscribeToNewsletter(form: {
  email: string;
  locale: string;
  website?: string;
  /** The consent sentence the person ticked, kept as proof. */
  consentText?: string;
}): Promise<boolean> {
  if (form.website) return true;
  const email = text(form.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return false;
  if (!(await allowPublicAction("newsletter", { max: 5, windowSeconds: 60 * 60 }))) return false;
  await db
    .insert(newsletterSubscriber)
    .values({ email, locale: locale(form.locale), consentText: text(form.consentText, 300) || null, ipAddress: await clientIp() })
    .onConflictDoNothing();
  return true;
}
