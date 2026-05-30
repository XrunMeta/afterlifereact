

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_5d4a51, v_d875d1 } from "../lib/cloneAccess";

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
  if (!v_00efe2) throw new v_3ebe58("FORBIDDEN", "No access to this clone for call.");

  const v_3e7379 = v_3f4e2e.env.ORCHESTRATOR_URL;
  let v_cb35cb;
  try {
    v_cb35cb = await fetch(`${v_3e7379}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}` },

      body: JSON.stringify({ cloneId: String(v_6e0fd3), userId: String(v_43e90c), idleVideoUrl: null }),
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

v_20e160.post("/:cloneId/call/:callId/end", v_6690d9, async (v_3f4e2e) => {
  v_31113b(v_3f4e2e);
  const v_be62d3 = v_3f4e2e.req.param("callId");
  const v_43e90c = v_3f4e2e.get("userId")!;

  if (!/^[0-9a-fA-F-]{8,64}$/.test(v_be62d3)) return v_3f4e2e.json({ ok: true });
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
