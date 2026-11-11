import "server-only";

export type Email = { to: string; subject: string; text: string };

/** Sends a plain-text email through Resend. Throws when Resend rejects it, so failures aren't silent. */
export async function sendEmail({ to, subject, text }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  // Validated together with RESEND_API_KEY at startup (src/lib/env.ts); Resend's test sender only
  // delivers to the account owner, so it is never a usable default.
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
}

/** Sends without failing the caller: for notifications that must not break a purchase or a form. */
export async function sendEmailQuietly(email: Email) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await sendEmail(email);
  } catch (error) {
    console.error(`Email "${email.subject}" to ${email.to} failed`, error);
  }
}
