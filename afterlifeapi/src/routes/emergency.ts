

import { v_b7c41b } from "zmui";
import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";
import type { v_de0a25 } from "../lib/env";
import { v_6690d9 } from "../middleware/auth";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_74defc } from "../lib/logger";

export const v_ad9418 = new v_b7c41b<v_de0a25>();
export const v_7fd263 = new v_b7c41b<v_de0a25>();

const v_63b860 = ["notify_only", "primary_heir", "secondary_heir"] as const;
const v_4b12e3 = ["inactivity_N_days", "death_certificate", "manual_admin"] as const;

const v_722b6d = v_1f4ea7.object({
  contactEmail: v_1f4ea7.string().email().max(254),
  role: v_1f4ea7.enum(v_63b860),
  triggerCondition: v_1f4ea7.enum(v_4b12e3),
  triggerParam: v_1f4ea7.string().max(64).optional(),
  targetScope: v_1f4ea7.string().min(1).max(128), 
});

async function v_921b04(v_9390e8): Promise<string> {
  const v_83ee53 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v_9390e8));
  const v_fbb6da = new Uint8Array(v_83ee53);
  let v_993b31 = "";
  for (const v_148ff6 of v_fbb6da) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31;
}

function v_ad7078(): string {
  const v_cb35cb = v_5f30e2(24);
  let v_993b31 = "";
  for (const v_148ff6 of v_cb35cb) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31;
}

v_ad9418.post("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);
  if (v_4d33b2.triggerCondition === "inactivity_N_days") {
    const v_f4e98d = Number(v_4d33b2.triggerParam);
    if (!Number.isInteger(v_f4e98d) || v_f4e98d < 30 || v_f4e98d > 3650) {
      throw new v_3ebe58("VALIDATION_FAILED", "triggerParam must be 30..3650 for inactivity.");
    }
  }

  const v_a9e381 = v_ad7078();
  const v_109fd8 = await v_921b04(v_a9e381);

  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO emergency_contacts
         (principal_user_id, contact_email, role, trigger_condition, trigger_param, target_scope, invite_token_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      v_43e90c,
      v_4d33b2.contactEmail,
      v_4d33b2.role,
      v_4d33b2.triggerCondition,
      v_4d33b2.triggerParam ?? null,
      v_4d33b2.targetScope,
      v_109fd8,
    )
    .run();

  await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "emergency.invite", details: { role: v_4d33b2.role } });

  return v_3f4e2e.json({
    ok: true,
    id: v_43af15.meta?.last_row_id,
    inviteToken: v_a9e381,
  }, 201);
});

v_ad9418.get("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, contact_email AS contactEmail, role, trigger_condition AS triggerCondition,
                trigger_param AS triggerParam, target_scope AS targetScope,
                status, invited_at AS invitedAt, accepted_at AS acceptedAt
           FROM emergency_contacts
          WHERE principal_user_id = ? AND status != 'revoked'
          ORDER BY invited_at DESC`,
      )
      .bind(v_43e90c)
      .all()
  ).results;
  return v_3f4e2e.json({ contacts: v_18b8bf });
});

v_ad9418.delete("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "id invalid.");
  }
  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(
      `UPDATE emergency_contacts
          SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND principal_user_id = ? AND status != 'revoked'`,
    )
    .bind(v_389afb, v_43e90c)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) throw new v_3ebe58("NOT_FOUND", "Contact not found.");
  await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "emergency.revoke", details: { id: v_389afb } });
  return v_3f4e2e.json({ ok: true });
});

v_7fd263.post("/accept", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(
    v_3f4e2e,
    v_1f4ea7.object({
      token: v_1f4ea7.string().min(32).max(128),
      decision: v_1f4ea7.enum(["accept", "decline"]),
    }),
  );
  const v_109fd8 = await v_921b04(v_4d33b2.token);
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, principal_user_id, status FROM emergency_contacts
        WHERE invite_token_hash = ?`,
    )
    .bind(v_109fd8)
    .first<{ id: number; principal_user_id: number; status: string }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Invalid invite token.");
  if (v_3ac7e7.status !== "pending") throw new v_3ebe58("CONFLICT", `Contact already ${v_3ac7e7.status}.`);

  const v_8bdb7e = v_4d33b2.decision === "accept" ? "accepted" : "declined";
  const v_c8b83f = v_4d33b2.decision === "accept" ? "accepted_at" : "declined_at";
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE emergency_contacts
          SET status = ?, ${v_c8b83f} = CURRENT_TIMESTAMP,
              contact_user_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(v_8bdb7e, v_43e90c, v_3ac7e7.id)
    .run();

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "inheritance.accept_response",
    details: { contactId: v_3ac7e7.id, decision: v_4d33b2.decision },
  });
  return v_3f4e2e.json({ ok: true, status: v_8bdb7e });
});
