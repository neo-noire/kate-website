/** Google sign-in switches on once GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. Server-only. */
export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Email verification (6-digit codes sent with Resend) switches on once RESEND_API_KEY is set. Server-only. */
export const emailEnabled = Boolean(process.env.RESEND_API_KEY);
