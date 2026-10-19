import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_54846c, v_96aa7f } from "../lib/password";
import { v_85de88, v_a8614b } from "../lib/ale";
import { v_2ffe8e } from "../lib/hibp";
import {
  v_8ab5ff,
  v_27b603,
  v_e1c29b,
  v_56035d,
  v_91a253,
  v_bde6da,
} from "../lib/session";
import { v_6690d9 } from "../middleware/auth";
import { v_f8ffae } from "../lib/penaltyGate";
import { v_74defc } from "../lib/logger";
import { v_b78f7e, v_656e8b } from "../lib/otp";

import { v_a32f1d } from "../lib/googleAuth";
import { v_bb3c56 } from "../lib/appleAuth";
import { v_4960d7 } from "../lib/credits";
import {
  v_6e4cc8,
  v_a0ec33,
  v_937e23,
  v_3326b4,
  v_f748f8,
} from "../lib/xrun";

import { v_31fb59 } from "./users";

export const v_68f0aa = new v_b7c41b<v_de0a25>();

function v_e8cd3d(v_3a5fef): number {
  if (v_3a5fef.includes("T")) return new Date(v_3a5fef).getTime();
  return new Date(v_3a5fef.replace(" ", "T") + "Z").getTime();
}

v_68f0aa.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "auth" }));

const v_7b8b17 = v_1f4ea7.object({
  email: v_1f4ea7.email().max(200),

  password: v_1f4ea7.string().min(7).max(200).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/,
    "Password must be 7+ chars with lowercase, uppercase, and digit.",
  ),
  name: v_1f4ea7.string().min(1).max(80),

  verificationCode: v_1f4ea7.string().regex(/^\d{6}$/, "6-digit code required").optional(),
  googleIdToken: v_1f4ea7.string().min(20).optional(),
  phone: v_1f4ea7.string().min(4).max(40).optional(),
  gender: v_1f4ea7.enum(["male", "female", "other"]).optional(),
  age: v_1f4ea7.number().int().min(13).max(120).optional(),
  interests: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),

  country: v_1f4ea7.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  mobileCode: v_1f4ea7.number().int().min(0).max(99999).optional(),
  region: v_1f4ea7.string().max(20).optional(),
  marketingConsent: v_1f4ea7.boolean().optional().default(false),
  deviceId: v_1f4ea7.string().min(1).max(200).optional(),
  pushToken: v_1f4ea7.string().min(1).max(500).optional(),
  platform: v_1f4ea7.enum(["ios", "android", "web"]).optional(),
});

const v_192e7b = v_1f4ea7.object({
  email: v_1f4ea7.email().max(200),
});

v_68f0aa.post("/email/request-code", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_192e7b);
  await v_b78f7e(v_3f4e2e.env, v_4d33b2.email);
  return v_3f4e2e.json({ ok: true, expiresInSec: 300 });
});

const v_0666ec = v_1f4ea7.object({ email: v_1f4ea7.email().max(200) });
v_68f0aa.post("/email/check-xrun", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_0666ec);
  const [v_ed2073, v_76be17] = await Promise.all([
    v_3f4e2e.env.DB
      .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`)
      .bind(v_4d33b2.email)
      .first<{ id: number }>(),
    v_a0ec33(v_3f4e2e.env, v_4d33b2.email),
  ]);
  return v_3f4e2e.json({
    afterlifeExists: !!v_ed2073,
    xrunExists: !!v_76be17.found,
    email: v_4d33b2.email,
  });
});

const v_a55a85 = v_1f4ea7.object({ idToken: v_1f4ea7.string().min(20) });
v_68f0aa.post("/google/check", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_a55a85);
  const v_931bf0 = await v_a32f1d(v_3f4e2e.env, v_4d33b2.idToken);

  const [v_ed2073, v_76be17] = await Promise.all([
    v_3f4e2e.env.DB
      .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`)
      .bind(v_931bf0.email)
      .first<{ id: number }>(),

    v_a0ec33(v_3f4e2e.env, v_931bf0.email),
  ]);

  return v_3f4e2e.json({
    afterlifeExists: !!v_ed2073,
    xrunExists: !!v_76be17.found,
    email: v_931bf0.email,
    name: v_931bf0.name ?? null,
    picture: v_931bf0.picture ?? null,
  });
});

