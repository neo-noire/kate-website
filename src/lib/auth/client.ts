import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Talks to /api/auth on whatever host served the page.
export const authClient = createAuthClient({ plugins: [emailOTPClient()] });
