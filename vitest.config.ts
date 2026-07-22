import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    fileParallelism: false, // integration tests share one SQLite file
    testTimeout: 15_000,
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      AUTH_SECRET: "test-secret",
      APP_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