const v_79d3b6 = v_1f4ea7.object({
  idToken: v_1f4ea7.string().min(20),
  deviceId: v_1f4ea7.string().min(1).max(200).optional(),
  pushToken: v_1f4ea7.string().min(1).max(500).optional(),
  platform: v_1f4ea7.enum(["ios", "android", "web"]).optional(),
});
v_68f0aa.post("/google", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_79d3b6);
  const v_a1651b = v_3f4e2e.env.DB;

  await v_f8ffae(v_a1651b, v_4d33b2.deviceId);

  const v_931bf0 = await v_a32f1d(v_3f4e2e.env, v_4d33b2.idToken);

  let v_d1b635 = await v_a1651b
    .prepare(
      `SELECT id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until, deleted_at FROM users
        WHERE email = ? LIMIT 1`,
    )
    .bind(v_931bf0.email)
    .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null; deleted_at: string | null }>();

  if (v_d1b635 && v_d1b635.deletion_state !== "active") {
    const v_bc285e = await v_a1651b
      .prepare(
        `UPDATE users
            SET deletion_state = 'active',
                soft_deleted_at = NULL,
                deleted_at = NULL,
                failed_login_count = 0,
                locked_until = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until, deleted_at`,
      )
      .bind(v_d1b635.id)
      .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null; deleted_at: string | null }>();
    if (v_bc285e) v_d1b635 = v_bc285e;
    await v_74defc(v_3f4e2e, {
      userId: v_d1b635.id,
      action: "auth.google.revive",
      details: { sub: v_931bf0.sub, email: v_931bf0.email },
    });
  }

  if (!v_d1b635) {

    const v_c4820c = crypto.randomUUID() + crypto.randomUUID();
    const v_df7439 = await v_54846c(v_c4820c);
    const v_ef7664 =
      v_931bf0.name ||
      [v_931bf0.given_name, v_931bf0.family_name].filter(Boolean).join(" ") ||
      v_931bf0.email.split("@")[0] ||
      "user";

    const v_81161e = await v_a1651b
      .prepare(

        `INSERT INTO users (name, email, password_hash, avatar_url)
         VALUES (?, ?, ?, ?)
         RETURNING id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until, deleted_at`,
      )
      .bind(v_ef7664, v_931bf0.email, v_df7439, v_931bf0.picture ?? null)
      .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null; deleted_at: string | null }>();
    if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to create user.");
    v_d1b635 = v_81161e;

    try {
      const v_6bd187 = await v_6e4cc8(v_3f4e2e.env, {
        email: v_931bf0.email,
        name: v_ef7664,
      });
      let v_9816e7 = null;
      let v_3ac92c = null;
      let v_0cd34d = null;
      if (v_6bd187.status === "created" && v_6bd187.member) {
        v_9816e7 = v_6bd187.member;
        v_3ac92c = v_6bd187.guid ?? null;
        v_0cd34d = v_6bd187.wallet ?? null;
      } else if (v_6bd187.status === "duplicate") {
        const v_534695 = await v_a0ec33(v_3f4e2e.env, v_931bf0.email);
        if (v_534695.found && v_534695.member) {
          v_9816e7 = v_534695.member;
          v_3ac92c = v_534695.guid ?? null;
          v_0cd34d = v_534695.wallet ?? null;
        }
      }
      if (v_9816e7) {
        await v_a1651b
          .prepare(`UPDATE users SET xrun_member_id = ?, xrun_guid = ?, xrun_wallet = ?, xrun_linked_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .bind(v_9816e7, v_3ac92c, v_0cd34d, v_81161e.id)
          .run();

      } else {

        console.warn(`[auth.google.signup] xrun register failed user_id=${v_81161e.id}: ${v_6bd187.status} ${v_6bd187.reason ?? ""}`);
        await v_a1651b.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
        throw new v_3ebe58("XRUN_REGISTRATION_FAILED", "XRUN 가입에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch (v_49263d) {
      if (v_49263d instanceof v_3ebe58) throw v_49263d;
      console.warn(`[auth.google.signup] xrun register error user_id=${v_81161e.id}:`, (v_49263d as Error).message);
      await v_a1651b.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
      throw new v_3ebe58("XRUN_REGISTRATION_FAILED", "XRUN 가입에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }

    await v_74defc(v_3f4e2e, {
      userId: v_81161e.id,
      action: "auth.google.signup",
      details: { sub: v_931bf0.sub, email: v_931bf0.email },
    });

    try {
      await v_4960d7(v_3f4e2e, v_81161e.id);
    } catch (v_49263d) {
      console.error(`[SIGNUP_GRANT_FAIL] user_id=${v_81161e.id} err=${(v_49263d as Error).message}`);
    }
  } else {

    if (v_d1b635.deletion_state !== "active") {
      throw new v_3ebe58("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
    }
    if (v_d1b635.banned_until && v_e8cd3d(v_d1b635.banned_until) > Date.now()) {
      throw new v_3ebe58("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
        bannedUntil: v_d1b635.banned_until,
      });
    }

    const v_cc65d6 = v_931bf0.email.split("@")[0];
    const v_771f4c =
      v_931bf0.name ||
      [v_931bf0.given_name, v_931bf0.family_name].filter(Boolean).join(" ");
    if (v_771f4c && v_d1b635.name === v_cc65d6) {
      await v_a1651b
        .prepare(`UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(v_771f4c, v_d1b635.id)
        .run();
      v_d1b635.name = v_771f4c;
    }

    await v_74defc(v_3f4e2e, {
      userId: v_d1b635.id,
      action: "auth.google.login",
      details: { sub: v_931bf0.sub },
    });
  }

  if (v_4d33b2.deviceId && v_4d33b2.pushToken) {
    await v_a1651b
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(v_4d33b2.pushToken, v_d1b635.id)
      .run();
    await v_a1651b
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
      .bind(v_d1b635.id, v_4d33b2.deviceId, v_4d33b2.pushToken, v_4d33b2.platform ?? "web")
      .run();
  }

  console.log(`[auth.google] success userId=${v_d1b635.id} email=${v_d1b635.email} name="${v_d1b635.name}" — queueing sync`);
  v_3f4e2e.executionCtx.waitUntil(v_f748f8(v_3f4e2e.env, v_d1b635.id, v_d1b635.email));

  const { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 } = await v_8ab5ff(v_3f4e2e, v_d1b635.id, v_4d33b2.deviceId);
  v_56035d(v_3f4e2e, v_dfaee3);

  return v_3f4e2e.json({
    accessToken: v_2ca7e0,
    refreshToken: v_dfaee3,
    accessExpiresIn: v_ff8c95,
    user: {
      id: v_d1b635.id,
      name: v_d1b635.name,
      email: v_d1b635.email,
      funnelStage: v_d1b635.funnelStage,
    },
  });
});

