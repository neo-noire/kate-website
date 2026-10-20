import "server-only";

/** Sends a plain-text email through Resend. Throws when Resend rejects it, so failures aren't silent. */
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "RITMO <onboarding@resend.dev>", to, subject, text }),
  });
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
}
