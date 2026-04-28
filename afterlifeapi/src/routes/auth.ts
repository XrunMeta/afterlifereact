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
import { v_74defc } from "../lib/logger";
import { v_b78f7e, v_656e8b } from "../lib/otp";
import { v_6e4cc8, v_a0ec33 } from "../lib/xrun";

export const v_68f0aa = new v_b7c41b<v_de0a25>();

function v_e8cd3d(v_3a5fef): number {
  if (v_3a5fef.includes("T")) return new Date(v_3a5fef).getTime();
  return new Date(v_3a5fef.replace(" ", "T") + "Z").getTime();
}

v_68f0aa.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "auth" }));

const v_7b8b17 = v_1f4ea7.object({
  email: v_1f4ea7.email().max(200),
  password: v_1f4ea7.string().min(8).max(200),
  name: v_1f4ea7.string().min(1).max(80),
  verificationCode: v_1f4ea7.string().regex(/^\d{6}$/, "6-digit code required"),
  phone: v_1f4ea7.string().min(4).max(40).optional(),
  gender: v_1f4ea7.enum(["male", "female", "other"]).optional(),
  age: v_1f4ea7.number().int().min(13).max(120).optional(),
  interests: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),
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

v_68f0aa.post("/signup", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_7b8b17);
  const v_a1651b = v_3f4e2e.env.DB;

  const v_222361 = await v_2ffe8e(v_4d33b2.password, v_3f4e2e.env, { minHitsToReject: 100_000 });
  if (v_222361.breached) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `Password has appeared in public breaches (${v_222361.hits} hits). Choose another.`,
    );
  }

  await v_656e8b(v_3f4e2e.env, v_4d33b2.email, v_4d33b2.verificationCode);

  const v_df7439 = await v_54846c(v_4d33b2.password);
  const v_849998 = v_4d33b2.phone
    ? v_85de88(v_4d33b2.phone, v_a8614b(v_3f4e2e.env.ALE_KEK), "user.phone")
    : null;
  const v_1f5d19 = v_4d33b2.age
    ? v_85de88(String(v_4d33b2.age), v_a8614b(v_3f4e2e.env.ALE_KEK), "user.age")
    : null;

  let v_81161e;
  try {
    v_81161e = await v_a1651b
      .prepare(
        `INSERT INTO users (name, email, password_hash, phone, gender, age, age_enc, marketing_consent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
      )
      .first();
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed: users\.email/i.test(v_badeaf)) {
      throw new v_3ebe58("CONFLICT", "Email already registered.");
    }
    throw v_49263d;
  }
  if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to create user.");

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
    const v_76be17 = await v_6e4cc8(v_3f4e2e.env, {
      email: v_4d33b2.email,
      name: v_4d33b2.name,
      phone: v_4d33b2.phone,
      gender: v_4d33b2.gender,
      age: v_4d33b2.age,
    });

    let v_d03cc0 = null;
    let v_4aee34 = null;
    let v_a5f7d2 = null;
    let v_f55a40 = v_76be17.status;

    if (v_76be17.status === "created" && v_76be17.member && v_76be17.guid) {
      v_d03cc0 = v_76be17.member;
      v_4aee34 = v_76be17.guid;

      const v_534695 = await v_a0ec33(v_3f4e2e.env, v_4d33b2.email);
      if (v_534695.found) {
        v_a5f7d2 = v_534695.wallet ?? null;
        if (!v_4aee34 && v_534695.guid) v_4aee34 = v_534695.guid;
      }
    } else if (v_76be17.status === "duplicate") {
      const v_534695 = await v_a0ec33(v_3f4e2e.env, v_4d33b2.email);
      if (v_534695.found && v_534695.member) {
        v_d03cc0 = v_534695.member;
        v_4aee34 = v_534695.guid ?? null;
        v_a5f7d2 = v_534695.wallet ?? null;
        v_f55a40 = "duplicate-linked";
      } else {
        v_f55a40 = "duplicate-lookup-miss";
      }
    }

    if (v_d03cc0) {
      await v_a1651b
        .prepare(
          `UPDATE users SET xrun_member_id = ?, xrun_guid = ?, xrun_wallet = ?, xrun_linked_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(v_d03cc0, v_4aee34, v_a5f7d2, v_81161e.id)
        .run();
    }

    await v_74defc(v_3f4e2e, {
      userId: v_81161e.id,
      action: "xrun.link",
      details: {
        result: v_f55a40,
        member: v_d03cc0,
        guid: v_4aee34,
        wallet: v_a5f7d2,
        reason: v_76be17.reason ?? null,
      },
    });
  } catch (v_49263d) {
    console.error(`[XRUN_LINK_FAIL] user_id=${v_81161e.id} err=${(v_49263d as Error).message}`);
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
});

const v_91027d = 5;
const v_584268 = 10;

v_68f0aa.post("/login", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_5460cc);
  const v_a1651b = v_3f4e2e.env.DB;

  const v_625c74 = await v_a1651b
    .prepare(
      `SELECT id, password_hash, failed_login_count, locked_until
         FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(v_4d33b2.email)
    .first<{
      id: number;
      password_hash: string;
      failed_login_count: number;
      locked_until: string | null;
    }>();

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
    if (v_625c74) {

      const v_d0940a = v_9ef4e1 ? 0 : v_625c74.failed_login_count ?? 0;
      const v_27ed25 = v_d0940a + 1;
      const v_0a64d3 =
        v_27ed25 >= v_91027d
          ? new Date(Date.now() + v_584268 * 60_000).toISOString()
          : null;
      await v_a1651b
        .prepare(
          `UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?`,
        )
        .bind(v_27ed25, v_0a64d3, v_625c74.id)
        .run();
    }
    throw new v_3ebe58("UNAUTHENTICATED", "Invalid credentials.");
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

  const { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_ff8c95 } = await v_8ab5ff(v_3f4e2e, v_625c74.id, v_4d33b2.deviceId);
  v_56035d(v_3f4e2e, v_dfaee3);

  await v_74defc(v_3f4e2e, { userId: v_625c74.id, action: "auth.login" });

  return v_3f4e2e.json({ accessToken: v_2ca7e0, accessExpiresIn: v_ff8c95 });
});

v_68f0aa.post("/refresh", async (v_3f4e2e) => {
  const v_1a1b9b = v_bde6da(v_3f4e2e);
  if (!v_1a1b9b) throw new v_3ebe58("UNAUTHENTICATED", "No refresh cookie.");
  const v_7c0f0d = await v_27b603(v_3f4e2e, v_1a1b9b);
  v_56035d(v_3f4e2e, v_7c0f0d.refreshToken);
  return v_3f4e2e.json({ accessToken: v_7c0f0d.accessToken, accessExpiresIn: v_7c0f0d.accessExpiresIn });
});

v_68f0aa.post("/logout", v_6690d9, async (v_3f4e2e) => {
  const v_1a1b9b = v_bde6da(v_3f4e2e);
  if (v_1a1b9b) await v_e1c29b(v_3f4e2e, v_1a1b9b);
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
