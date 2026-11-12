import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests run in plain Node: Next-only modules are swapped for small stubs in tests/stubs.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)),
      "next/cache": fileURLToPath(new URL("./tests/stubs/next-cache.ts", import.meta.url)),
      "next/headers": fileURLToPath(new URL("./tests/stubs/next-headers.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // The database tests share one schema, so they must not run at the same time.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
