import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/lib/payments/**/*.test.ts", "src/app/api/stripe/connect/financial-webhook/**/*.test.ts"],
    environment: "node",
  },
});