const v_ceba43 = v_1f4ea7.object({
  identityToken: v_1f4ea7.string().min(20),
  fullName: v_1f4ea7.object({ givenName: v_1f4ea7.string().nullable().optional(), familyName: v_1f4ea7.string().nullable().optional() }).optional(),
  deviceId: v_1f4ea7.string().min(1).max(200).optional(),
  pushToken: v_1f4ea7.string().min(1).max(500).optional(),
  platform: v_1f4ea7.enum(["ios", "android", "web"]).optional(),
});
v_68f0aa.post("/apple", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_ceba43);
  const v_a1651b = v_3f4e2e.env.DB;

  await v_f8ffae(v_a1651b, v_4d33b2.deviceId);
  const v_931bf0 = await v_bb3c56(v_3f4e2e.env, v_4d33b2.identityToken);

  let v_d1b635 = await v_a1651b
    .prepare(
      `SELECT id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until, deleted_at FROM users
        WHERE email = ? LIMIT 1`,
    )
    .bind(v_931bf0.email)
    .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null; deleted_at: string | null }>();

  if (v_d1b635 && v_d1b635.deletion_state !== "active") {
    const v_bc285e = await v_a1651b
      .prepare(
        `UPDATE users
            SET deletion_state = 'active',
                soft_deleted_at = NULL,
                deleted_at = NULL,
                failed_login_count = 0,
                locked_until = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until, deleted_at`,
      )
      .bind(v_d1b635.id)
      .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null; deleted_at: string | null }>();
    if (v_bc285e) v_d1b635 = v_bc285e;
    await v_74defc(v_3f4e2e, {
      userId: v_d1b635.id,
      action: "auth.apple.revive",
      details: { sub: v_931bf0.sub },
    });
  }

  if (!v_d1b635) {

    const v_c4820c = crypto.randomUUID() + crypto.randomUUID();
    const v_df7439 = await v_54846c(v_c4820c);
    const v_ef7664 =
      [v_4d33b2.fullName?.givenName, v_4d33b2.fullName?.familyName].filter(Boolean).join(" ") ||
      (v_931bf0.is_private_email ? "Apple User" : v_931bf0.email.split("@")[0]) ||
      "user";
    const v_81161e = await v_a1651b
      .prepare(

        `INSERT INTO users (name, email, password_hash, avatar_url)
         VALUES (?, ?, ?, NULL)
         RETURNING id, name, email, funnel_stage AS funnelStage, deletion_state, banned_until, deleted_at`,
      )
      .bind(v_ef7664, v_931bf0.email, v_df7439)
      .first<{ id: number; name: string | null; email: string; funnelStage: string; deletion_state: string; banned_until: string | null; deleted_at: string | null }>();
    if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to create user.");
    v_d1b635 = v_81161e;

    try {
      const v_6bd187 = await v_6e4cc8(v_3f4e2e.env, {
        email: v_931bf0.email,
        name: v_ef7664,
      });
      let v_9816e7 = null;
      let v_3ac92c = null;
      let v_0cd34d = null;
      if (v_6bd187.status === "created" && v_6bd187.member) {
        v_9816e7 = v_6bd187.member;
        v_3ac92c = v_6bd187.guid ?? null;
        v_0cd34d = v_6bd187.wallet ?? null;
      } else if (v_6bd187.status === "duplicate") {
        const v_534695 = await v_a0ec33(v_3f4e2e.env, v_931bf0.email);
        if (v_534695.found && v_534695.member) {
          v_9816e7 = v_534695.member;
          v_3ac92c = v_534695.guid ?? null;
          v_0cd34d = v_534695.wallet ?? null;
        }
      }
      if (v_9816e7) {
        await v_a1651b
          .prepare(`UPDATE users SET xrun_member_id = ?, xrun_guid = ?, xrun_wallet = ?, xrun_linked_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .bind(v_9816e7, v_3ac92c, v_0cd34d, v_81161e.id)
          .run();

      } else {

        console.warn(`[auth.apple.signup] xrun register failed user_id=${v_81161e.id}: ${v_6bd187.status} ${v_6bd187.reason ?? ""}`);
        await v_a1651b.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
        throw new v_3ebe58("XRUN_REGISTRATION_FAILED", "XRUN 가입에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch (v_49263d) {
      if (v_49263d instanceof v_3ebe58) throw v_49263d;
      console.warn(`[auth.apple.signup] xrun register error user_id=${v_81161e.id}:`, (v_49263d as Error).message);
      await v_a1651b.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
      throw new v_3ebe58("XRUN_REGISTRATION_FAILED", "XRUN 가입에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }

    await v_74defc(v_3f4e2e, {
      userId: v_81161e.id,
      action: "auth.apple.signup",
      details: { sub: v_931bf0.sub, isPrivateEmail: v_931bf0.is_private_email },
    });

    try {
      await v_4960d7(v_3f4e2e, v_81161e.id);
    } catch (v_49263d) {
      console.error(`[SIGNUP_GRANT_FAIL] user_id=${v_81161e.id} err=${(v_49263d as Error).message}`);
    }
  } else {

    if (v_d1b635.deletion_state !== "active") {
      throw new v_3ebe58("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
    }
    if (v_d1b635.banned_until && v_e8cd3d(v_d1b635.banned_until) > Date.now()) {
      throw new v_3ebe58("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
        bannedUntil: v_d1b635.banned_until,
      });
    }
    await v_74defc(v_3f4e2e, {
      userId: v_d1b635.id,
      action: "auth.apple.login",
      details: { sub: v_931bf0.sub },
    });
  }

  if (v_4d33b2.deviceId && v_4d33b2.pushToken) {
    await v_a1651b
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(v_4d33b2.pushToken, v_d1b635!.id)
      .run();
    await v_a1651b
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
      .bind(v_d1b635!.id, v_4d33b2.deviceId, v_4d33b2.pushToken, v_4d33b2.platform ?? "ios")
      .run();
  }

  v_3f4e2e.executionCtx.waitUntil(v_f748f8(v_3f4e2e.env, v_d1b635!.id, v_d1b635!.email));

  const { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 } = await v_8ab5ff(v_3f4e2e, v_d1b635!.id, v_4d33b2.deviceId);
  v_56035d(v_3f4e2e, v_dfaee3);

  return v_3f4e2e.json({
    accessToken: v_2ca7e0,
    refreshToken: v_dfaee3,
    accessExpiresIn: v_ff8c95,
    user: {
      id: v_d1b635!.id,
      name: v_d1b635!.name,
      email: v_d1b635!.email,
      funnelStage: v_d1b635!.funnelStage,
    },
  });
});

v_68f0aa.post("/signup", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_7b8b17);
  const v_a1651b = v_3f4e2e.env.DB;

  await v_f8ffae(v_a1651b, v_4d33b2.deviceId);

  const v_222361 = await v_2ffe8e(v_4d33b2.password, v_3f4e2e.env, { minHitsToReject: 100_000 });
  if (v_222361.breached) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `Password has appeared in public breaches (${v_222361.hits} hits). Choose another.`,
    );
  }

  if (v_4d33b2.googleIdToken) {
    const v_931bf0 = await v_a32f1d(v_3f4e2e.env, v_4d33b2.googleIdToken);
    if (v_931bf0.email !== v_4d33b2.email) {
      throw new v_3ebe58("VALIDATION_FAILED", "Email does not match Google ID token.");
    }
  } else {
    if (!v_4d33b2.verificationCode) {
      throw new v_3ebe58("OTP_REQUIRED", "Either verificationCode or googleIdToken is required.");
    }
    await v_656e8b(v_3f4e2e.env, v_4d33b2.email, v_4d33b2.verificationCode);
  }

  const v_df7439 = await v_54846c(v_4d33b2.password);
  const v_849998 = v_4d33b2.phone
    ? v_85de88(v_4d33b2.phone, v_a8614b(v_3f4e2e.env.ALE_KEK), "user.phone")
    : null;
  const v_1f5d19 = v_4d33b2.age
    ? v_85de88(String(v_4d33b2.age), v_a8614b(v_3f4e2e.env.ALE_KEK), "user.age")
    : null;

  const v_3c8572 = await v_a1651b
    .prepare(`SELECT id, deletion_state, deleted_at FROM users WHERE email = ? LIMIT 1`)
    .bind(v_4d33b2.email)
    .first<{ id: number; deletion_state: string; deleted_at: string | null }>();
  const v_d47623 = !!v_3c8572 && (v_3c8572.deletion_state !== "active" || v_3c8572.deleted_at !== null);

  let v_81161e;

  if (v_3c8572 && !v_d47623) {

    throw new v_3ebe58("CONFLICT", "Email already registered.");
  }

  if (v_d47623) {

    v_81161e = await v_a1651b
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
        v_4d33b2.name,
        v_df7439,
        v_849998,
        v_4d33b2.gender ?? null,
        null,
        v_1f5d19,
        v_4d33b2.marketingConsent ? 1 : 0,
        v_4d33b2.country ?? null,
        v_4d33b2.mobileCode ?? null,
        v_4d33b2.region ?? null,
        v_3c8572!.id,
      )
      .first();
  } else {

    try {
      v_81161e = await v_a1651b
        .prepare(
          `INSERT INTO users (name, email, password_hash, phone, gender, age, age_enc, marketing_consent, country, mobile_code, region, sso_consent_version, sso_consent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           RETURNING id, name, email, funnel_stage, created_at`,
        )
        .bind(
          v_4d33b2.name,
          v_4d33b2.email,
          v_df7439,
          v_849998,
          v_4d33b2.gender ?? null,
          null, 
          v_1f5d19,
          v_4d33b2.marketingConsent ? 1 : 0,
          v_4d33b2.country ?? null,
          v_4d33b2.mobileCode ?? null,
          v_4d33b2.region ?? null,
          v_31fb59,
        )
        .first();
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (/UNIQUE constraint failed: users\.email/i.test(v_badeaf)) {
        throw new v_3ebe58("CONFLICT", "Email already registered.");
      }
      throw v_49263d;
    }
  }
  if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to create user.");

  if (v_4d33b2.marketingConsent) {
    await v_a1651b
      .prepare(
        `INSERT INTO user_consent_log (user_id, consent_type, state, terms_version, channel, changed_at)
         VALUES (?, 'marketing', 'granted', ?, 'signup', ?)`,
      )
      .bind((v_81161e as { id: number }).id, v_31fb59, Date.now())
      .run();
  }

  try {
    const v_3e6264 = [];
    for (const v_23805a of v_4d33b2.interests ?? []) {
      v_3e6264.push(
        v_a1651b
          .prepare(`INSERT OR IGNORE INTO user_interests (user_id, interest) VALUES (?, ?)`)
          .bind(v_81161e.id, v_23805a),
      );
    }

    if (v_4d33b2.deviceId && v_4d33b2.pushToken) {

      v_3e6264.push(
        v_a1651b
          .prepare(
            `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
               WHERE push_token = ? AND user_id != ? AND is_active = 1`,
          )
          .bind(v_4d33b2.pushToken, v_81161e.id),
      );
      v_3e6264.push(
        v_a1651b
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
          .bind(v_81161e.id, v_4d33b2.deviceId, v_4d33b2.pushToken, v_4d33b2.platform ?? "web"),
      );
    }
    if (v_3e6264.length) await v_a1651b.batch(v_3e6264);
  } catch (v_49263d) {
    await v_a1651b.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
    throw v_49263d;
  }

  try {
    const v_6bd187 = await v_6e4cc8(v_3f4e2e.env, {
      email: v_4d33b2.email,
      name: v_4d33b2.name,
      password: v_4d33b2.password,
      phone: v_4d33b2.phone,
      gender: v_4d33b2.gender,
      age: v_4d33b2.age,
      country: v_4d33b2.country,
      mobileCode: v_4d33b2.mobileCode,
      region: v_4d33b2.region,

      deviceId: v_4d33b2.deviceId,
    });
    let v_9816e7 = null;
    let v_3ac92c = null;
    let v_0cd34d = null;
    if (v_6bd187.status === "created" && v_6bd187.member) {
      v_9816e7 = v_6bd187.member;
      v_3ac92c = v_6bd187.guid ?? null;
      v_0cd34d = v_6bd187.wallet ?? null;
    } else if (v_6bd187.status === "duplicate") {

      const v_534695 = await v_a0ec33(v_3f4e2e.env, v_4d33b2.email);
      if (v_534695.found && v_534695.member) {
        v_9816e7 = v_534695.member;
        v_3ac92c = v_534695.guid ?? null;
        v_0cd34d = v_534695.wallet ?? null;
      }
    }
    if (v_9816e7) {
      await v_3f4e2e.env.DB
        .prepare(`UPDATE users SET xrun_member_id = ?, xrun_guid = ?, xrun_wallet = ?, xrun_linked_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(v_9816e7, v_3ac92c, v_0cd34d, v_81161e.id)
        .run();

      v_3f4e2e.executionCtx.waitUntil(
        v_3326b4(v_3f4e2e.env, v_9816e7, { service: true, location: true, privacy: true })
          .then((v_cb35cb) => { if (!v_cb35cb.ok) console.warn(`[auth.signup] syncTermsToXrun failed: ${v_cb35cb.reason}`); }),
      );
    } else {

      const v_b052de = v_6bd187.reason ?? "알 수 없는 오류";
      console.warn(`[auth.signup] xrun register failed user_id=${v_81161e.id}: ${v_6bd187.status}: ${v_b052de}`);
      await v_3f4e2e.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
      throw new v_3ebe58("XRUN_REGISTRATION_FAILED", v_b052de);
    }
  } catch (v_49263d) {
    if (v_49263d instanceof v_3ebe58) throw v_49263d;
    const v_badeaf = (v_49263d as Error).message;
    console.warn(`[auth.signup] xrun register error user_id=${v_81161e.id}:`, v_badeaf);
    await v_3f4e2e.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(v_81161e.id).run();
    throw new v_3ebe58("XRUN_REGISTRATION_FAILED", v_badeaf);
  }

  try {
    await v_4960d7(v_3f4e2e, v_81161e.id);
  } catch (v_49263d) {
    console.error(`[SIGNUP_GRANT_FAIL] user_id=${v_81161e.id} err=${(v_49263d as Error).message}`);
  }

  const { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 } = await v_8ab5ff(
    v_3f4e2e,
    v_81161e.id,
    v_4d33b2.deviceId,
  );
  v_56035d(v_3f4e2e, v_dfaee3);

  await v_74defc(v_3f4e2e, { userId: v_81161e.id, action: "auth.signup" });

  return v_3f4e2e.json(
    {
      accessToken: v_2ca7e0,
      refreshToken: v_dfaee3,
      accessExpiresIn: v_ff8c95,
      user: {
        id: v_81161e.id,
        name: v_81161e.name,
        email: v_81161e.email,
        funnelStage: v_81161e.funnel_stage,
      },
    },
    201,
  );
});

const v_5460cc = v_1f4ea7.object({
  email: v_1f4ea7.email(),
  password: v_1f4ea7.string().min(1),
  deviceId: v_1f4ea7.string().min(1).max(200).optional(),
  pushToken: v_1f4ea7.string().min(1).max(500).optional(),
  platform: v_1f4ea7.enum(["ios", "android", "web"]).optional(),

  verificationCode: v_1f4ea7.string().regex(/^\d{6}$/).optional(),
});

const v_91027d = 5;
const v_584268 = 10;

v_68f0aa.post("/login", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_5460cc);
  const v_a1651b = v_3f4e2e.env.DB;

  await v_f8ffae(v_a1651b, v_4d33b2.deviceId);

  let v_625c74 = await v_a1651b
    .prepare(
      `SELECT id, password_hash, failed_login_count, locked_until, deletion_state, banned_until, deleted_at
         FROM users WHERE email = ? LIMIT 1`,
    )
    .bind(v_4d33b2.email)
    .first<{
      id: number;
      password_hash: string;
      failed_login_count: number;
      locked_until: string | null;
      deletion_state: string;
      banned_until: string | null;
      deleted_at: string | null;
    }>();

  let v_1329db = false;

  const v_735a1e = !v_625c74 || v_625c74.deletion_state !== "active";
  if (v_735a1e) {
    const v_dd506d = await v_937e23(v_3f4e2e.env, v_4d33b2.email, v_4d33b2.password);

    if (!v_dd506d.found && !v_625c74) {
      const v_534695 = await v_a0ec33(v_3f4e2e.env, v_4d33b2.email);
      if (!v_534695.found && !v_534695.reason) {
        throw new v_3ebe58("NOT_FOUND", "가입된 계정이 없습니다.");
      }
    }
    if (v_dd506d.found && v_dd506d.member) {

      if (!v_4d33b2.verificationCode) {
        await v_b78f7e(v_3f4e2e.env, v_4d33b2.email);
        return v_3f4e2e.json({
          requiresEmailVerification: true,
          email: v_4d33b2.email,
          expiresInSec: 300,
        });
      }
      await v_656e8b(v_3f4e2e.env, v_4d33b2.email, v_4d33b2.verificationCode);
      if (v_625c74) {

        const v_3fc173 = await v_54846c(v_4d33b2.password);
        const v_bc285e = await v_a1651b
          .prepare(
            `UPDATE users
                SET password_hash = ?,
                    deletion_state = 'active',
                    soft_deleted_at = NULL,
                    deleted_at = NULL,
                    failed_login_count = 0,
                    locked_until = NULL,
                    xrun_member_id = ?,
                    xrun_guid = ?,
                    xrun_wallet = ?,
                    xrun_linked_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
              RETURNING id, password_hash, failed_login_count, locked_until, deletion_state, banned_until, deleted_at`,
          )
          .bind(
            v_3fc173,
            v_dd506d.member,
            v_dd506d.guid ?? null,
            v_dd506d.wallet ?? null,
            v_625c74.id,
          )
          .first<{
            id: number;
            password_hash: string;
            failed_login_count: number;
            locked_until: string | null;
            deletion_state: string;
            banned_until: string | null;
            deleted_at: string | null;
          }>();
        if (!v_bc285e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to revive user from xrun link.");
        v_625c74 = v_bc285e;
        v_1329db = true;
        await v_74defc(v_3f4e2e, { userId: v_625c74.id, action: "auth.login.xrun_revive" });
      } else {

        const v_3fc173 = await v_54846c(v_4d33b2.password);
        const v_ef7664 = v_4d33b2.email.split("@")[0] || "user";
        const v_81161e = await v_a1651b
          .prepare(
            `INSERT INTO users (name, email, password_hash, xrun_member_id, xrun_guid, xrun_wallet, xrun_linked_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             RETURNING id, password_hash, failed_login_count, locked_until, deletion_state, banned_until, deleted_at`,
          )
          .bind(
            v_ef7664,
            v_4d33b2.email,
            v_3fc173,
            v_dd506d.member,
            v_dd506d.guid ?? null,
            v_dd506d.wallet ?? null,
          )
          .first<{
            id: number;
            password_hash: string;
            failed_login_count: number;
            locked_until: string | null;
            deletion_state: string;
            banned_until: string | null;
            deleted_at: string | null;
          }>();
        if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to create user from xrun link.");
        v_625c74 = v_81161e;
        v_1329db = true;
        try {
          await v_4960d7(v_3f4e2e, v_81161e.id);
        } catch (v_49263d) {
          console.error(`[AUTH/login.xrun_link] credit grant failed user_id=${v_81161e.id} err=${(v_49263d as Error).message}`);
        }
        await v_74defc(v_3f4e2e, { userId: v_81161e.id, action: "auth.login.xrun_link" });
      }
    }
  }

  const v_2d56e5 = v_625c74?.password_hash ?? (await v_54846c("dummy-nonmatch-0000"));

  let v_9ef4e1 = false;
  if (v_625c74?.locked_until) {
    const v_604a0d = v_e8cd3d(v_625c74.locked_until);
    if (v_604a0d > Date.now()) {
      throw new v_3ebe58("ACCOUNT_LOCKED", "Account temporarily locked.");
    }
    v_9ef4e1 = true;
  }

  const v_3ed4c3 = await v_96aa7f(v_4d33b2.password, v_2d56e5);
  if (!v_625c74 || !v_3ed4c3) {
    let v_45fe0c = 0;
    let v_faa105 = false;
    if (v_625c74) {

      const v_d0940a = v_9ef4e1 ? 0 : v_625c74.failed_login_count ?? 0;
      v_45fe0c = v_d0940a + 1;
      v_faa105 = v_45fe0c >= v_91027d;
      const v_0a64d3 = v_faa105
        ? new Date(Date.now() + v_584268 * 60_000).toISOString()
        : null;
      await v_a1651b
        .prepare(
          `UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?`,
        )
        .bind(v_45fe0c, v_0a64d3, v_625c74.id)
        .run();
    }

    if (v_faa105) {
      throw new v_3ebe58("ACCOUNT_LOCKED", "Account temporarily locked.", {
        attempts: v_45fe0c,
        maxAttempts: v_91027d,
        lockMinutes: v_584268,
      });
    }
    throw new v_3ebe58("UNAUTHENTICATED", "Invalid credentials.", {
      attempts: v_45fe0c, 
      maxAttempts: v_91027d,
    });
  }

  if (v_625c74.deletion_state !== "active") {
    throw new v_3ebe58("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
  }

  if (v_625c74.banned_until && v_e8cd3d(v_625c74.banned_until) > Date.now()) {
    throw new v_3ebe58("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
      bannedUntil: v_625c74.banned_until,
    });
  }

  await v_a1651b
    .prepare(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .bind(v_625c74.id)
    .run();

  if (v_4d33b2.deviceId && v_4d33b2.pushToken) {
    await v_a1651b
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(v_4d33b2.pushToken, v_625c74.id)
      .run();
    await v_a1651b
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
      .bind(v_625c74.id, v_4d33b2.deviceId, v_4d33b2.pushToken, v_4d33b2.platform ?? "web")
      .run();
  }

  v_3f4e2e.executionCtx.waitUntil(v_f748f8(v_3f4e2e.env, v_625c74.id, v_4d33b2.email));

  const { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 } = await v_8ab5ff(v_3f4e2e, v_625c74.id, v_4d33b2.deviceId);
  v_56035d(v_3f4e2e, v_dfaee3);

  await v_74defc(v_3f4e2e, { userId: v_625c74.id, action: v_1329db ? "auth.login.xrun_link.session" : "auth.login" });

  return v_3f4e2e.json({ accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95, linkedFromXrun: v_1329db });
});

v_68f0aa.post("/refresh", async (v_3f4e2e) => {
  const v_1a1b9b = v_bde6da(v_3f4e2e);
  if (!v_1a1b9b) throw new v_3ebe58("UNAUTHENTICATED", "No refresh cookie.");
  const v_7c0f0d = await v_27b603(v_3f4e2e, v_1a1b9b);
  v_56035d(v_3f4e2e, v_7c0f0d.refreshToken);
  return v_3f4e2e.json({ accessToken: v_7c0f0d.accessToken, accessExpiresIn: v_7c0f0d.accessExpiresIn });
});

const v_aaa2fc = v_1f4ea7.object({
  refreshToken: v_1f4ea7.string().min(20),
});

v_68f0aa.post("/refresh/token", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_aaa2fc);
  const v_7c0f0d = await v_27b603(v_3f4e2e, v_4d33b2.refreshToken);

  v_56035d(v_3f4e2e, v_7c0f0d.refreshToken);
  return v_3f4e2e.json({
    accessToken: v_7c0f0d.accessToken,
    refreshToken: v_7c0f0d.refreshToken,
    accessExpiresIn: v_7c0f0d.accessExpiresIn,
  });
});

