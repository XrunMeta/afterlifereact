

import { v_b7c41b } from "zmui";
import type { v_437670 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_54846c, v_96aa7f } from "../lib/password";
import { v_b2eae5, v_2703c5 } from "../lib/jwt";
import { v_8ab5ff } from "../lib/session";
import { v_a8614b, v_85de88, v_207c31 } from "../lib/ale";
import {
  v_041b21,
  v_726e84,
  v_ac75b4,
  v_8bd0de,
  v_669bf5,
} from "../lib/totp";
import { v_1cb5cc } from "../lib/adminAudit";

export const v_d26494 = new v_b7c41b<v_de0a25>();

const v_6f2399 = 5 * 60;
const v_4d47d1 = 5;
const v_584268 = 15;
const v_a35d13 = "AfterLife Admin";
const v_266bd3 = "admin_totp.secret";

type PendingPayload = {
  sub: number;
  kind: "admin_pending";
  email: string;
  role: string;
  totp_enrolled: boolean;
  exp?: number;
} & Record<string, unknown>;

async function v_999554(c: v_437670<v_de0a25>): Promise<PendingPayload> {
  const v_65a2cd = v_3f4e2e.req.header("Authorization");
  if (!v_65a2cd?.startsWith("Bearer ")) {
    throw new v_3ebe58("UNAUTHENTICATED", "Missing pending token.");
  }
  const v_21cc31 = v_65a2cd.slice(7);
  const v_931bf0 = await v_2703c5<PendingPayload>(v_21cc31, v_3f4e2e.env.JWT_ACCESS_SECRET);
  if (v_931bf0.kind !== "admin_pending") {
    throw new v_3ebe58("UNAUTHENTICATED", "Not a pending token.");
  }
  return v_931bf0;
}

async function v_8bde96(c: v_437670<v_de0a25>): Promise<PendingPayload> {
  const v_483de2 = await v_999554(v_3f4e2e);
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT is_active, locked_until FROM admin_users WHERE id = ?`,
  )
    .bind(v_483de2.sub)
    .first<{ is_active: number; locked_until: string | null }>();
  if (!v_3ac7e7) throw new v_3ebe58("UNAUTHENTICATED", "Admin no longer exists.");
  v_107e8b(v_3ac7e7);
  return v_483de2;
}

function v_0dd6a5(c: v_437670<v_de0a25>) {
  return {
    ip: v_3f4e2e.req.header("CF-Connecting-IP") ?? null,
    userAgent: v_3f4e2e.req.header("User-Agent") ?? null,
  };
}

async function v_767d31(v_a1651b, v_389afb): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE admin_users
          SET failed_login_count = failed_login_count + 1,
              locked_until = CASE
                WHEN failed_login_count + 1 >= ?
                  THEN datetime('now', '+${v_584268} minutes')
                ELSE locked_until
              END
        WHERE id = ?`,
    )
    .bind(v_4d47d1, v_389afb)
    .run();
}

async function v_03aa46(v_a1651b, v_389afb): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE admin_users
          SET failed_login_count = 0,
              locked_until = NULL,
              last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(v_389afb)
    .run();
}

function v_107e8b(v_3ac7e7): void {
  if (!v_3ac7e7.is_active) throw new v_3ebe58("FORBIDDEN", "Account disabled.");
  if (v_3ac7e7.locked_until && new Date(v_3ac7e7.locked_until) > new Date()) {
    throw new v_3ebe58("ACCOUNT_LOCKED", "Too many failures — try again later.");
  }
}

const v_dca2b3 = v_1f4ea7.object({
  token: v_1f4ea7.string().min(1),
  email: v_1f4ea7.string().email().max(254),
  password: v_1f4ea7.string().min(12),
  role: v_1f4ea7.enum(["super_admin", "moderator"]).default("moderator"),
});

