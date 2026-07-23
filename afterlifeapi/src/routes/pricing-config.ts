

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_916830 } from "../lib/appConfig";

export const v_110512 = new v_b7c41b<v_de0a25>();

v_110512.get("/persona-price", async (v_3f4e2e) => {
  const v_318e8b = await v_916830(v_3f4e2e.env);
  v_3f4e2e.header("Cache-Control", "public, max-age=60");
  return v_3f4e2e.json({ priceXrun: v_318e8b });
});