const v_9088d8 = v_1f4ea7.object({
  refreshToken: v_1f4ea7.string().min(20).optional(),
});

v_68f0aa.post("/logout", v_6690d9, async (v_3f4e2e) => {

  let v_c6edfc;
  try {
    const v_8decf8 = await v_4c95c2(v_3f4e2e, v_9088d8);
    v_c6edfc = v_8decf8.refreshToken;
  } catch {

  }
  const v_98343d = v_bde6da(v_3f4e2e);
  if (v_c6edfc) await v_e1c29b(v_3f4e2e, v_c6edfc);
  if (v_98343d) await v_e1c29b(v_3f4e2e, v_98343d);
  v_91a253(v_3f4e2e);

  const v_43e90c = v_3f4e2e.get("userId");
  const v_929b58 = v_3f4e2e.req.header("X-Device-Id");
  if (v_43e90c && v_929b58) {
    await v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND device_id = ?`,
      )
      .bind(v_43e90c, v_929b58)
      .run();
  }
  if (v_43e90c) await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "auth.logout" });
  return v_3f4e2e.json({ ok: true });
});

v_68f0aa.post("/password/request-reset", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_192e7b);
  const v_e0c7e8 = v_4d33b2.email.trim().toLowerCase();
  let v_e2f7d0 = false;
  try {
    const v_8f00b9 = await fetch(`${v_3f4e2e.env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": v_3f4e2e.env.XRUN_INTERNAL_SECRET ?? "",
      },
      body: JSON.stringify({ email: v_e0c7e8 }),
    });
    const v_7ecfd1 = (await v_8f00b9.json().catch(() => ({}))) as { code?: number; message?: string };
    console.log(`[auth.password.request-reset] xrun code=${v_7ecfd1.code ?? v_8f00b9.status}`);
    v_e2f7d0 = v_7ecfd1.code === 404 || v_8f00b9.status === 404;
  } catch (v_49263d) {
    console.warn("[auth.password.request-reset] xrun fetch failed:", (v_49263d as Error).message);
  }
  if (v_e2f7d0) {
    throw new v_3ebe58("NOT_FOUND", "가입된 이메일이 아닙니다.");
  }
  return v_3f4e2e.json({ ok: true, expiresInSec: 600 });
});

