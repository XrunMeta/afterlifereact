

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";

const v_0dc2a1 = {
  prethirdBase: "call.prethird_base",
  callRoute: "call.route",
  secondBase: "call.second_base",
} as const;

const v_aceddb = {
  prethirdBase: "https://rtc.example.invalid/prethird",
  callRoute: "prethird",
  secondBase: null as string | null,
};

const v_581122 = new Set(["prethird", "second"]);

interface ConfigRow {
  key: string;
  value: string;
  updated_at: number;
}

export const v_074a9b = new v_b7c41b<v_de0a25>();

v_074a9b.get("/", async (v_3f4e2e) => {
  const v_8f00b9 = await v_3f4e2e.env.DB.prepare(
    "SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?, ?)",
  )
    .bind(v_0dc2a1.prethirdBase, v_0dc2a1.callRoute, v_0dc2a1.secondBase)
    .all<ConfigRow>();

  const v_18b8bf = v_8f00b9.results ?? [];
  const v_8dcb51 = new Map(v_18b8bf.map((v_cb35cb) => [v_cb35cb.key, v_cb35cb.value]));
  const v_3eee66 = v_18b8bf.reduce((v_35f85c, v_cb35cb) => Math.max(v_35f85c, v_cb35cb.updated_at ?? 0), 0);

  const v_d2cdb4 =
    v_8dcb51.get(v_0dc2a1.prethirdBase) ?? v_3f4e2e.env.CALL_PRETHIRD_BASE ?? v_aceddb.prethirdBase;

  let v_325293 = v_8dcb51.get(v_0dc2a1.callRoute) ?? v_3f4e2e.env.CALL_ROUTE ?? v_aceddb.callRoute;
  if (!v_581122.has(v_325293)) v_325293 = v_aceddb.callRoute;

  const v_45e945 =
    v_8dcb51.get(v_0dc2a1.secondBase) ?? v_3f4e2e.env.CALL_SECOND_BASE ?? v_aceddb.secondBase;

  v_3f4e2e.header("Cache-Control", "public, max-age=60");
  return v_3f4e2e.json({ prethirdBase: v_d2cdb4, callRoute: v_325293, secondBase: v_45e945, updatedAt: v_3eee66 });
});
