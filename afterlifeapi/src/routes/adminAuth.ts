

import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { hashPassword, verifyPassword } from "../lib/password";
import { issueToken, verifyToken } from "../lib/jwt";
import { issueSession } from "../lib/session";
import { getKekProvider, seal, open } from "../lib/ale";
import {
  randomTotpSecret,
  otpauthUrl,
  verifyTotp,
  generateRecoveryCodes,
  consumeRecoveryCode,
} from "../lib/totp";
import { writeAdminAudit } from "../lib/adminAudit";

export const adminAuth = new Hono<AppEnv>();

const PENDING_TTL_SEC = 5 * 60;
const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;
const ADMIN_ISSUER = "AfterLife Admin";
const TOTP_CTX = "admin_totp.secret";

export type PendingPayload = {
  sub: number;
  kind: "admin_pending";
  email: string;
  role: string;
  totp_enrolled: boolean;
  exp?: number;
} & Record<string, unknown>;

export async function readPending(c: Context<AppEnv>): Promise<PendingPayload> {
  const h = c.req.header("Authorization");
  if (!h?.startsWith("Bearer ")) {
    throw new APIError("UNAUTHENTICATED", "Missing pending token.");
  }
  const token = h.slice(7);
  const payload = await verifyToken<PendingPayload>(token, c.env.JWT_ACCESS_SECRET);
  if (payload.kind !== "admin_pending") {
    throw new APIError("UNAUTHENTICATED", "Not a pending token.");
  }
  return payload;
}

export async function readPendingLive(c: Context<AppEnv>): Promise<PendingPayload> {
  const pending = await readPending(c);
  const row = await c.env.DB.prepare(
    `SELECT is_active, locked_until FROM admin_users WHERE id = ?`,
  )
    .bind(pending.sub)
    .first<{ is_active: number; locked_until: string | null }>();
  if (!row) throw new APIError("UNAUTHENTICATED", "Admin no longer exists.");
  assertActive(row);
  return pending;
}

export function clientMeta(c: Context<AppEnv>) {
  return {
    ip: c.req.header("CF-Connecting-IP") ?? null,
    userAgent: c.req.header("User-Agent") ?? null,
  };
}

export async function bumpFailure(db: D1Database, id: number): Promise<void> {
  await db
    .prepare(
      `UPDATE admin_users
          SET failed_login_count = failed_login_count + 1,
              locked_until = CASE
                WHEN failed_login_count + 1 >= ?
                  THEN datetime('now', '+${LOCK_MINUTES} minutes')
                ELSE locked_until
              END
        WHERE id = ?`,
    )
    .bind(LOCK_THRESHOLD, id)
    .run();
}

export async function resetFailure(db: D1Database, id: number): Promise<void> {
  await db
    .prepare(
      `UPDATE admin_users
          SET failed_login_count = 0,
              locked_until = NULL,
              last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(id)
    .run();
}

export function assertActive(row: { is_active: number; locked_until: string | null }): void {
  if (!row.is_active) throw new APIError("FORBIDDEN", "Account disabled.");
  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    throw new APIError("ACCOUNT_LOCKED", "Too many failures — try again later.");
  }
}

const bootstrapSchema = z.object({
  token: z.string().min(1),
  email: z.string().email().max(254),
  password: z.string().min(12),
  role: z.enum(["super_admin", "moderator"]).default("moderator"),
});

adminAuth.post("/bootstrap", async (c) => {
  const body = await parseJson(c, bootstrapSchema);
  const expected = (c.env as unknown as { ADMIN_BOOTSTRAP_TOKEN?: string }).ADMIN_BOOTSTRAP_TOKEN;
  if (!expected || body.token !== expected) {
    throw new APIError("NOT_FOUND", "Not found.");
  }
  const hash = await hashPassword(body.password);
  let id: number;
  try {
    const res = await c.env.DB.prepare(
      `INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?)`,
    )
      .bind(body.email, hash, body.role)
      .run();
    id = Number(res.meta.last_row_id);
  } catch (err) {

    const msg = (err as Error).message ?? "";
    if (/UNIQUE|constraint/i.test(msg)) {
      throw new APIError("CONFLICT", "Admin already exists.");
    }
    throw err;
  }

  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: id,
    action: "auth.bootstrap",
    targetType: "admin_user",
    targetId: String(id),
    reason: `role=${body.role}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return c.json({ ok: true, id, email: body.email, role: body.role }, 201);
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1),
});

adminAuth.post("/login", async (c) => {
  const body = await parseJson(c, loginSchema);
  const row = await c.env.DB.prepare(
    `SELECT a.id, a.email, a.password_hash, a.role, a.is_active, a.locked_until,
            (SELECT enrolled_at FROM admin_totp WHERE admin_user_id = a.id) AS totp_enrolled_at
       FROM admin_users a WHERE a.email = ?`,
  )
    .bind(body.email)
    .first<{
      id: number;
      email: string;
      password_hash: string;
      role: string;
      is_active: number;
      locked_until: string | null;
      totp_enrolled_at: string | null;
    }>();
  if (!row) {

    const meta0 = clientMeta(c);
    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: null,
      action: "auth.login.fail.unknown_email",
      reason: body.email,
      ip: meta0.ip,
      userAgent: meta0.userAgent,
    });
    throw new APIError("UNAUTHENTICATED", "Invalid credentials.");
  }
  assertActive(row);

  const ok = await verifyPassword(body.password, row.password_hash);
  const meta = clientMeta(c);
  if (!ok) {
    await bumpFailure(c.env.DB, row.id);
    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: row.id,
      action: "auth.login.fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    throw new APIError("UNAUTHENTICATED", "Invalid credentials.");
  }

  const pending = await issueToken(
    {
      sub: row.id,
      kind: "admin_pending",
      email: row.email,
      role: row.role,
      totp_enrolled: Boolean(row.totp_enrolled_at),
    } as never,
    c.env.JWT_ACCESS_SECRET,
    PENDING_TTL_SEC,
  );
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: row.id,
    action: "auth.login.pending",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return c.json({
    pendingToken: pending,
    expiresIn: PENDING_TTL_SEC,
    totpEnrolled: Boolean(row.totp_enrolled_at),
    role: row.role,
  });
});

