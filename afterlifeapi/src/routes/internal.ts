
import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";

export const v_dcd415 = new v_b7c41b<v_de0a25>();

function v_a155c4(v_779914, v_148ff6): boolean {
  if (v_779914.length !== v_148ff6.length) return false;
  let v_cb35cb = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) v_cb35cb |= v_779914.charCodeAt(v_ebec57) ^ v_148ff6.charCodeAt(v_ebec57);
  return v_cb35cb === 0;
}

v_dcd415.post("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.ORCH_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.ORCH_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }

  const v_be62d3 = v_3f4e2e.req.param("callId");
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ role?: string; text?: string }>()
    .catch(() => ({}) as { role?: string; text?: string });
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  const v_22da99 = v_4d33b2.role === "clone" ? "clone" : null;
  if (!v_22da99 || !v_9b6134) return v_3f4e2e.json({ error: "bad_turn" }, 400);

  const v_d7296e = await v_3f4e2e.env.DB.prepare(
    "SELECT 1 FROM call_sessions WHERE call_id = ?"
  ).bind(v_be62d3).first();
  if (!v_d7296e) return v_3f4e2e.json({ error: "call_not_found" }, 404);

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at)
     SELECT ?, COALESCE(MAX(seq),0)+1, ?, ?, ?
     FROM call_turns WHERE call_id = ?`
  ).bind(v_be62d3, v_22da99, v_9b6134, Date.now(), v_be62d3).run();
  return v_3f4e2e.json({ ok: true });
});
