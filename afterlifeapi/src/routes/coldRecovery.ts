

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { writeAdminAudit } from "../lib/adminAudit";
import { clientMeta } from "./adminAuth";

export const coldRecovery = new Hono<AppEnv>();

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return out;
}

function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

async function generateMasterCode(): Promise<{ plaintext: string; normalized: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const normalized = base32Encode(bytes);
  const plaintext = normalized.match(/.{1,4}/g)!.join("-");
  const hash = await sha256Hex(normalized);
  return { plaintext, normalized, hash };
}

const provisionSchema = z.object({
  token: z.string().min(1),
  note: z.string().max(200).optional(),
});

coldRecovery.post("/provision", async (c) => {
  const body = await parseJson(c, provisionSchema);
  const expected = (c.env as unknown as { ADMIN_BOOTSTRAP_TOKEN?: string }).ADMIN_BOOTSTRAP_TOKEN;

  if (!expected || body.token !== expected) {
    throw new APIError("NOT_FOUND", "Not found.");
  }

  const { plaintext, hash } = await generateMasterCode();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE admin_cold_recovery
          SET revoked_at = CURRENT_TIMESTAMP
        WHERE consumed_at IS NULL AND revoked_at IS NULL`,
    ),
    c.env.DB.prepare(
      `INSERT INTO admin_cold_recovery (code_hash, provisioned_by)
         VALUES (?, NULL)`,
    ).bind(hash),
  ]);

  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: null,
    action: "cold_recovery.provision",
    reason: body.note ?? null,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return c.json(
    {
      masterCode: plaintext,
      note: "즉시 인쇄 후 금고 이관. 이 응답은 1회만 노출된다.",
    },
    201,
  );
});

const resetSchema = z.object({
  masterCode: z.string().min(16).max(64),
  targetEmail: z.string().email().max(254),
  reason: z.string().min(3).max(500),
});

coldRecovery.post("/reset-2fa", async (c) => {
  const body = await parseJson(c, resetSchema);
  const normalized = normalizeCode(body.masterCode);
  const hash = await sha256Hex(normalized);

  const active = await c.env.DB.prepare(
    `SELECT id FROM admin_cold_recovery
       WHERE code_hash = ? AND consumed_at IS NULL AND revoked_at IS NULL`,
  )
    .bind(hash)
    .first<{ id: number }>();

  const meta = clientMeta(c);
  if (!active) {

    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: null,
      action: "cold_recovery.consume.fail",
      reason: `target=${body.targetEmail}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    throw new APIError("UNAUTHENTICATED", "Invalid master code.");
  }

  const target = await c.env.DB.prepare(
    `SELECT id, role FROM admin_users WHERE email = ?`,
  )
    .bind(body.targetEmail)
    .first<{ id: number; role: string }>();
  if (!target) {

    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: null,
      action: "cold_recovery.consume.fail",
      reason: `unknown_target=${body.targetEmail}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    throw new APIError("NOT_FOUND", "Target admin not found.");
  }

  await c.env.DB.batch([

    c.env.DB.prepare(`DELETE FROM admin_totp WHERE admin_user_id = ?`).bind(target.id),

    c.env.DB.prepare(
      `UPDATE admin_users
          SET webauthn_credential_id = NULL,
              webauthn_public_key    = NULL,
              webauthn_sign_count    = 0,
              recovery_codes_hash    = NULL,
              requires_webauthn      = CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END,
              failed_login_count     = 0,
              locked_until           = NULL
        WHERE id = ?`,
    ).bind(target.id),

    c.env.DB.prepare(
      `UPDATE admin_cold_recovery
          SET consumed_at     = CURRENT_TIMESTAMP,
              consumed_target = ?,
              consumed_reason = ?
        WHERE id = ?`,
    ).bind(target.id, body.reason, active.id),
  ]);

  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: null,
    action: "cold_recovery.consume",
    targetType: "admin_user",
    targetId: String(target.id),
    reason: body.reason,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: null,
    action: "admin.2fa.reset",
    targetType: "admin_user",
    targetId: String(target.id),
    reason: `cold_recovery id=${active.id}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return c.json({
    ok: true,
    targetEmail: body.targetEmail,
    resetAt: new Date().toISOString(),
  });
});