const v_18702b = v_1f4ea7.object({
  email: v_1f4ea7.email().max(200),
  verificationCode: v_1f4ea7.string().regex(/^\d{6}$/),

  newPassword: v_1f4ea7
    .string()
    .min(7)
    .max(200)
    .regex(/[a-z]/, "must contain a lowercase letter")
    .regex(/[A-Z]/, "must contain an uppercase letter")
    .regex(/\d/, "must contain a digit"),
});
v_68f0aa.post("/password/reset", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_18702b);
  const v_bb4bfd = v_4d33b2.email.trim().toLowerCase();

  let v_69261d;
  try {
    const v_8f00b9 = await fetch(`${v_3f4e2e.env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": v_3f4e2e.env.XRUN_INTERNAL_SECRET ?? "",
      },
      body: JSON.stringify({ email: v_bb4bfd, code: v_4d33b2.verificationCode, newPin: v_4d33b2.newPassword }),
    });
    const v_7ecfd1 = (await v_8f00b9.json().catch(() => ({}))) as { code?: number; message?: string; status?: string };
    v_69261d = v_7ecfd1.code ?? v_8f00b9.status;
    console.log(`[auth.password.reset] xrun code=${v_69261d} msg=${v_7ecfd1.message ?? ""}`);
    if (v_69261d === 410) throw new v_3ebe58("OTP_EXPIRED", "코드가 만료되었거나 발급된 적이 없습니다.");
    if (v_69261d === 401) throw new v_3ebe58("OTP_INVALID", "코드가 올바르지 않습니다.");
    if (v_69261d === 404) throw new v_3ebe58("NOT_FOUND", "가입된 이메일이 아닙니다.");
    if (v_69261d !== 200 || v_7ecfd1.status !== "success") {
      throw new v_3ebe58("INTERNAL_ERROR", `XRUN 비밀번호 재설정 실패 (code=${v_69261d})`);
    }
  } catch (v_49263d) {
    if (v_49263d instanceof v_3ebe58) throw v_49263d;
    console.warn("[auth.password.reset] xrun fetch failed:", (v_49263d as Error).message);
    throw new v_3ebe58("INTERNAL_ERROR", `XRUN 네트워크 오류: ${(v_49263d as Error).message}`);
  }

  const v_d1b635 = await v_3f4e2e.env.DB
    .prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`)
    .bind(v_bb4bfd)
    .first<{ id: number }>();
  if (v_d1b635) {
    const v_df7439 = await v_54846c(v_4d33b2.newPassword);
    await v_3f4e2e.env.DB
      .prepare(
        `UPDATE users
            SET password_hash = ?,
                failed_login_count = 0,
                locked_until = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .bind(v_df7439, v_d1b635.id)
      .run();
    await v_74defc(v_3f4e2e, { userId: v_d1b635.id, action: "auth.password.reset" });
  }
  return v_3f4e2e.json({ ok: true });
});

v_68f0aa.post("/email/login-code", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_192e7b);
  const v_d1b635 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state FROM users WHERE email = ? AND deleted_at IS NULL`)
    .bind(v_4d33b2.email.trim().toLowerCase())
    .first<{ id: number; deletion_state: string }>();
  if (v_d1b635 && v_d1b635.deletion_state === "active") {
    await v_b78f7e(v_3f4e2e.env, v_4d33b2.email);
  }
  return v_3f4e2e.json({ ok: true, expiresInSec: 300 });
});

