import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Talks to /api/auth on whatever host served the page. The page language rides along so emails
// (verification and password reset codes) are written in it.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  fetchOptions: {
    onRequest(context) {
      context.headers.set("x-locale", document.documentElement.lang);
    },
  },
});
