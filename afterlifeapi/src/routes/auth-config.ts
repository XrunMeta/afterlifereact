

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_508dab } from "../lib/appConfig";

export const v_037921 = new v_b7c41b<v_de0a25>();

v_037921.get("/", async (v_3f4e2e) => {
  const v_206b88 = await v_508dab(v_3f4e2e.env);
  v_3f4e2e.header("Cache-Control", "public, max-age=60");
  return v_3f4e2e.json({
    googleEnabled: { ios: v_206b88.ios, android: v_206b88.android },
    updatedAt: v_206b88.updatedAt,
  });
});