adminAuth.post("/totp/enroll", async (c) => {
  const pending = await readPendingLive(c);
  if (pending.totp_enrolled) throw new APIError("CONFLICT", "TOTP already enrolled.");

  const provider = getKekProvider(c.env.ALE_KEK);
  const secret = randomTotpSecret();
  const encrypted = seal(secret, provider, TOTP_CTX);
  const codes = generateRecoveryCodes(10);

  await c.env.DB.prepare(
    `INSERT INTO admin_totp (admin_user_id, secret_encrypted, backup_codes_hash)
       VALUES (?, ?, ?)
     ON CONFLICT(admin_user_id) DO UPDATE SET
       secret_encrypted = excluded.secret_encrypted,
       backup_codes_hash = excluded.backup_codes_hash,
       enrolled_at = NULL,
       last_used_counter = NULL`,
  )
    .bind(pending.sub, encrypted, JSON.stringify(codes.hashes))
    .run();

  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: pending.sub,
    action: "auth.totp.enroll",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return c.json(
    {
      otpauthUrl: otpauthUrl({
        issuer: ADMIN_ISSUER,
        account: pending.email,
        secretB32: secret,
      }),
      secret,
      recoveryCodes: codes.plaintext,
    },
    201,
  );
});

const totpVerifySchema = z.object({ code: z.string().regex(/^\d{6}$/) });

adminAuth.post("/totp/verify", async (c) => {
  const pending = await readPendingLive(c);
  const body = await parseJson(c, totpVerifySchema);

  const row = await c.env.DB.prepare(
    `SELECT secret_encrypted, last_used_counter FROM admin_totp WHERE admin_user_id = ?`,
  )
    .bind(pending.sub)
    .first<{ secret_encrypted: string; last_used_counter: number | null }>();
  if (!row) throw new APIError("TOTP_REQUIRED", "TOTP not enrolled.");

  const provider = getKekProvider(c.env.ALE_KEK);
  const secret = open(row.secret_encrypted, provider, TOTP_CTX);
  const counter = verifyTotp(secret, body.code, row.last_used_counter);

  const meta = clientMeta(c);
  if (counter === null) {
    await bumpFailure(c.env.DB, pending.sub);
    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: pending.sub,
      action: "auth.totp.verify.fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    throw new APIError("TOTP_INVALID", "Invalid TOTP code.");
  }

  await c.env.DB.prepare(
    `UPDATE admin_totp
        SET last_used_counter = ?,
            enrolled_at = COALESCE(enrolled_at, CURRENT_TIMESTAMP)
      WHERE admin_user_id = ?`,
  )
    .bind(counter, pending.sub)
    .run();
  await resetFailure(c.env.DB, pending.sub);

  const tokens = await issueSession(c, pending.sub, undefined, true);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: pending.sub,
    action: "auth.totp.verify.success",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return c.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresIn: tokens.accessExpiresIn,
    admin: { id: pending.sub, email: pending.email, role: pending.role },
  });
});

const recoverySchema = z.object({ code: z.string().min(8).max(32) });

adminAuth.post("/recovery", async (c) => {
  const pending = await readPendingLive(c);
  const body = await parseJson(c, recoverySchema);

  const row = await c.env.DB.prepare(
    `SELECT backup_codes_hash FROM admin_totp WHERE admin_user_id = ?`,
  )
    .bind(pending.sub)
    .first<{ backup_codes_hash: string | null }>();
  if (!row?.backup_codes_hash) throw new APIError("TOTP_REQUIRED", "No recovery codes issued.");

  let stored: string[];
  try {
    stored = JSON.parse(row.backup_codes_hash);
  } catch {
    throw new APIError("INTERNAL_ERROR", "Corrupted recovery codes.");
  }
  const next = consumeRecoveryCode(stored, body.code);

  const meta = clientMeta(c);
  if (!next) {
    await bumpFailure(c.env.DB, pending.sub);
    await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
      adminUserId: pending.sub,
      action: "auth.recovery.fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    throw new APIError("TOTP_INVALID", "Invalid recovery code.");
  }

  await c.env.DB.prepare(
    `UPDATE admin_totp SET backup_codes_hash = ? WHERE admin_user_id = ?`,
  )
    .bind(JSON.stringify(next), pending.sub)
    .run();
  await resetFailure(c.env.DB, pending.sub);

  const tokens = await issueSession(c, pending.sub, undefined, true);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: pending.sub,
    action: "auth.recovery.success",
    reason: `codes_remaining=${next.length}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return c.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresIn: tokens.accessExpiresIn,
    admin: { id: pending.sub, email: pending.email, role: pending.role },
    codesRemaining: next.length,
  });
});
