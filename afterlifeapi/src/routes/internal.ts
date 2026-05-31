
import { Hono } from "hono";
import type { AppEnv } from "../lib/env";

export const internal = new Hono<AppEnv>();

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

internal.post("/oth-path", async (c) => {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !c.env.ORCH_SECRET || !safeEqual(token, c.env.ORCH_SECRET)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const callId = c.req.param("callId");
  const body = await c.req
    .json<{ role?: string; text?: string }>()
    .catch(() => ({}) as { role?: string; text?: string });
  const text = (body.text ?? "").trim();
  const role = body.role === "clone" ? "clone" : null;
  if (!role || !text) return c.json({ error: "bad_turn" }, 400);

  const sess = await c.env.DB.prepare(
    "SELECT 1 FROM call_sessions WHERE call_id = ?"
  ).bind(callId).first();
  if (!sess) return c.json({ error: "call_not_found" }, 404);

  await c.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at)
     SELECT ?, COALESCE(MAX(seq),0)+1, ?, ?, ?
     FROM call_turns WHERE call_id = ?`
  ).bind(callId, role, text, Date.now(), callId).run();
  return c.json({ ok: true });
});
