

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_5d4a51, v_d875d1 } from "../lib/cloneAccess";
import { v_87cfd2 } from "../lib/callBundle";
import { v_1f4ea7 } from "../lib/validate";

export const v_20e160 = new v_b7c41b<v_de0a25>();

function v_31113b(v_3f4e2e): number {
  const v_389afb = Number(v_3f4e2e.req.param("cloneId"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  return v_389afb;
}

v_20e160.post("/:cloneId/call", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);

  if (!v_00efe2 && v_eb25ce.visibility !== "public") {
    throw new v_3ebe58("FORBIDDEN", "No access to this clone for call.");
  }

  const { personaBundle: v_ba0fde, assets: v_7adc95 } = await v_87cfd2(v_3f4e2e.env.DB, v_eb25ce, v_43e90c, new URL(v_3f4e2e.req.url).origin);

  const v_3e7379 = v_3f4e2e.env.ORCHESTRATOR_URL;
  let v_cb35cb;
  try {
    v_cb35cb = await fetch(`${v_3e7379}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}` },
      body: JSON.stringify({ cloneId: String(v_6e0fd3), userId: String(v_43e90c), idleVideoUrl: null, personaBundle: v_ba0fde, assets: v_7adc95 }),
    });
  } catch (v_9e86fd) {
    throw new v_3ebe58("UPSTREAM_FAILURE", `Orchestrator unreachable: ${(v_9e86fd as Error).message}`);
  }
  if (v_cb35cb.status === 503) throw new v_3ebe58("SERVICE_UNAVAILABLE", "No call capacity available.");
  if (!v_cb35cb.ok) throw new v_3ebe58("UPSTREAM_FAILURE", `Orchestrator error ${v_cb35cb.status}.`);

  const v_9390e8 = (await v_cb35cb.json()) as {
    callId: string;
    subscribeToken: string;
    tracks: { video: string; audio: string };
    state: string;
  };

  await v_3f4e2e.env.DB.prepare(
    'INSERT INTO call_sessions (call_id, user_id, clone_id, persona_slug, started_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(v_9390e8.callId, v_43e90c, v_6e0fd3, 'halbae', Date.now()).run();

  const v_13f298 = `${v_3e7379}/oth-path${v_9390e8.callId}/subscribe`;

  return v_3f4e2e.json({
    callId: v_9390e8.callId,
    subscribeUrl: v_13f298,
    renegotiateUrl: `${v_13f298}/renegotiate`,
    subscribeToken: v_9390e8.subscribeToken,
    tracks: v_9390e8.tracks,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
});

v_20e160.get("/:cloneId/bundle", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);
  if (!v_00efe2 && v_eb25ce.visibility !== "public") {
    throw new v_3ebe58("FORBIDDEN", "No access to this clone.");
  }
  const { personaBundle: v_ba0fde, assets: v_7adc95 } = await v_87cfd2(v_3f4e2e.env.DB, v_eb25ce, v_43e90c, new URL(v_3f4e2e.req.url).origin);
  return v_3f4e2e.json({ personaBundle: v_ba0fde, assets: v_7adc95 });
});

const v_f52f0d = v_1f4ea7.object({
  sessionId: v_1f4ea7.string().regex(/^[0-9a-f]{12}$/), 
});

