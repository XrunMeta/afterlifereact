

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_99e8be } from "../lib/appConfig";

export const v_b92a72 = new v_b7c41b<v_de0a25>();

v_b92a72.get("/ad-messages", async (v_3f4e2e) => {
  const v_fa56e0 = await v_99e8be(v_3f4e2e.env);
  v_3f4e2e.header("Cache-Control", "no-store, must-revalidate");
  return v_3f4e2e.json({ messages: v_fa56e0 });
});
