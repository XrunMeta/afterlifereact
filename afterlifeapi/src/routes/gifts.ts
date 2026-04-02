import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";

export const v_68bb66 = new v_b7c41b<v_4bcb54>();

v_68bb66.get("/", async (v_3f4e2e) => {
  const v_43c42e = await v_3f4e2e.env.DB.prepare("SELECT * FROM gifts").all();
  return v_3f4e2e.json(v_43c42e.results);
});
