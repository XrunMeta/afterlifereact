

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_0edc13 } from "../lib/appConfig";

export const v_68bb66 = new v_b7c41b<v_de0a25>();

v_68bb66.get("/catalog", async (v_3f4e2e) => {
  const v_4622b9 = await v_0edc13(v_3f4e2e.env);

  v_3f4e2e.header("Cache-Control", "no-store, must-revalidate");
  return v_3f4e2e.json({ items: v_4622b9 });
});
