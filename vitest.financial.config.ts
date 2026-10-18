import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/lib/payments/**/*.test.ts", "src/app/api/stripe/connect/financial-webhook/**/*.test.ts"],
    environment: "node",
  },
});
