

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { getGiftCatalog } from "../lib/appConfig";

export const gifts = new Hono<AppEnv>();

gifts.get("/catalog", async (c) => {
  const items = await getGiftCatalog(c.env);

  c.header("Cache-Control", "no-store, must-revalidate");
  return c.json({ items });
});