v_20e160.post("/:cloneId/call/prethird-start", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_8decf8 = v_f52f0d.safeParse(await v_3f4e2e.req.json().catch(() => ({})));
  if (!v_8decf8.success) return v_3f4e2e.json({ error: "bad_session_id" }, 400);
  const { sessionId: v_c5607b } = v_8decf8.data;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);
  if (!v_00efe2 && v_eb25ce.visibility !== "public") {
    throw new v_3ebe58("FORBIDDEN", "No access to this clone for call.");
  }

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO call_sessions (call_id, user_id, clone_id, started_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(call_id) DO NOTHING`,
  ).bind(v_c5607b, v_43e90c, v_6e0fd3, Date.now()).run();

  return v_3f4e2e.json({ ok: true });
});

v_20e160.post("/:cloneId/call/:callId/say", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_be62d3 = v_3f4e2e.req.param("callId");
  const v_4d33b2 = await v_3f4e2e.req.json<{ text?: string }>().catch(() => ({}) as { text?: string });
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  if (!v_9b6134) return v_3f4e2e.json({ error: "empty_text" }, 400);

  if (v_9b6134.length > 2000) return v_3f4e2e.json({ error: "text_too_long" }, 400);
  const v_d7296e = await v_3f4e2e.env.DB.prepare(
    "SELECT user_id FROM call_sessions WHERE call_id = ? AND ended_at IS NULL"
  ).bind(v_be62d3).first<{ user_id: number }>();
  if (!v_d7296e) return v_3f4e2e.json({ error: "call_not_found" }, 404);
  if (v_d7296e.user_id !== v_43e90c) return v_3f4e2e.json({ error: "not_call_owner" }, 403);

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at)
     SELECT ?, COALESCE(MAX(seq),0)+1, 'user', ?, ?
     FROM call_turns WHERE call_id = ?`
  ).bind(v_be62d3, v_9b6134, Date.now(), v_be62d3).run();
  const v_cb35cb = await fetch(`${v_3f4e2e.env.ORCHESTRATOR_URL}/oth-path${v_be62d3}/say`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}` },
    body: JSON.stringify({ text: v_9b6134, cloneId: v_6e0fd3 }),
  });

  if (v_cb35cb.status === 409) return v_3f4e2e.json({ error: "turn_in_progress" }, 429);
  if (!v_cb35cb.ok) return v_3f4e2e.json({ error: "orchestrator_error" }, 502);
  return v_3f4e2e.json({ ok: true }, 202);
});

v_20e160.post("/:cloneId/call/:callId/end", v_6690d9, async (v_3f4e2e) => {
  v_31113b(v_3f4e2e);
  const v_be62d3 = v_3f4e2e.req.param("callId");
  const v_43e90c = v_3f4e2e.get("userId")!;

  if (!/^[0-9a-fA-F-]{8,64}$/.test(v_be62d3)) return v_3f4e2e.json({ ok: true });

  const v_d7296e = await v_3f4e2e.env.DB.prepare(
    "SELECT user_id, greeted_at FROM call_sessions WHERE call_id = ? AND ended_at IS NULL"
  ).bind(v_be62d3).first<{ user_id: number; greeted_at: number | null }>();
  if (v_d7296e && v_d7296e.user_id !== v_43e90c) return v_3f4e2e.json({ ok: true }); 

  const v_3a0669 = Date.now();
  await v_3f4e2e.env.DB.prepare(
    `UPDATE call_sessions SET ended_at = ?, duration_sec = MAX(0, (? - started_at) / 1000) WHERE call_id = ? AND ended_at IS NULL`
  ).bind(v_3a0669, v_3a0669, v_be62d3).run();

  if (v_d7296e?.greeted_at) {
    const v_c81699 = Math.max(0, v_3a0669 - v_d7296e.greeted_at);
    const v_b62d44 = Math.floor(v_c81699 / 1000);
    const v_d7bc64 = Math.floor(v_b62d44 / 10) * 10; 
    if (v_d7bc64 > 0) {
      try {
        const { spendCallTime: v_a025af } = await import("../lib/credits");
        const v_b16dde = await v_a025af(v_3f4e2e, {
          userId: v_43e90c,
          amountSec: v_d7bc64,
          callId: v_be62d3,
        });
        await v_3f4e2e.env.DB.prepare(
          `UPDATE call_sessions
              SET billed_sec = ?, unbilled_sec = ?, billed_at = ?
            WHERE call_id = ?`,
        )
          .bind(v_b16dde.billedSec, v_b16dde.unbilledSec, v_3a0669, v_be62d3)
          .run();
      } catch (v_49263d) {
        console.error(`[t167] call bill fail callId=${v_be62d3} err=${(v_49263d as Error).message}`);
      }
    }
  }
  try {
    await fetch(`${v_3f4e2e.env.ORCHESTRATOR_URL}/oth-path${v_be62d3}`, {
      method: "DELETE",

      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}` },
      body: JSON.stringify({ userId: String(v_43e90c) }),
    });
  } catch {

  }
  return v_3f4e2e.json({ ok: true });
});