v_d26494.post("/bootstrap", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_dca2b3);
  const v_505a6d = (v_3f4e2e.env as unknown as { ADMIN_BOOTSTRAP_TOKEN?: string }).ADMIN_BOOTSTRAP_TOKEN;
  if (!v_505a6d || v_4d33b2.token !== v_505a6d) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }
  const v_598405 = await v_54846c(v_4d33b2.password);
  let v_389afb;
  try {
    const v_8f00b9 = await v_3f4e2e.env.DB.prepare(
      `INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?)`,
    )
      .bind(v_4d33b2.email, v_598405, v_4d33b2.role)
      .run();
    v_389afb = Number(v_8f00b9.meta.last_row_id);
  } catch (v_49263d) {

    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE|constraint/i.test(v_badeaf)) {
      throw new v_3ebe58("CONFLICT", "Admin already exists.");
    }
    throw v_49263d;
  }

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_389afb,
    action: "auth.bootstrap",
    targetType: "admin_user",
    targetId: String(v_389afb),
    reason: `role=${v_4d33b2.role}`,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });
  return v_3f4e2e.json({ ok: true, id: v_389afb, email: v_4d33b2.email, role: v_4d33b2.role }, 201);
});

const v_5460cc = v_1f4ea7.object({
  email: v_1f4ea7.string().email().max(254),
  password: v_1f4ea7.string().min(1),
});

v_d26494.post("/login", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_5460cc);
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT a.id, a.email, a.password_hash, a.role, a.is_active, a.locked_until,
            (SELECT enrolled_at FROM admin_totp WHERE admin_user_id = a.id) AS totp_enrolled_at
       FROM admin_users a WHERE a.email = ?`,
  )
    .bind(v_4d33b2.email)
    .first<{
      id: number;
      email: string;
      password_hash: string;
      role: string;
      is_active: number;
      locked_until: string | null;
      totp_enrolled_at: string | null;
    }>();
  if (!v_3ac7e7) {

    const v_bf0f01 = v_0dd6a5(v_3f4e2e);
    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: null,
      action: "auth.login.fail.unknown_email",
      reason: v_4d33b2.email,
      ip: v_bf0f01.ip,
      userAgent: v_bf0f01.userAgent,
    });
    throw new v_3ebe58("UNAUTHENTICATED", "Invalid credentials.");
  }
  v_107e8b(v_3ac7e7);

  const v_3ed4c3 = await v_96aa7f(v_4d33b2.password, v_3ac7e7.password_hash);
  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  if (!v_3ed4c3) {
    await v_767d31(v_3f4e2e.env.DB, v_3ac7e7.id);
    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: v_3ac7e7.id,
      action: "auth.login.fail",
      ip: v_ab4c96.ip,
      userAgent: v_ab4c96.userAgent,
    });
    throw new v_3ebe58("UNAUTHENTICATED", "Invalid credentials.");
  }

  const v_483de2 = await v_b2eae5(
    {
      sub: v_3ac7e7.id,
      kind: "admin_pending",
      email: v_3ac7e7.email,
      role: v_3ac7e7.role,
      totp_enrolled: Boolean(v_3ac7e7.totp_enrolled_at),
    } as never,
    v_3f4e2e.env.JWT_ACCESS_SECRET,
    v_6f2399,
  );
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_3ac7e7.id,
    action: "auth.login.pending",
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  return v_3f4e2e.json({
    pendingToken: v_483de2,
    expiresIn: v_6f2399,
    totpEnrolled: Boolean(v_3ac7e7.totp_enrolled_at),
    role: v_3ac7e7.role,
  });
});

v_d26494.post("/totp/enroll", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);
  if (v_483de2.totp_enrolled) throw new v_3ebe58("CONFLICT", "TOTP already enrolled.");

  const v_e38ca2 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_43fd42 = v_041b21();
  const v_704d73 = v_85de88(v_43fd42, v_e38ca2, v_266bd3);
  const v_99e9de = v_8bd0de(10);

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO admin_totp (admin_user_id, secret_encrypted, backup_codes_hash)
       VALUES (?, ?, ?)
     ON CONFLICT(admin_user_id) DO UPDATE SET
       secret_encrypted = excluded.secret_encrypted,
       backup_codes_hash = excluded.backup_codes_hash,
       enrolled_at = NULL,
       last_used_counter = NULL`,
  )
    .bind(v_483de2.sub, v_704d73, JSON.stringify(v_99e9de.hashes))
    .run();

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_483de2.sub,
    action: "auth.totp.enroll",
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  return v_3f4e2e.json(
    {
      otpauthUrl: v_726e84({
        issuer: v_a35d13,
        account: v_483de2.email,
        secretB32: v_43fd42,
      }),
      secret: v_43fd42,
      recoveryCodes: v_99e9de.plaintext,
    },
    201,
  );
});

