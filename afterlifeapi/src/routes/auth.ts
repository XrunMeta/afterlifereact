import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { hashPassword, verifyPassword } from "../lib/password";
import { seal, getKekProvider } from "../lib/ale";
import { checkPwnedPassword } from "../lib/hibp";
import {
  issueSession,
  rotateSession,
  revokeRefresh,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
} from "../lib/session";
import { requireAuth } from "../middleware/auth";
import { ensureDeviceNotBanned } from "../lib/penaltyGate";
import { logActivity } from "../lib/logger";
import { requestSignupOtp, verifySignupOtp } from "../lib/otp";

import { verifyGoogleIdToken } from "../lib/googleAuth";
import { verifyAppleIdToken } from "../lib/appleAuth";
import { grantSignupFreeCredits } from "../lib/credits";

export const auth = new Hono<AppEnv>();

function parseSqliteTimestamp(ts: string): number {
  if (ts.includes("T")) return new Date(ts).getTime();
  return new Date(ts.replace(" ", "T") + "Z").getTime();
}

auth.get("/health", (c) => c.json({ ok: true, module: "auth" }));

const signupSchema = z.object({
  email: z.email().max(200),

  password: z.string().min(7).max(200).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/,
    "Password must be 7+ chars with lowercase, uppercase, and digit.",
  ),
  name: z.string().min(1).max(80),

  verificationCode: z.string().regex(/^\d{6}$/, "6-digit code required").optional(),
  googleIdToken: z.string().min(20).optional(),
  phone: z.string().min(4).max(40).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.number().int().min(13).max(120).optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),

  country: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  mobileCode: z.number().int().min(0).max(99999).optional(),
  region: z.string().max(20).optional(),
  marketingConsent: z.boolean().optional().default(false),
  deviceId: z.string().min(1).max(200).optional(),
  pushToken: z.string().min(1).max(500).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

const requestEmailCodeSchema = z.object({
  email: z.email().max(200),
});

auth.post("/email/request-code", async (c) => {
  const body = await parseJson(c, requestEmailCodeSchema);
  await requestSignupOtp(c.env, body.email);
  return c.json({ ok: true, expiresInSec: 300 });
});

const googleCheckSchema = z.object({ idToken: z.string().min(20) });
auth.post("/google/check", async (c) => {
  const body = await parseJson(c, googleCheckSchema);
  const payload = await verifyGoogleIdToken(c.env, body.idToken);

  const afterlife = await c.env.DB
    .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(payload.email)
    .first<{ id: number }>();

  return c.json({
    afterlifeExists: !!afterlife,
    xrunExists: false,
    email: payload.email,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
  });
});

const googleSignInSchema = z.object({
  idToken: z.string().min(20),
  deviceId: z.string().min(1).max(200).optional(),
  pushToken: z.string().min(1).max(500).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});
auth.post("/google", async (c) => {
  const body = await parseJson(c, googleSignInSchema);
  const db = c.env.DB;

  await ensureDeviceNotBanned(db, body.deviceId);

  const payload = await verifyGoogleIdToken(c.env, body.idToken);

  let userRow = await db
    .prepare(
      `SELECT id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until FROM users
        WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(payload.email)
    .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null }>();

  if (!userRow) {

    const randomSecret = crypto.randomUUID() + crypto.randomUUID();
    const passwordHash = await hashPassword(randomSecret);
    const fallbackName =
      payload.name ||
      [payload.given_name, payload.family_name].filter(Boolean).join(" ") ||
      payload.email.split("@")[0] ||
      "user";

    const inserted = await db
      .prepare(
        `INSERT INTO users (name, email, password_hash, avatar_url)
         VALUES (?, ?, ?, ?)
         RETURNING id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until`,
      )
      .bind(fallbackName, payload.email, passwordHash, payload.picture ?? null)
      .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null }>();
    if (!inserted) throw new APIError("INTERNAL_ERROR", "Failed to create user.");
    userRow = inserted;

    await logActivity(c, {
      userId: inserted.id,
      action: "auth.google.signup",
      details: { sub: payload.sub, email: payload.email },
    });

    try {
      await grantSignupFreeCredits(c, inserted.id);
    } catch (err) {
      console.error(`[SIGNUP_GRANT_FAIL] user_id=${inserted.id} err=${(err as Error).message}`);
    }
  } else {

    if (userRow.deletion_state !== "active") {
      throw new APIError("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
    }

    if (userRow.banned_until && parseSqliteTimestamp(userRow.banned_until) > Date.now()) {
      throw new APIError("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
        bannedUntil: userRow.banned_until,
      });
    }
    await logActivity(c, {
      userId: userRow.id,
      action: "auth.google.login",
      details: { sub: payload.sub },
    });
  }

  if (body.deviceId && body.pushToken) {
    await db
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(body.pushToken, userRow.id)
      .run();
    await db
      .prepare(
        `INSERT INTO user_devices (user_id, device_id, push_token, platform, last_active_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, device_id) DO UPDATE SET
           push_token = excluded.push_token,
           platform   = excluded.platform,
           is_active  = 1,
           last_active_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(userRow.id, body.deviceId, body.pushToken, body.platform ?? "web")
      .run();
  }

  const { accessToken, refreshToken, accessExpiresIn } = await issueSession(c, userRow.id, body.deviceId);
  setRefreshCookie(c, refreshToken);

  return c.json({
    accessToken,
    refreshToken,
    accessExpiresIn,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      funnelStage: userRow.funnelStage,
    },
  });
});

