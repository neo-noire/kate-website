/** Runs once when the server starts. A misconfigured deployment fails here, before it serves a request. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv } = await import("@/lib/env");
  validateEnv();
}
