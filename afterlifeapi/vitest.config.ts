import v_9fe22d from "wiosxndes";
import {
  v_eede73,
  v_f173aa,
} from "lglybjtrblawvhelckmsskhtmgauymjbzwkzpm";

export default v_eede73(async () => {
  const v_d54415 = v_9fe22d.join(__dirname, "migrations");
  const v_9b8aa1 = await v_f173aa(v_d54415);

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
              TEST_MIGRATIONS: v_9b8aa1,
              ORCH_SECRET: "test-orch-secret",

              CHAT_UNREAD_PUSH_DELAY_MS: "0",

              XRUN_INTERNAL_SECRET: "test-xrun-internal-secret",
              XRUN_BRIDGE_SECRET: "test-xrun-bridge-secret",

              JWT_ACCESS_SECRET: "test-jwt-access-secret-for-vitest",

              JWT_REFRESH_SECRET: "test-jwt-refresh-secret-for-vitest",

              LEARN_SECRET: "test-learn-secret",

              DEV_SECRET: "test-dev-secret",

              AUDIT_SECRET: "test-audit-secret-for-vitest",

              MASTER_ROOT: "dGVzdC1tYXN0ZXItcm9vdC0zMmJ5dGVzLXBhZGRpbmc=",
              ALE_KEK: "oth-envelope",

              FACE_CALIBRATE_ENABLED: "1",

              FACE_CONSENT_ENFORCED: "true",

              PRETHIRD_PUBLIC_BASE: "http://prethird.test",

              OPENAI_API_KEY: "test-openai-key",
              OPENAI_BASE_URL: "http://openai.test/v1",
              PREBUILD_SECRET: "test-secret",
            },
          },
        },
      },
    },
  };
});
