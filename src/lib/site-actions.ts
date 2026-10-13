"use server";

import { hasLocale } from "next-intl";
import { db } from "@/db";
import { contactMessage, newsletterSubscriber } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";

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
  const session = await getSession();
  await db.insert(contactMessage).values({
    id: crypto.randomUUID(),
    name,
    email,
    message,
    locale: locale(form.locale),
    userId: session?.user.id ?? null,
  });
  return true;
}

/** Adds an email to the newsletter list. Signing up twice is harmless. */
export async function subscribeToNewsletter(form: { email: string; locale: string; website?: string }): Promise<boolean> {
  if (form.website) return true;
  const email = text(form.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return false;
  await db.insert(newsletterSubscriber).values({ email, locale: locale(form.locale) }).onConflictDoNothing();
  return true;
}
