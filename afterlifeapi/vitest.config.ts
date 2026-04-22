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
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            compatibilityDate: "2024-12-01",
            compatibilityFlags: ["nodejs_compat"],
            bindings: { TEST_MIGRATIONS: v_9b8aa1 },
          },
        },
      },
    },
  };
});
