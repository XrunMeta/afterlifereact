

import { Hono } from "hono";
import { randomBytes } from "@noble/ciphers/utils.js";
import type { AppEnv } from "../lib/env";
import { requireAuth } from "../middleware/auth";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { logActivity } from "../lib/logger";

export const emergency = new Hono<AppEnv>();
export const inheritance = new Hono<AppEnv>();

const ROLES = ["notify_only", "primary_heir", "secondary_heir"] as const;
const TRIGGERS = ["inactivity_N_days", "death_certificate", "manual_admin"] as const;

const createSchema = z.object({
  contactEmail: z.string().email().max(254),
  role: z.enum(ROLES),
  triggerCondition: z.enum(TRIGGERS),
  triggerParam: z.string().max(64).optional(),
  targetScope: z.string().min(1).max(128), 
});

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function randToken(): string {
  const r = randomBytes(24);
  let hex = "";
  for (const b of r) hex += b.toString(16).padStart(2, "0");
  return hex;
}

emergency.post("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await parseJson(c, createSchema);
  if (body.triggerCondition === "inactivity_N_days") {
    const n = Number(body.triggerParam);
    if (!Number.isInteger(n) || n < 30 || n > 3650) {
      throw new APIError("VALIDATION_FAILED", "triggerParam must be 30..3650 for inactivity.");
    }
  }

  const rawToken = randToken();
  const tokenHash = await sha256Hex(rawToken);

  const ins = await c.env.DB
    .prepare(
      `INSERT INTO emergency_contacts
         (principal_user_id, contact_email, role, trigger_condition, trigger_param, target_scope, invite_token_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      userId,
      body.contactEmail,
      body.role,
      body.triggerCondition,
      body.triggerParam ?? null,
      body.targetScope,
      tokenHash,
    )
    .run();

  await logActivity(c, { userId, action: "emergency.invite", details: { role: body.role } });

  return c.json({
    ok: true,
    id: ins.meta?.last_row_id,
    inviteToken: rawToken,
  }, 201);
});

emergency.get("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT id, contact_email AS contactEmail, role, trigger_condition AS triggerCondition,
                trigger_param AS triggerParam, target_scope AS targetScope,
                status, invited_at AS invitedAt, accepted_at AS acceptedAt
           FROM emergency_contacts
          WHERE principal_user_id = ? AND status != 'revoked'
          ORDER BY invited_at DESC`,
      )
      .bind(userId)
      .all()
  ).results;
  return c.json({ contacts: rows });
});

emergency.delete("/:id", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "id invalid.");
  }
  const res = await c.env.DB
    .prepare(
      `UPDATE emergency_contacts
          SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND principal_user_id = ? AND status != 'revoked'`,
    )
    .bind(id, userId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) throw new APIError("NOT_FOUND", "Contact not found.");
  await logActivity(c, { userId, action: "emergency.revoke", details: { id } });
  return c.json({ ok: true });
});

inheritance.post("/accept", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await parseJson(
    c,
    z.object({
      token: z.string().min(32).max(128),
      decision: z.enum(["accept", "decline"]),
    }),
  );
  const tokenHash = await sha256Hex(body.token);
  const row = await c.env.DB
    .prepare(
      `SELECT id, principal_user_id, status FROM emergency_contacts
        WHERE invite_token_hash = ?`,
    )
    .bind(tokenHash)
    .first<{ id: number; principal_user_id: number; status: string }>();
  if (!row) throw new APIError("NOT_FOUND", "Invalid invite token.");
  if (row.status !== "pending") throw new APIError("CONFLICT", `Contact already ${row.status}.`);

  const nextStatus = body.decision === "accept" ? "accepted" : "declined";
  const col = body.decision === "accept" ? "accepted_at" : "declined_at";
  await c.env.DB
    .prepare(
      `UPDATE emergency_contacts
          SET status = ?, ${col} = CURRENT_TIMESTAMP,
              contact_user_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(nextStatus, userId, row.id)
    .run();

  await logActivity(c, {
    userId,
    action: "inheritance.accept_response",
    details: { contactId: row.id, decision: body.decision },
  });
  return c.json({ ok: true, status: nextStatus });
});
