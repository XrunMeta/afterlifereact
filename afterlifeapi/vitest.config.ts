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

      fileParallelism: false,
      hookTimeout: 60_000,
      poolOptions: {
        workers: {

          singleWorker: true,
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            compatibilityDate: "2024-12-01",
            compatibilityFlags: ["nodejs_compat"],

            bindings: {
              TEST_MIGRATIONS: migrations,
              ORCH_SECRET: "test-orch-secret",

              JWT_ACCESS_SECRET: "test-jwt-access-secret-for-vitest",

              JWT_REFRESH_SECRET: "test-jwt-refresh-secret-for-vitest",

              LEARN_SECRET: "test-learn-secret",

              DEV_SECRET: "test-dev-secret",

              AUDIT_SECRET: "test-audit-secret-for-vitest",

              MASTER_ROOT: "dGVzdC1tYXN0ZXItcm9vdC0zMmJ5dGVzLXBhZGRpbmc=",
              ALE_KEK: "dGVzdC1hbGUta2VrLTMyYnl0ZXMtcGFkZGluZyEhISE=",

              FACE_CALIBRATE_ENABLED: "1",

              FACE_CONSENT_ENFORCED: "true",
            },
          },
        },
      },
    },
  };
});