const v_325769 = v_1f4ea7.object({ code: v_1f4ea7.string().regex(/^\d{6}$/) });

v_d26494.post("/totp/verify", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_325769);

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT secret_encrypted, last_used_counter FROM admin_totp WHERE admin_user_id = ?`,
  )
    .bind(v_483de2.sub)
    .first<{ secret_encrypted: string; last_used_counter: number | null }>();
  if (!v_3ac7e7) throw new v_3ebe58("TOTP_REQUIRED", "TOTP not enrolled.");

  const v_e38ca2 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_43fd42 = v_207c31(v_3ac7e7.secret_encrypted, v_e38ca2, v_266bd3);
  const v_054741 = v_ac75b4(v_43fd42, v_4d33b2.code, v_3ac7e7.last_used_counter);

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  if (v_054741 === null) {
    await v_767d31(v_3f4e2e.env.DB, v_483de2.sub);
    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: v_483de2.sub,
      action: "auth.totp.verify.fail",
      ip: v_ab4c96.ip,
      userAgent: v_ab4c96.userAgent,
    });
    throw new v_3ebe58("TOTP_INVALID", "Invalid TOTP code.");
  }

  await v_3f4e2e.env.DB.prepare(
    `UPDATE admin_totp
        SET last_used_counter = ?,
            enrolled_at = COALESCE(enrolled_at, CURRENT_TIMESTAMP)
      WHERE admin_user_id = ?`,
  )
    .bind(v_054741, v_483de2.sub)
    .run();
  await v_03aa46(v_3f4e2e.env.DB, v_483de2.sub);

  const v_ef86b6 = await v_8ab5ff(v_3f4e2e, v_483de2.sub, undefined, true);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_483de2.sub,
    action: "auth.totp.verify.success",
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });
  return v_3f4e2e.json({
    accessToken: v_ef86b6.accessToken,
    refreshToken: v_ef86b6.refreshToken,
    accessExpiresIn: v_ef86b6.accessExpiresIn,
    admin: { id: v_483de2.sub, email: v_483de2.email, role: v_483de2.role },
  });
});

const v_ecc964 = v_1f4ea7.object({ code: v_1f4ea7.string().min(8).max(32) });

v_d26494.post("/recovery", async (v_3f4e2e) => {
  const v_483de2 = await v_8bde96(v_3f4e2e);
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_ecc964);

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT backup_codes_hash FROM admin_totp WHERE admin_user_id = ?`,
  )
    .bind(v_483de2.sub)
    .first<{ backup_codes_hash: string | null }>();
  if (!v_3ac7e7?.backup_codes_hash) throw new v_3ebe58("TOTP_REQUIRED", "No recovery codes issued.");

  let v_5885b8;
  try {
    v_5885b8 = JSON.parse(v_3ac7e7.backup_codes_hash);
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "Corrupted recovery codes.");
  }
  const v_a448ad = v_669bf5(v_5885b8, v_4d33b2.code);

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  if (!v_a448ad) {
    await v_767d31(v_3f4e2e.env.DB, v_483de2.sub);
    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: v_483de2.sub,
      action: "auth.recovery.fail",
      ip: v_ab4c96.ip,
      userAgent: v_ab4c96.userAgent,
    });
    throw new v_3ebe58("TOTP_INVALID", "Invalid recovery code.");
  }

  await v_3f4e2e.env.DB.prepare(
    `UPDATE admin_totp SET backup_codes_hash = ? WHERE admin_user_id = ?`,
  )
    .bind(JSON.stringify(v_a448ad), v_483de2.sub)
    .run();
  await v_03aa46(v_3f4e2e.env.DB, v_483de2.sub);

  const v_ef86b6 = await v_8ab5ff(v_3f4e2e, v_483de2.sub, undefined, true);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_483de2.sub,
    action: "auth.recovery.success",
    reason: `codes_remaining=${v_a448ad.length}`,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });
  return v_3f4e2e.json({
    accessToken: v_ef86b6.accessToken,
    refreshToken: v_ef86b6.refreshToken,
    accessExpiresIn: v_ef86b6.accessExpiresIn,
    admin: { id: v_483de2.sub, email: v_483de2.email, role: v_483de2.role },
    codesRemaining: v_a448ad.length,
  });
});
