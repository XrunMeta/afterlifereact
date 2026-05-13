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
import { logActivity } from "../lib/logger";
import { requestSignupOtp, verifySignupOtp } from "../lib/otp";
import { registerXrunForAfterlifeUser, lookupXrunWalletByEmail, verifyXrunCredentials } from "../lib/xrun";
import { verifyGoogleIdToken } from "../lib/googleAuth";

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

  let xrunExists = false;
  if (!afterlife) {
    const lookup = await lookupXrunWalletByEmail(c.env, payload.email);
    xrunExists = lookup.found;
  }

  return c.json({
    afterlifeExists: !!afterlife,
    xrunExists,
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

  const payload = await verifyGoogleIdToken(c.env, body.idToken);

  let userRow = await db
    .prepare(
      `SELECT id, name, email, funnel_stage AS funnelStage FROM users
        WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(payload.email)
    .first<{ id: number; name: string | null; email: string; funnelStage: string }>();

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
         RETURNING id, name, email, funnel_stage AS funnelStage`,
      )
      .bind(fallbackName, payload.email, passwordHash, payload.picture ?? null)
      .first<{ id: number; name: string | null; email: string; funnelStage: string }>();
    if (!inserted) throw new APIError("INTERNAL_ERROR", "Failed to create user.");
    userRow = inserted;

    try {
      const xrun = await registerXrunForAfterlifeUser(c.env, {
        email: payload.email,
        name: fallbackName,

      });
      let xMember: number | null = null;
      let xGuid: string | null = null;
      let xWallet: string | null = null;
      if (xrun.status === "created" && xrun.member) {
        xMember = xrun.member;
        xGuid = xrun.guid ?? null;
        xWallet = xrun.wallet ?? null;
      } else if (xrun.status === "duplicate") {
        const lookup = await lookupXrunWalletByEmail(c.env, payload.email);
        if (lookup.found && lookup.member) {
          xMember = lookup.member;
          xGuid = lookup.guid ?? null;
          xWallet = lookup.wallet ?? null;
        }
      }
      if (xMember) {
        await db
          .prepare(
            `UPDATE users SET xrun_member_id = ?, xrun_guid = ?, xrun_wallet = ?, xrun_linked_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
          .bind(xMember, xGuid, xWallet, inserted.id)
          .run();
      }
      await logActivity(c, {
        userId: inserted.id,
        action: "xrun.link",
        details: { result: xrun.status, member: xMember, guid: xGuid, wallet: xWallet, reason: xrun.reason ?? null },
      });
    } catch (err) {
      console.error(`[GOOGLE_SIGNIN_XRUN_LINK_FAIL] user_id=${inserted.id} err=${(err as Error).message}`);
    }

    await logActivity(c, {
      userId: inserted.id,
      action: "auth.google.signup",
      details: { sub: payload.sub, email: payload.email },
    });
  } else {
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
    accessExpiresIn,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      funnelStage: userRow.funnelStage,
    },
  });
});

const xrunVerifySchema = z.object({
  email: z.email().max(200),
  pin: z.string().min(1).max(200),
});
auth.post("/xrun/verify", async (c) => {
  const body = await parseJson(c, xrunVerifySchema);

  const existing = await c.env.DB
    .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(body.email)
    .first<{ id: number }>();
  if (existing) {
    throw new APIError(
      "CONFLICT",
      "이미 afterlife에 가입된 이메일입니다. 로그인 화면에서 일반 로그인을 사용해주세요.",
    );
  }

  const result = await verifyXrunCredentials(c.env, body.email, body.pin);
  if (!result.found) {
    if (result.reason === "invalid credentials") {
      throw new APIError("UNAUTHENTICATED", "xrun 이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    throw new APIError("NOT_FOUND", "xrun 계정을 찾을 수 없습니다.");
  }
  await requestSignupOtp(c.env, body.email);
  return c.json({ ok: true, expiresInSec: 300 });
});

const xrunCompleteSchema = z.object({
  email: z.email().max(200),
  pin: z.string().min(1).max(200).optional(),
  verificationCode: z.string().regex(/^\d{6}$/, "6-digit code required").optional(),

  googleIdToken: z.string().min(20).optional(),

  name: z.string().min(1).max(80).optional(),
  phone: z.string().min(4).max(40).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.number().int().min(13).max(120).optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),
  marketingConsent: z.boolean().optional().default(false),
  deviceId: z.string().min(1).max(200).optional(),
  pushToken: z.string().min(1).max(500).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});
auth.post("/xrun/complete", async (c) => {
  const body = await parseJson(c, xrunCompleteSchema);
  const db = c.env.DB;

  let xrunMember: number | null = null;
  let xrunGuid: string | null = null;
  let xrunWallet: string | null = null;

  if (body.googleIdToken) {
    const payload = await verifyGoogleIdToken(c.env, body.googleIdToken);
    if (payload.email !== body.email) {
      throw new APIError("VALIDATION_FAILED", "Email does not match Google ID token.");
    }

    if (!body.verificationCode) {
      throw new APIError("OTP_REQUIRED", "verificationCode required");
    }
    await verifySignupOtp(c.env, body.email, body.verificationCode);

    const lookup = await lookupXrunWalletByEmail(c.env, body.email);
    if (!lookup.found || !lookup.member) {
      throw new APIError("NOT_FOUND", "xrun 회원이 없습니다.");
    }
    xrunMember = lookup.member;
    xrunGuid = lookup.guid ?? null;
    xrunWallet = lookup.wallet ?? null;
  } else {
    if (!body.pin) throw new APIError("VALIDATION_FAILED", "pin or googleIdToken required");
    if (!body.verificationCode) throw new APIError("OTP_REQUIRED", "verificationCode required");
    const xrun = await verifyXrunCredentials(c.env, body.email, body.pin);
    if (!xrun.found || !xrun.member) {
      throw new APIError("UNAUTHENTICATED", "xrun 이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    await verifySignupOtp(c.env, body.email, body.verificationCode);
    xrunMember = xrun.member;
    xrunGuid = xrun.guid ?? null;
    xrunWallet = xrun.wallet ?? null;
  }

  const existing = await db
    .prepare(
      `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(body.email)
    .first<{ id: number }>();
  if (existing) {
    throw new APIError(
      "CONFLICT",
      "이미 afterlife에 가입된 이메일입니다. 일반 로그인을 사용해주세요.",
    );
  }

  const randomSecret = crypto.randomUUID() + crypto.randomUUID();
  const passwordHash = await hashPassword(randomSecret);
  const fallbackName = body.email.split("@")[0] ?? "user";
  const finalName = body.name?.trim() || fallbackName;
  const phoneEnc = body.phone
    ? seal(body.phone, getKekProvider(c.env.ALE_KEK), "user.phone")
    : null;
  const ageEnc = body.age
    ? seal(String(body.age), getKekProvider(c.env.ALE_KEK), "user.age")
    : null;
  const inserted = await db
    .prepare(
      `INSERT INTO users (name, email, password_hash, phone, gender, age, age_enc, marketing_consent, xrun_member_id, xrun_guid, xrun_wallet, xrun_linked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       RETURNING id, name, email, funnel_stage AS funnelStage`,
    )
    .bind(
      finalName,
      body.email,
      passwordHash,
      phoneEnc,
      body.gender ?? null,
      null, 
      ageEnc,
      body.marketingConsent ? 1 : 0,
      xrunMember,
      xrunGuid,
      xrunWallet,
    )
    .first<{ id: number; name: string | null; email: string; funnelStage: string }>();
  if (!inserted) throw new APIError("INTERNAL_ERROR", "Failed to create user.");

  if (body.interests && body.interests.length > 0) {
    const stmts = body.interests.map((it) =>
      db
        .prepare(`INSERT OR IGNORE INTO user_interests (user_id, interest) VALUES (?, ?)`)
        .bind(inserted.id, it),
    );
    await db.batch(stmts);
  }

  if (body.deviceId && body.pushToken) {
    await db
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(body.pushToken, inserted.id)
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
      .bind(inserted.id, body.deviceId, body.pushToken, body.platform ?? "web")
      .run();
  }

  await logActivity(c, {
    userId: inserted.id,
    action: body.googleIdToken ? "auth.xrun.google.signup" : "auth.xrun.signup",
    details: { xrunMember, xrunGuid, xrunWallet },
  });

  const { accessToken, refreshToken, accessExpiresIn } = await issueSession(c, inserted.id, body.deviceId);
  setRefreshCookie(c, refreshToken);

  return c.json(
    {
      accessToken,
      accessExpiresIn,
      user: {
        id: inserted.id,
        name: inserted.name,
        email: inserted.email,
        funnelStage: inserted.funnelStage,
      },
    },
    201,
  );
});

auth.post("/signup", async (c) => {
  const body = await parseJson(c, signupSchema);
  const db = c.env.DB;

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

  let inserted:
    | { id: number; name: string; email: string; funnel_stage: string; created_at: string }
    | null;
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
    const xrun = await registerXrunForAfterlifeUser(c.env, {
      email: body.email,
      name: body.name,
      phone: body.phone,
      gender: body.gender,
      age: body.age,

      country: body.country,
      mobileCode: body.mobileCode,
      region: body.region,
    });

    let memberToSave: number | null = null;
    let guidToSave: string | null = null;
    let walletToSave: string | null = null;
    let resultLabel: string = xrun.status;

    if (xrun.status === "created" && xrun.member && xrun.guid) {
      memberToSave = xrun.member;
      guidToSave = xrun.guid;

      walletToSave = xrun.wallet ?? null;
    } else if (xrun.status === "duplicate") {
      const lookup = await lookupXrunWalletByEmail(c.env, body.email);
      if (lookup.found && lookup.member) {
        memberToSave = lookup.member;
        guidToSave = lookup.guid ?? null;
        walletToSave = lookup.wallet ?? null;
        resultLabel = "duplicate-linked";
      } else {
        resultLabel = "duplicate-lookup-miss";
      }
    }

    if (memberToSave) {
      await db
        .prepare(
          `UPDATE users SET xrun_member_id = ?, xrun_guid = ?, xrun_wallet = ?, xrun_linked_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(memberToSave, guidToSave, walletToSave, inserted.id)
        .run();
    }

    await logActivity(c, {
      userId: inserted.id,
      action: "xrun.link",
      details: {
        result: resultLabel,
        member: memberToSave,
        guid: guidToSave,
        wallet: walletToSave,
        reason: xrun.reason ?? null,
      },
    });
  } catch (err) {
    console.error(`[XRUN_LINK_FAIL] user_id=${inserted.id} err=${(err as Error).message}`);
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

  const user = await db
    .prepare(
      `SELECT id, password_hash, failed_login_count, locked_until
         FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(body.email)
    .first<{
      id: number;
      password_hash: string;
      failed_login_count: number;
      locked_until: string | null;
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

  return c.json({ accessToken, accessExpiresIn });
});

auth.post("/refresh", async (c) => {
  const refresh = readRefreshCookie(c);
  if (!refresh) throw new APIError("UNAUTHENTICATED", "No refresh cookie.");
  const rotated = await rotateSession(c, refresh);
  setRefreshCookie(c, rotated.refreshToken);
  return c.json({ accessToken: rotated.accessToken, accessExpiresIn: rotated.accessExpiresIn });
});

auth.post("/logout", requireAuth, async (c) => {
  const refresh = readRefreshCookie(c);
  if (refresh) await revokeRefresh(c, refresh);
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
  newPassword: z.string().min(8).max(128),
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
