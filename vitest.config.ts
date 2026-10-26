import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        "**/e2e/**", // Exclude Playwright e2e tests
        "**/*.e2e.{test,spec}.{js,ts,jsx,tsx}",
      ],
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: false,
          isolate: true,
          useAtomics: true,
        },
      },
      testTimeout: 30000, // 30 seconds for individual tests
      hookTimeout: 30000, // 30 seconds for hooks
      teardownTimeout: 30000, // 30 seconds for teardown
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          ".next/",
          "vitest.config.ts",
          "vitest.setup.ts",
          "**/*.d.ts",
          "**/*.config.*",
          "**/mockData/**",
        ],
      },
      env: {
        NEXT_PUBLIC_SUPABASE_URL:
          env.NEXT_PUBLIC_SUPABASE_URL ||
          "https://whcwffuchlyjqhdpdwwi.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGl4dWpnanN6ZXJqYmJ2Y3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTM2ODMsImV4cCI6MjA4NTcyOTY4M30.m5SBtetDYsRg9S5EeLOk8or5Ce_VIMcuN8zK0e7ojp8",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
  };
});