const v_a3bb20 = v_1f4ea7.object({
  email: v_1f4ea7.email().max(200),
  verificationCode: v_1f4ea7.string().regex(/^\d{6}$/),
  deviceId: v_1f4ea7.string().max(200).optional(),
  pushToken: v_1f4ea7.string().max(500).optional(),
  platform: v_1f4ea7.enum(["ios", "android", "web"]).optional(),
});
v_68f0aa.post("/email/login", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_a3bb20);
  const v_bb4bfd = v_4d33b2.email.trim().toLowerCase();

  await v_f8ffae(v_3f4e2e.env.DB, v_4d33b2.deviceId);

  await v_656e8b(v_3f4e2e.env, v_4d33b2.email, v_4d33b2.verificationCode);

  const v_625c74 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state, banned_until FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(v_bb4bfd)
    .first<{ id: number; deletion_state: string; banned_until: string | null }>();
  if (!v_625c74) throw new v_3ebe58("NOT_FOUND", "가입된 이메일이 아닙니다.");
  if (v_625c74.deletion_state !== "active") {
    throw new v_3ebe58("ACCOUNT_DELETED", "이미 탈퇴한 계정이에요.");
  }
  if (v_625c74.banned_until && v_e8cd3d(v_625c74.banned_until) > Date.now()) {
    throw new v_3ebe58("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
      bannedUntil: v_625c74.banned_until,
    });
  }

  if (v_4d33b2.deviceId && v_4d33b2.pushToken) {
    await v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE push_token = ? AND user_id != ? AND is_active = 1`,
      )
      .bind(v_4d33b2.pushToken, v_625c74.id)
      .run();
    await v_3f4e2e.env.DB
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
      .bind(v_625c74.id, v_4d33b2.deviceId, v_4d33b2.pushToken, v_4d33b2.platform ?? "web")
      .run();
  }

  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .bind(v_625c74.id)
    .run();

  v_3f4e2e.executionCtx.waitUntil(v_f748f8(v_3f4e2e.env, v_625c74.id, v_4d33b2.email));

  const { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 } = await v_8ab5ff(v_3f4e2e, v_625c74.id, v_4d33b2.deviceId);
  v_56035d(v_3f4e2e, v_dfaee3);
  await v_74defc(v_3f4e2e, { userId: v_625c74.id, action: "auth.login.otp" });
  return v_3f4e2e.json({ accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 });
});
