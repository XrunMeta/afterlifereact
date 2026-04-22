

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import {
  v_5d4a51,
  v_d875d1,
} from "../lib/cloneAccess";

export const v_b211dd = new v_b7c41b<v_de0a25>();

function v_31113b(v_3f4e2e): number {
  const v_389afb = Number(v_3f4e2e.req.param("cloneId"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  return v_389afb;
}

v_b211dd.post("/:cloneId", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);
  if (!v_00efe2) {
    throw new v_3ebe58("FORBIDDEN", "No access to this clone for session.");
  }

  const v_c5607b = `sess-${crypto.randomUUID()}`;
  const v_a34e99 = `room-${v_6e0fd3}-${v_c5607b.slice(5, 13)}`;

  const v_f3f587 = `stub.${v_c5607b}.${v_43e90c}`;

  const v_11d4f0 = "stub-calls-app";
  const v_2a6fc7 = `r2://afterlife-models/${v_eb25ce.clone_type}/${v_eb25ce.username}.lora`;
  const v_ae588b = `r2://afterlife-voices/${v_eb25ce.clone_type}/${v_eb25ce.username}.pt`;
  const v_0b8131 = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return v_3f4e2e.json({
    sessionId: v_c5607b,
    livekitRoom: v_a34e99,
    livekitToken: v_f3f587,
    cloudflareCallsAppId: v_11d4f0,
    loraUri: v_2a6fc7,
    ttsVoiceUri: v_ae588b,
    expiresAt: v_0b8131,
    viewerRole: v_00efe2,
  });
});
