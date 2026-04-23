import { v_ba7107 } from "xualxe";
import { v_4fe4e1, v_c9c489 } from "lwkoweqmjbnvjqw";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    TEST_MIGRATIONS: unknown;
  }
}

v_ba7107(async () => {
  await v_4fe4e1(
    v_c9c489.DB as unknown as D1Database,
    v_c9c489.TEST_MIGRATIONS as never,
  );
});
