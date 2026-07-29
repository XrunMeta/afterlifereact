

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { getGoogleEnabled } from "../lib/appConfig";

export const authConfig = new Hono<AppEnv>();

authConfig.get("/", async (c) => {
  const g = await getGoogleEnabled(c.env);
  c.header("Cache-Control", "public, max-age=60");
  return c.json({
    googleEnabled: { ios: g.ios, android: g.android },
    updatedAt: g.updatedAt,
  });
});
