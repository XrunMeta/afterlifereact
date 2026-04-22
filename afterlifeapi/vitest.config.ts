import { v_eede73 } from "lglybjtrblawvhelckmsskhtmgauymjbzwkzpm";

export default v_eede73({
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
