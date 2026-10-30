import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    hookTimeout: 60_000,
    testTimeout: 30_000,
    env: { DATABASE_URL: "", BETTER_AUTH_SECRET: "test-only-secret-not-used-anywhere-else" },
  },
});
