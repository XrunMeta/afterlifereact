

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_1cb5cc } from "../lib/adminAudit";
import { v_0dd6a5 } from "./adminAuth";

export const v_3182b3 = new v_b7c41b<v_de0a25>();

const v_40df63 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function v_043552(v_fbb6da): string {
  let v_fb19c6 = 0;
  let v_3b402b = 0;
  let v_8d4337 = "";
  for (const v_148ff6 of v_fbb6da) {
    v_3b402b = (v_3b402b << 8) | v_148ff6;
    v_fb19c6 += 8;
    while (v_fb19c6 >= 5) {
      v_8d4337 += v_40df63[(v_3b402b >>> (v_fb19c6 - 5)) & 0x1f];
      v_fb19c6 -= 5;
    }
  }
  if (v_fb19c6 > 0) v_8d4337 += v_40df63[(v_3b402b << (5 - v_fb19c6)) & 0x1f];
  return v_8d4337;
}

function v_487212(v_479f05): string {
  return v_479f05.replace(/[\s-]/g, "").toUpperCase();
}

async function v_921b04(v_bbda62): Promise<string> {
  const v_9390e8 = new TextEncoder().encode(v_bbda62);
  const v_6961cf = await crypto.subtle.digest("SHA-256", v_9390e8);
  const v_fbb6da = new Uint8Array(v_6961cf);
  let v_993b31 = "";
  for (const v_148ff6 of v_fbb6da) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31;
}

async function v_db7ace(): Promise<{ plaintext: string; normalized: string; hash: string }> {
  const v_fbb6da = crypto.getRandomValues(new Uint8Array(20));
  const v_75195c = v_043552(v_fbb6da);
  const v_9db068 = v_75195c.match(/.{1,4}/g)!.join("-");
  const v_598405 = await v_921b04(v_75195c);
  return { plaintext: v_9db068, normalized: v_75195c, hash: v_598405 };
}

const v_5ff70e = v_1f4ea7.object({
  token: v_1f4ea7.string().min(1),
  note: v_1f4ea7.string().max(200).optional(),
});

v_3182b3.post("/provision", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_5ff70e);
  const v_505a6d = (v_3f4e2e.env as unknown as { ADMIN_BOOTSTRAP_TOKEN?: string }).ADMIN_BOOTSTRAP_TOKEN;

  if (!v_505a6d || v_4d33b2.token !== v_505a6d) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }

  const { plaintext: v_9db068, hash: v_598405 } = await v_db7ace();

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB.prepare(
      `UPDATE admin_cold_recovery
          SET revoked_at = CURRENT_TIMESTAMP
        WHERE consumed_at IS NULL AND revoked_at IS NULL`,
    ),
    v_3f4e2e.env.DB.prepare(
      `INSERT INTO admin_cold_recovery (code_hash, provisioned_by)
         VALUES (?, NULL)`,
    ).bind(v_598405),
  ]);

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: null,
    action: "cold_recovery.provision",
    reason: v_4d33b2.note ?? null,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  return v_3f4e2e.json(
    {
      masterCode: v_9db068,
      note: "즉시 인쇄 후 금고 이관. 이 응답은 1회만 노출된다.",
    },
    201,
  );
});

const v_0b0140 = v_1f4ea7.object({
  masterCode: v_1f4ea7.string().min(16).max(64),
  targetEmail: v_1f4ea7.string().email().max(254),
  reason: v_1f4ea7.string().min(3).max(500),
});

v_3182b3.post("/reset-2fa", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_0b0140);
  const v_75195c = v_487212(v_4d33b2.masterCode);
  const v_598405 = await v_921b04(v_75195c);

  const v_f8b770 = await v_3f4e2e.env.DB.prepare(
    `SELECT id FROM admin_cold_recovery
       WHERE code_hash = ? AND consumed_at IS NULL AND revoked_at IS NULL`,
  )
    .bind(v_598405)
    .first<{ id: number }>();

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  if (!v_f8b770) {

    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: null,
      action: "cold_recovery.consume.fail",
      reason: `target=${v_4d33b2.targetEmail}`,
      ip: v_ab4c96.ip,
      userAgent: v_ab4c96.userAgent,
    });
    throw new v_3ebe58("UNAUTHENTICATED", "Invalid master code.");
  }

  const v_5f5d6d = await v_3f4e2e.env.DB.prepare(
    `SELECT id, role FROM admin_users WHERE email = ?`,
  )
    .bind(v_4d33b2.targetEmail)
    .first<{ id: number; role: string }>();
  if (!v_5f5d6d) {

    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: null,
      action: "cold_recovery.consume.fail",
      reason: `unknown_target=${v_4d33b2.targetEmail}`,
      ip: v_ab4c96.ip,
      userAgent: v_ab4c96.userAgent,
    });
    throw new v_3ebe58("NOT_FOUND", "Target admin not found.");
  }

  await v_3f4e2e.env.DB.batch([

    v_3f4e2e.env.DB.prepare(`DELETE FROM admin_totp WHERE admin_user_id = ?`).bind(v_5f5d6d.id),

    v_3f4e2e.env.DB.prepare(
      `UPDATE admin_users
          SET webauthn_credential_id = NULL,
              webauthn_public_key    = NULL,
              webauthn_sign_count    = 0,
              recovery_codes_hash    = NULL,
              requires_webauthn      = CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END,
              failed_login_count     = 0,
              locked_until           = NULL
        WHERE id = ?`,
    ).bind(v_5f5d6d.id),

    v_3f4e2e.env.DB.prepare(
      `UPDATE admin_cold_recovery
          SET consumed_at     = CURRENT_TIMESTAMP,
              consumed_target = ?,
              consumed_reason = ?
        WHERE id = ?`,
    ).bind(v_5f5d6d.id, v_4d33b2.reason, v_f8b770.id),
  ]);

  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: null,
    action: "cold_recovery.consume",
    targetType: "admin_user",
    targetId: String(v_5f5d6d.id),
    reason: v_4d33b2.reason,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: null,
    action: "admin.2fa.reset",
    targetType: "admin_user",
    targetId: String(v_5f5d6d.id),
    reason: `cold_recovery id=${v_f8b770.id}`,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  return v_3f4e2e.json({
    ok: true,
    targetEmail: v_4d33b2.targetEmail,
    resetAt: new Date().toISOString(),
  });
});
