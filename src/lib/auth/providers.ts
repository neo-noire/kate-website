/** Google sign-in switches on once GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. Server-only. */
export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