const appleSignInSchema = z.object({
  identityToken: z.string().min(20),
  fullName: z.object({ givenName: z.string().nullable().optional(), familyName: z.string().nullable().optional() }).optional(),
  deviceId: z.string().min(1).max(200).optional(),
  pushToken: z.string().min(1).max(500).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});
auth.post("/apple", async (c) => {
  const body = await parseJson(c, appleSignInSchema);
  const db = c.env.DB;

  await ensureDeviceNotBanned(db, body.deviceId);
  const payload = await verifyAppleIdToken(c.env, body.identityToken);

  let userRow = await db
    .prepare(
      `SELECT id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until FROM users
        WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(payload.email)
    .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null }>();

  if (!userRow) {

    const randomSecret = crypto.randomUUID() + crypto.randomUUID();
    const passwordHash = await hashPassword(randomSecret);
    const fallbackName =
      [body.fullName?.givenName, body.fullName?.familyName].filter(Boolean).join(" ") ||
      (payload.is_private_email ? "Apple User" : payload.email.split("@")[0]) ||
      "user";
    const inserted = await db
      .prepare(
        `INSERT INTO users (name, email, password_hash, avatar_url)
         VALUES (?, ?, ?, NULL)
         RETURNING id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until`,
      )
      .bind(fallbackName, payload.email, passwordHash)
      .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null }>();
    if (!inserted) throw new APIError("INTERNAL_ERROR", "Failed to create user.");
    userRow = inserted;

    await logActivity(c, {
      userId: inserted.id,
      action: "auth.apple.signup",
      details: { sub: payload.sub, isPrivateEmail: payload.is_private_email },
    });

    try {
      await grantSignupFreeCredits(c, inserted.id);
    } catch (err) {
      console.error(`[SIGNUP_GRANT_FAIL] user_id=${inserted.id} err=${(err as Error).message}`);
    }
  } else {
    if (userRow.deletion_state !== "active") {
      throw new APIError("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
    }
    if (userRow.banned_until && parseSqliteTimestamp(userRow.banned_until) > Date.now()) {
      throw new APIError("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
        bannedUntil: userRow.banned_until,
      });
    }
    await logActivity(c, {
      userId: userRow.id,
      action: "auth.apple.login",
      details: { sub: payload.sub },
    });
  }

  if (body.deviceId && body.pushToken) {
    await db
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(body.pushToken, userRow.id)
      .run();
    await db
      .prepare(
        `INSERT INTO user_devices (user_id, device_id, push_token, platform, last_active_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, device_id) DO UPDATE SET
           push_token = excluded.push_token,
           platform   = excluded.platform,
           is_active  = 1,
           last_active_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(userRow.id, body.deviceId, body.pushToken, body.platform ?? "ios")
      .run();
  }

  const { accessToken, refreshToken, accessExpiresIn } = await issueSession(c, userRow.id, body.deviceId);
  setRefreshCookie(c, refreshToken);

  return c.json({
    accessToken,
    refreshToken,
    accessExpiresIn,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      funnelStage: userRow.funnelStage,
    },
  });
});

