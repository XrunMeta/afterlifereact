import path from "node:path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    ssr: {
      noExternal: ["tslib", /^@peculiar\//, "@simplewebauthn/server"],
    },
    test: {
      include: ["test/**/*.test.ts"],
      setupFiles: ["./test/setup.ts"],
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            compatibilityDate: "2024-12-01",
            compatibilityFlags: ["nodejs_compat"],

            bindings: {
              TEST_MIGRATIONS: migrations,
              ORCH_SECRET: "test-orch-secret",

              JWT_ACCESS_SECRET: "test-jwt-access-secret-for-vitest",
            },
          },
        },
      },
    },
  };
});
