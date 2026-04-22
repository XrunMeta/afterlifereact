import { beforeAll } from "vitest";
import { applyD1Migrations, env } from "cloudflare:test";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    TEST_MIGRATIONS: unknown;
  }
}

beforeAll(async () => {
  await applyD1Migrations(
    env.DB as unknown as D1Database,
    env.TEST_MIGRATIONS as never,
  );
});