auth.post("/signup", async (c) => {
  const body = await parseJson(c, signupSchema);
  const db = c.env.DB;

  await ensureDeviceNotBanned(db, body.deviceId);

  const hibp = await checkPwnedPassword(body.password, c.env, { minHitsToReject: 100_000 });
  if (hibp.breached) {
    throw new APIError(
      "VALIDATION_FAILED",
      `Password has appeared in public breaches (${hibp.hits} hits). Choose another.`,
    );
  }

  if (body.googleIdToken) {
    const payload = await verifyGoogleIdToken(c.env, body.googleIdToken);
    if (payload.email !== body.email) {
      throw new APIError("VALIDATION_FAILED", "Email does not match Google ID token.");
    }
  } else {
    if (!body.verificationCode) {
      throw new APIError("OTP_REQUIRED", "Either verificationCode or googleIdToken is required.");
    }
    await verifySignupOtp(c.env, body.email, body.verificationCode);
  }

  const passwordHash = await hashPassword(body.password);
  const phoneEnc = body.phone
    ? seal(body.phone, getKekProvider(c.env.ALE_KEK), "user.phone")
    : null;
  const ageEnc = body.age
    ? seal(String(body.age), getKekProvider(c.env.ALE_KEK), "user.age")
    : null;

  const existing = await db
    .prepare(`SELECT id, deletion_state, deleted_at FROM users WHERE email = ? LIMIT 1`)
    .bind(body.email)
    .first<{ id: number; deletion_state: string; deleted_at: string | null }>();
  const isWithdrawn = !!existing && (existing.deletion_state !== "active" || existing.deleted_at !== null);

  let inserted:
    | { id: number; name: string; email: string; funnel_stage: string; created_at: string }
    | null;

  if (existing && !isWithdrawn) {

    throw new APIError("CONFLICT", "Email already registered.");
  }

  if (isWithdrawn) {

    inserted = await db
      .prepare(
        `UPDATE users
            SET name = ?, password_hash = ?, phone = ?, gender = ?, age = ?, age_enc = ?,
                marketing_consent = ?, country = ?, mobile_code = ?, region = ?,
                deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL,
                failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING id, name, email, funnel_stage, created_at`,
      )
      .bind(
        body.name,
        passwordHash,
        phoneEnc,
        body.gender ?? null,
        null,
        ageEnc,
        body.marketingConsent ? 1 : 0,
        body.country ?? null,
        body.mobileCode ?? null,
        body.region ?? null,
        existing!.id,
      )
      .first();
  } else {

    try {
      inserted = await db
        .prepare(
          `INSERT INTO users (name, email, password_hash, phone, gender, age, age_enc, marketing_consent, country, mobile_code, region)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id, name, email, funnel_stage, created_at`,
        )
        .bind(
          body.name,
          body.email,
          passwordHash,
          phoneEnc,
          body.gender ?? null,
          null, 
          ageEnc,
          body.marketingConsent ? 1 : 0,
          body.country ?? null,
          body.mobileCode ?? null,
          body.region ?? null,
        )
        .first();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (/UNIQUE constraint failed: users\.email/i.test(msg)) {
        throw new APIError("CONFLICT", "Email already registered.");
      }
      throw err;
    }
  }
  if (!inserted) throw new APIError("INTERNAL_ERROR", "Failed to create user.");

  try {
    const stmts: D1PreparedStatement[] = [];
    for (const it of body.interests ?? []) {
      stmts.push(
        db
          .prepare(`INSERT OR IGNORE INTO user_interests (user_id, interest) VALUES (?, ?)`)
          .bind(inserted.id, it),
      );
    }

    if (body.deviceId && body.pushToken) {

      stmts.push(
        db
          .prepare(
            `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
               WHERE push_token = ? AND user_id != ? AND is_active = 1`,
          )
          .bind(body.pushToken, inserted.id),
      );
      stmts.push(
        db
          .prepare(
            `INSERT INTO user_devices (user_id, device_id, push_token, platform, last_active_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, device_id) DO UPDATE SET
               push_token = excluded.push_token,
               platform   = excluded.platform,
               is_active  = 1,
               last_active_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(inserted.id, body.deviceId, body.pushToken, body.platform ?? "web"),
      );
    }
    if (stmts.length) await db.batch(stmts);
  } catch (err) {
    await db.prepare(`DELETE FROM users WHERE id = ?`).bind(inserted.id).run();
    throw err;
  }

  try {
    await grantSignupFreeCredits(c, inserted.id);
  } catch (err) {
    console.error(`[SIGNUP_GRANT_FAIL] user_id=${inserted.id} err=${(err as Error).message}`);
  }

  const { accessToken, refreshToken, accessExpiresIn } = await issueSession(
    c,
    inserted.id,
    body.deviceId,
  );
  setRefreshCookie(c, refreshToken);

  await logActivity(c, { userId: inserted.id, action: "auth.signup" });

  return c.json(
    {
      accessToken,
      refreshToken,
      accessExpiresIn,
      user: {
        id: inserted.id,
        name: inserted.name,
        email: inserted.email,
        funnelStage: inserted.funnel_stage,
      },
    },
    201,
  );
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  deviceId: z.string().min(1).max(200).optional(),
  pushToken: z.string().min(1).max(500).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

const MAX_FAILED = 5;
const LOCK_MINUTES = 10;

auth.post("/login", async (c) => {
  const body = await parseJson(c, loginSchema);
  const db = c.env.DB;

  await ensureDeviceNotBanned(db, body.deviceId);

  const user = await db
    .prepare(
      `SELECT id, password_hash, failed_login_count, locked_until, deletion_state, banned_until
         FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(body.email)
    .first<{
      id: number;
      password_hash: string;
      failed_login_count: number;
      locked_until: string | null;
      deletion_state: string;
      banned_until: string | null;
    }>();

  const hashForCheck = user?.password_hash ?? (await hashPassword("dummy-nonmatch-0000"));

  let lockExpired = false;
  if (user?.locked_until) {
    const until = parseSqliteTimestamp(user.locked_until);
    if (until > Date.now()) {
      throw new APIError("ACCOUNT_LOCKED", "Account temporarily locked.");
    }
    lockExpired = true;
  }

  const ok = await verifyPassword(body.password, hashForCheck);
  if (!user || !ok) {
    let attempts = 0;
    let lockedJustNow = false;
    if (user) {

      const prevFails = lockExpired ? 0 : user.failed_login_count ?? 0;
      attempts = prevFails + 1;
      lockedJustNow = attempts >= MAX_FAILED;
      const lockUntil = lockedJustNow
        ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
        : null;
      await db
        .prepare(
          `UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?`,
        )
        .bind(attempts, lockUntil, user.id)
        .run();
    }

    if (lockedJustNow) {
      throw new APIError("ACCOUNT_LOCKED", "Account temporarily locked.", {
        attempts,
        maxAttempts: MAX_FAILED,
        lockMinutes: LOCK_MINUTES,
      });
    }
    throw new APIError("UNAUTHENTICATED", "Invalid credentials.", {
      attempts, 
      maxAttempts: MAX_FAILED,
    });
  }

  if (user.deletion_state !== "active") {
    throw new APIError("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
  }

  if (user.banned_until && parseSqliteTimestamp(user.banned_until) > Date.now()) {
    throw new APIError("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
      bannedUntil: user.banned_until,
    });
  }

  await db
    .prepare(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .bind(user.id)
    .run();

  if (body.deviceId && body.pushToken) {
    await db
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(body.pushToken, user.id)
      .run();
    await db
      .prepare(
        `INSERT INTO user_devices (user_id, device_id, push_token, platform, last_active_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, device_id) DO UPDATE SET
           push_token = excluded.push_token,
           platform   = excluded.platform,
           is_active  = 1,
           last_active_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(user.id, body.deviceId, body.pushToken, body.platform ?? "web")
      .run();
  }

  const { accessToken, refreshToken, accessExpiresIn } = await issueSession(c, user.id, body.deviceId);
  setRefreshCookie(c, refreshToken);

  await logActivity(c, { userId: user.id, action: "auth.login" });

  return c.json({ accessToken, refreshToken, accessExpiresIn });
});

auth.post("/refresh", async (c) => {
  const refresh = readRefreshCookie(c);
  if (!refresh) throw new APIError("UNAUTHENTICATED", "No refresh cookie.");
  const rotated = await rotateSession(c, refresh);
  setRefreshCookie(c, rotated.refreshToken);
  return c.json({ accessToken: rotated.accessToken, accessExpiresIn: rotated.accessExpiresIn });
});

const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(20),
});

auth.post("/refresh/token", async (c) => {
  const body = await parseJson(c, refreshTokenBodySchema);
  const rotated = await rotateSession(c, body.refreshToken);

  setRefreshCookie(c, rotated.refreshToken);
  return c.json({
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
    accessExpiresIn: rotated.accessExpiresIn,
  });
});

const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

auth.post("/logout", requireAuth, async (c) => {

  let bodyRefresh: string | undefined;
  try {
    const parsed = await parseJson(c, logoutSchema);
    bodyRefresh = parsed.refreshToken;
  } catch {

  }
  const cookieRefresh = readRefreshCookie(c);
  if (bodyRefresh) await revokeRefresh(c, bodyRefresh);
  if (cookieRefresh) await revokeRefresh(c, cookieRefresh);
  clearRefreshCookie(c);

  const userId = c.get("userId");
  const deviceId = c.req.header("X-Device-Id");
  if (userId && deviceId) {
    await c.env.DB
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND device_id = ?`,
      )
      .bind(userId, deviceId)
      .run();
  }
  if (userId) await logActivity(c, { userId, action: "auth.logout" });
  return c.json({ ok: true });
});

auth.post("/password/request-reset", async (c) => {
  const body = await parseJson(c, requestEmailCodeSchema);
  const userRow = await c.env.DB
    .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`)
    .bind(body.email.trim().toLowerCase())
    .first<{ id: number }>();
  if (userRow) {
    await requestSignupOtp(c.env, body.email);
  }

  return c.json({ ok: true, expiresInSec: 300 });
});

const resetPasswordSchema = z.object({
  email: z.email().max(200),
  verificationCode: z.string().regex(/^\d{6}$/),

  newPassword: z
    .string()
    .min(7)
    .max(200)
    .regex(/[a-z]/, "must contain a lowercase letter")
    .regex(/[A-Z]/, "must contain an uppercase letter")
    .regex(/\d/, "must contain a digit"),
});
auth.post("/password/reset", async (c) => {
  const body = await parseJson(c, resetPasswordSchema);
  const emailLower = body.email.trim().toLowerCase();

  await verifySignupOtp(c.env, body.email, body.verificationCode);

  const userRow = await c.env.DB
    .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`)
    .bind(emailLower)
    .first<{ id: number }>();
  if (!userRow) {
    throw new APIError("NOT_FOUND", "가입된 이메일이 아닙니다.");
  }

  const passwordHash = await hashPassword(body.newPassword);

  await c.env.DB
    .prepare(
      `UPDATE users
          SET password_hash = ?,
              failed_login_count = 0,
              locked_until = NULL,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(passwordHash, userRow.id)
    .run();

  await logActivity(c, { userId: userRow.id, action: "auth.password.reset" });
  return c.json({ ok: true });
});

auth.post("/email/login-code", async (c) => {
  const body = await parseJson(c, requestEmailCodeSchema);
  const userRow = await c.env.DB
    .prepare(`SELECT id, deletion_state FROM users WHERE email = ? AND deleted_at IS NULL`)
    .bind(body.email.trim().toLowerCase())
    .first<{ id: number; deletion_state: string }>();
  if (userRow && userRow.deletion_state === "active") {
    await requestSignupOtp(c.env, body.email);
  }
  return c.json({ ok: true, expiresInSec: 300 });
});

const emailLoginSchema = z.object({
  email: z.email().max(200),
  verificationCode: z.string().regex(/^\d{6}$/),
  deviceId: z.string().max(200).optional(),
  pushToken: z.string().max(500).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});
auth.post("/email/login", async (c) => {
  const body = await parseJson(c, emailLoginSchema);
  const emailLower = body.email.trim().toLowerCase();

  await ensureDeviceNotBanned(c.env.DB, body.deviceId);

  await verifySignupOtp(c.env, body.email, body.verificationCode);

  const user = await c.env.DB
    .prepare(`SELECT id, deletion_state, banned_until FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(emailLower)
    .first<{ id: number; deletion_state: string; banned_until: string | null }>();
  if (!user) throw new APIError("NOT_FOUND", "가입된 이메일이 아닙니다.");
  if (user.deletion_state !== "active") {
    throw new APIError("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
  }
  if (user.banned_until && parseSqliteTimestamp(user.banned_until) > Date.now()) {
    throw new APIError("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
      bannedUntil: user.banned_until,
    });
  }

  if (body.deviceId && body.pushToken) {
    await c.env.DB
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(body.pushToken, user.id)
      .run();
    await c.env.DB
      .prepare(
        `INSERT INTO user_devices (user_id, device_id, push_token, platform, last_active_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, device_id) DO UPDATE SET
           push_token = excluded.push_token,
           platform   = excluded.platform,
           is_active  = 1,
           last_active_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(user.id, body.deviceId, body.pushToken, body.platform ?? "web")
      .run();
  }

  await c.env.DB
    .prepare(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .bind(user.id)
    .run();

  const { accessToken, refreshToken, accessExpiresIn } = await issueSession(c, user.id, body.deviceId);
  setRefreshCookie(c, refreshToken);
  await logActivity(c, { userId: user.id, action: "auth.login.otp" });
  return c.json({ accessToken, refreshToken, accessExpiresIn });
});
