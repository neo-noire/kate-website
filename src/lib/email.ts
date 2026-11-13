import "server-only";
import { EMAIL_FROM } from "@/lib/constants";

export type Email = { to: string; subject: string; text: string; html?: string; replyTo?: string };

/** Sends an email through Resend, as HTML with a plain-text copy. Throws when Resend rejects it, so failures aren't silent. */
export async function sendEmail({ to, subject, text, html, replyTo }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, text, html, reply_to: replyTo ?? EMAIL_FROM }),
  });
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
}

/** Sends without failing the caller: for notifications that must not break a purchase or a form. */
export async function sendEmailQuietly(email: Email) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`Email "${email.subject}" to ${email.to} not sent: RESEND_API_KEY is not set`);
    return;
  }
  try {
    await sendEmail(email);
  } catch (error) {
    console.error(`Email "${email.subject}" to ${email.to} failed`, error);
  }
}
