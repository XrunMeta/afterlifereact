import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  ssr: {
    noExternal: ["tslib", /^@peculiar\//, "@simplewebauthn/server"],
  },
  test: {
    include: ["test/**/*.test.ts"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          compatibilityDate: "2024-12-01",
          compatibilityFlags: ["nodejs_compat"],
        },
      },
    },
  },
});
