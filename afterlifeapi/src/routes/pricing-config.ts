

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { getPersonaPriceXrun } from "../lib/appConfig";

export const pricingConfig = new Hono<AppEnv>();

pricingConfig.get("/persona-price", async (c) => {
  const priceXrun = await getPersonaPriceXrun(c.env);
  c.header("Cache-Control", "public, max-age=60");
  return c.json({ priceXrun });
});
