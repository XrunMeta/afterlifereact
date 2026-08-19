import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_74defc } from "../lib/logger";
import { v_e0041f, v_cfdcb0 } from "../lib/similarity";
import { v_916830, v_e35611 } from "../lib/appConfig";
import {
  v_74c502,
  v_a9ae28,
  v_7adf64,
  v_ab84f6,
  v_a697ec,
  v_5d4a51,
  v_efcb2d,
  v_d875d1,
} from "../lib/cloneAccess";
import { v_9c8187, v_55eb2a, v_3821c0, v_5729a9 } from "../lib/memoryStore";
import {
  v_dd9d7c,
  v_1ad6ed,
  v_721d54,
  v_70d294,
  v_cf0463,
  v_22b4d2,
} from "../lib/interactions";
import { v_7a6fc0 } from "../lib/xrun";
import { v_c226a5, v_80a022 } from "../lib/notify";
import { v_0b44ec } from "../lib/personaQuestions";
import { v_70b594 } from "../lib/knowledgeQuestions";
import { v_038cdc } from "../lib/knowledgeStore";
import { v_71b908, v_cba618 } from "../lib/knowledgeBlacklist";
import { v_041f8e, v_4b949c, v_5193f8, v_f64843 } from "../lib/assetJobs";
import { v_5acfc3 } from "../lib/utils";
import { v_67dc73 } from "../lib/prebuildClient";
import { v_87cfd2 } from "../lib/callBundle";
import { v_842ce7 } from "../lib/guideJob";
import { v_4c5429 } from "../lib/cloneFaceScope";
import { v_d0fd96 } from "../lib/displayName";

export const v_f891e6 = new v_b7c41b<v_de0a25>();

v_f891e6.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "clones" }));

v_f891e6.get("/check-username", async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_ceb55a = (v_f71b56.searchParams.get("u") ?? "").trim().toLowerCase();
  if (!v_ceb55a) {
    return v_3f4e2e.json({ available: false, reason: "invalid" });
  }
  if (!/^[a-z0-9_]{3,30}$/.test(v_ceb55a)) {
    return v_3f4e2e.json({ available: false, reason: "invalid" });
  }

  const v_51789f = new Set([
    "admin", "administrator", "root", "staff", "system", "support",
    "help", "official", "afterlife", "api", "null", "undefined",
    "anonymous", "mod", "moderator", "owner",
  ]);
  if (v_51789f.has(v_ceb55a)) {
    return v_3f4e2e.json({ available: false, reason: "reserved" });
  }
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT 1 AS x FROM clones WHERE username = ? LIMIT 1`)
    .bind(v_ceb55a)
    .first<{ x: number }>();
  return v_3f4e2e.json({ available: !v_3ac7e7 });
});

const v_3a8949 = v_1f4ea7.enum(["memlow", "friend", "mentor", "celeb"]);

const v_818579 = v_1f4ea7.enum(["public", "private", "followers", "selected"]);

const v_d2663f = new Set([
  "admin", "administrator", "root", "staff", "system", "support",
  "help", "official", "afterlife", "api", "null", "undefined",
  "anonymous", "mod", "moderator", "owner",
]);
const v_496c2d = 32 * 1024; 

const v_3ea364 = v_1f4ea7.object({
  attrs: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.string()),
  notes: v_1f4ea7.string().max(4000).default(''),
  personality_core: v_1f4ea7.string().max(500).optional(),
  tone: v_1f4ea7.string().max(500).optional(),
});

const v_a1f09b = v_1f4ea7.object({
  age: v_1f4ea7.string().max(20).optional(),
  gender: v_1f4ea7.string().max(20).optional(),
  mbti: v_1f4ea7.string().max(10).optional(),
  personaTypes: v_1f4ea7.array(v_1f4ea7.string().max(20)).max(8).optional(),
}).optional();

function v_8beace(
  v_694b25,
  v_5ed063,
): Record<string, unknown> | null {
  const v_835b82 = !!v_694b25;
  const v_94f955 = !!v_5ed063 && Object.values(v_5ed063).some(
    (v_81e2ef) => v_81e2ef !== undefined && (Array.isArray(v_81e2ef) ? v_81e2ef.length > 0 : true),
  );
  if (!v_835b82 && !v_94f955) return null;

  const v_3555ae = { ...(v_694b25?.attrs ?? {}) };
  if (v_5ed063?.age) v_3555ae.age = v_5ed063.age;
  if (v_5ed063?.gender) v_3555ae.gender = v_5ed063.gender;
  if (v_5ed063?.mbti) v_3555ae.mbti = v_5ed063.mbti;

  const v_020b4b = { attrs: v_3555ae, notes: v_694b25?.notes ?? "" };

  if (v_694b25?.personality_core) v_020b4b.personality_core = v_694b25.personality_core;
  else {
    const v_a6872a = v_5ed063?.personaTypes ?? [];
    if (v_a6872a.length) v_020b4b.personality_core = `${v_a6872a.join(", ")} 성향`;
  }
  if (v_694b25?.tone) v_020b4b.tone = v_694b25.tone;
  return v_020b4b;
}

const v_722b6d = v_1f4ea7.object({

  clone_type: v_3a8949.default("friend"),
  name: v_1f4ea7.string().min(1).max(80),
  username: v_1f4ea7
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "username must be lowercase alphanumeric + underscore"),
  description: v_1f4ea7.string().max(2000).optional(),
  category: v_1f4ea7.string().max(40).optional(),
  visibility: v_818579.default("private"),
  avatar_url: v_1f4ea7.url().max(500).optional(),
  cover_image_url: v_1f4ea7.url().max(500).optional(),
  voice_preset_id: v_1f4ea7.number().int().positive().optional(),
  interests: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),

  memlow_profile: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),

  l1_profile: v_3ea364.optional(),

  persona: v_a1f09b,

  pin: v_1f4ea7.string().regex(/^\d{6}$/).optional(),

  personaAnswers: v_1f4ea7.record(
    v_1f4ea7.string().regex(/^[a-zA-Z0-9_]{1,50}$/),
    v_1f4ea7.string().max(500),
  ).optional(),

  relation: v_1f4ea7.string().max(40).optional(),

  idle_video_job_id: v_1f4ea7.string().uuid().optional(),
  voice_clone_job_id: v_1f4ea7.string().uuid().optional(),

  pipeline: v_1f4ea7.enum(["musetalk", "echomimic_v3"]).optional(),
});

const v_34d2d5 = new Set(["oth-user@example.invalid", "oth-test@example.invalid"]);
const v_d548ed = (v_9e86fd): boolean => !!v_9e86fd && v_34d2d5.has(v_9e86fd);
const v_8e9814 = 0.05;

v_f891e6.post(
  "/",
  v_6690d9,
  v_a04a51("clones.create"),
  async (v_3f4e2e) => {
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_a1651b = v_3f4e2e.env.DB;

    const v_a235b0 = await v_a1651b
      .prepare(
        `SELECT suspended_until FROM users
          WHERE id = ? AND suspended_until IS NOT NULL
            AND suspended_until > datetime('now')`,
      )
      .bind(v_43e90c)
      .first<{ suspended_until: string }>();
    if (v_a235b0) {
      throw new v_3ebe58(
        "FORBIDDEN",
        "신고 누적으로 계정이 일시 비활성화되어 페르소나를 생성할 수 없어요.",
        { suspendedUntil: v_a235b0.suspended_until },
      );
    }

    if (v_d2663f.has(v_4d33b2.username)) {
      throw new v_3ebe58("VALIDATION_FAILED", "username is reserved.");
    }
    if (v_4d33b2.memlow_profile) {
      const v_05b441 = new TextEncoder().encode(JSON.stringify(v_4d33b2.memlow_profile)).length;
      if (v_05b441 > v_496c2d) {
        throw new v_3ebe58(
          "VALIDATION_FAILED",
          `memlow_profile too large (${v_05b441}B > ${v_496c2d}B).`,
        );
      }
    }

    const v_3c8572 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) AS n FROM clones
          WHERE owner_id = ?
            AND ${v_74c502()}`,
      )
      .bind(v_43e90c)
      .first<{ n: number }>();
    const v_faa47d = v_3c8572?.n ?? 0;

    const v_b32680 = await v_a1651b
      .prepare(`SELECT email FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ email: string | null }>();
    const v_2ab8bf = v_d548ed(v_b32680?.email)
      ? v_8e9814
      : await v_916830(v_3f4e2e.env);

    if (v_faa47d >= 100) {
      throw new v_3ebe58(
        "QUOTA_EXCEEDED",
        "최대 페르소나 개수(100개)에 도달했어요.",
      );
    }
    if (v_faa47d >= 1) {

      const v_b702a8 =
        String((v_3f4e2e.env as unknown as { CLONE_PAYMENT_BYPASS?: string }).CLONE_PAYMENT_BYPASS ?? "") === "1";

      if (!v_b702a8 && !v_4d33b2.pin) {
        throw new v_3ebe58("PAYMENT_REQUIRED", "Persona creation requires payment.", {
          priceXrun: v_2ab8bf,
          message: `2번째 페르소나부터 ${v_2ab8bf} XRUN 이 부과됩니다.`,
        });
      }

      const v_1111d7 = (v_3f4e2e.env as unknown as { DEV_PAYMENT_BYPASS_PIN?: string }).DEV_PAYMENT_BYPASS_PIN;
      if (v_b702a8) {
        console.warn(
          "[T-155][CLONE_PAYMENT_BYPASS] persona creation fully bypassed — no PIN/transfer/settlement, userId=",
          v_43e90c,
        );
      } else if (!v_1111d7 || v_4d33b2.pin !== v_1111d7) {

        const v_72b02d = v_3f4e2e.env.COMPANY_CHARGE_WALLET;
        if (!v_72b02d) {
          throw new v_3ebe58("INTERNAL_ERROR", "Server missing COMPANY_CHARGE_WALLET configuration.");
        }
        const v_3645f3 = await v_a1651b
          .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
          .bind(v_43e90c)
          .first<{ xrun_member_id: number | null }>();
        if (!v_3645f3?.xrun_member_id) {
          throw new v_3ebe58("CONFLICT", "xrun 계정이 연동되어 있지 않아요.");
        }
        const v_a832b3 = Number(v_3f4e2e.env.PAYMENT_CURRENCY ?? "18") || 18;
        const { externalTransferSplit: v_7a6fc0 } = await import("../lib/xrun");
        const v_e69235 = await v_7a6fc0(v_3f4e2e.env, {
          fromMember: v_3645f3.xrun_member_id,
          recipients: [{ toAddress: v_72b02d, amount: String(v_2ab8bf) }],
          currency: v_a832b3,

          pin: v_4d33b2.pin!,
          source: "afterlife.persona-create",
        });

        const v_f28f4d =
          v_d548ed(v_b32680?.email) && !v_e69235.ok && (v_e69235.code === 401 || v_e69235.code === 403);
        if (v_f28f4d) {
          console.log(`[persona-create][TEST_BYPASS] PIN 오류 무시하고 생성 진행 — reason=${v_e69235.reason}`);
        } else if (!v_e69235.ok) {

          if (v_e69235.code === 401 || v_e69235.code === 403) {
            const v_13cd33 = /paymentPin not set/i.test(v_e69235.reason ?? "");
            throw new v_3ebe58(
              v_13cd33 ? "PAYMENT_PIN_REQUIRED" : "PAYMENT_PIN_INVALID",
              v_13cd33 ? "결제 비밀번호가 설정되어 있지 않아요." : "결제 비밀번호가 일치하지 않아요.",
              { reason: v_e69235.reason ?? null },
            );
          }
          if (v_e69235.code === 402) {
            throw new v_3ebe58("INSUFFICIENT_FUNDS", "XRUN 잔액이 부족해요.");
          }
          throw new v_3ebe58("UPSTREAM_FAILURE", v_e69235.reason ?? "xrun transfer error");
        }

        try {
          const { recordAfterlifePersonaPayment: v_0ebe1e } = await import("../lib/giftCommission");
          const v_cb35cb = await v_0ebe1e(v_3f4e2e.env, {
            userId: v_43e90c,
            totalXrun: v_2ab8bf,
            companyWallet: v_72b02d,
          });
          if (v_cb35cb.recorded) {
            console.log(`[persona-create] settlement recorded — amount=${v_cb35cb.amount}`);
          } else {
            console.log(`[persona-create] settlement skip: ${v_cb35cb.reason}`);
          }
        } catch (v_49263d) {
          console.warn("[persona-create] settlement record failed:", (v_49263d as Error).message);
        }
      } else {

        console.warn("[DEV_BYPASS] persona payment skipped via bypass PIN, userId=", v_43e90c);
      }
    }

    if (v_4d33b2.voice_preset_id) {
      const v_f653fc = await v_a1651b
        .prepare(`SELECT id FROM voice_presets WHERE id = ? AND is_active = 1`)
        .bind(v_4d33b2.voice_preset_id)
        .first<{ id: number }>();
      if (!v_f653fc) throw new v_3ebe58("VALIDATION_FAILED", "Invalid or inactive voice_preset_id.");
    }

    const v_8e49c9 = v_4d33b2.voice_preset_id ? "preset" : "text_only";

    let v_204408 = v_4d33b2.l1_profile;
    if (v_4d33b2.personaAnswers && Object.keys(v_4d33b2.personaAnswers).length) {
      const v_c3519b = await v_0b44ec(v_3f4e2e.env.DB);
      const v_712fff = new Map(v_c3519b.map((v_ab6401) => [v_ab6401.key, v_ab6401]));
      const v_694b25 = v_204408 ?? { attrs: {}, notes: "" };
      const v_3555ae = { ...(v_694b25.attrs ?? {}) };
      const v_2be4f6 = { ...v_694b25, attrs: v_3555ae };
      for (const [v_b24339, v_3b402b] of Object.entries(v_4d33b2.personaAnswers)) {
        if (!v_3b402b) continue;
        const v_ab6401 = v_712fff.get(v_b24339);
        if (!v_ab6401) continue; 

        if (v_ab6401.targetField && v_ab6401.targetField !== "attrs" && v_ab6401.targetField !== "__proto__") {
          v_2be4f6[v_ab6401.targetField] = v_3b402b;
        } else if (!v_ab6401.targetField) {
          v_3555ae[v_b24339] = v_3b402b;
        }
      }
      v_2be4f6.attrs = v_3555ae;
      v_204408 = v_2be4f6 as typeof v_204408;
    }

    const v_564b6a = v_8beace(v_204408, v_4d33b2.persona);

    let v_81161e;
    try {

      v_81161e = await v_a1651b
        .prepare(
          `INSERT INTO clones
             (owner_id, name, username, description, clone_type, category, visibility,
              avatar_url, cover_image_url, voice_type, voice_preset_id,
              l1_profile, primary_editor_user_id, relation, pipeline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'musetalk'))
           RETURNING id, name, username, clone_type, visibility, created_at`,
        )
        .bind(
          v_43e90c,
          v_4d33b2.name,
          v_4d33b2.username,
          v_4d33b2.description ?? null,
          v_4d33b2.clone_type,
          v_4d33b2.category ?? null,
          v_4d33b2.visibility,
          v_4d33b2.avatar_url ?? null,
          v_4d33b2.cover_image_url ?? null,
          v_8e49c9,
          v_4d33b2.voice_preset_id ?? null,
          v_564b6a !== null ? JSON.stringify(v_564b6a) : null,
          v_43e90c,
          v_4d33b2.relation ?? null,
          v_4d33b2.pipeline ?? null,
        )
        .first();
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (/UNIQUE constraint failed: clones\.username/i.test(v_badeaf)) {
        throw new v_3ebe58("CONFLICT", "중복된 아이디입니다. 다른 아이디를 사용해주세요.");
      }

      throw v_49263d;
    }
    if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "페르소나 생성에 실패했어요.");

    const v_6e0fd3 = v_81161e.id;

    try {
      const v_3e6264 = [];
      for (const v_23805a of v_4d33b2.interests ?? []) {
        v_3e6264.push(
          v_a1651b
            .prepare(
              `INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`,
            )
            .bind(v_6e0fd3, v_23805a),
        );
      }

      v_3e6264.push(
        v_a1651b
          .prepare(
            `INSERT INTO clone_shares
               (clone_id, owner_id, target_user_id, role, status)
             VALUES (?, ?, ?, 'owner', 'accepted')`,
          )
          .bind(v_6e0fd3, v_43e90c, v_43e90c),
      );

      v_3e6264.push(
        v_a1651b
          .prepare(
            `INSERT INTO clone_stats (clone_id, followers_count, messages_count, gifts_count)
             VALUES (?, 0, 0, 0)
             ON CONFLICT(clone_id) DO NOTHING`,
          )
          .bind(v_6e0fd3),
      );

      const v_55a58f = v_564b6a?.attrs as Record<string, string> | undefined;
      if (v_55a58f) {
        for (const [v_b24339, v_3b402b] of Object.entries(v_55a58f)) {
          if (!v_3b402b) continue;
          v_3e6264.push(
            v_a1651b
              .prepare(
                `INSERT INTO persona_attributes (clone_id, level, key, value)
                 VALUES (?, 'l1', ?, ?)`,
              )
              .bind(v_6e0fd3, v_b24339, v_3b402b),
          );
        }
      }
      await v_a1651b.batch(v_3e6264);
    } catch (v_49263d) {

      await v_a1651b.prepare(`DELETE FROM clones WHERE id = ?`).bind(v_6e0fd3).run();
      throw v_49263d;
    }

    for (const [v_04211c, v_c8b83f] of [
      [v_4d33b2.idle_video_job_id, "idle_video_url"],
      [v_4d33b2.voice_clone_job_id, "voice_se_url"],
    ] as [string | undefined, string][]) {
      if (!v_04211c) continue;
      const v_d5ec97 = await v_4b949c(v_3f4e2e.env.DB, v_04211c);
      if (!v_d5ec97 || v_d5ec97.user_id !== v_43e90c) continue; 
      if (v_d5ec97.status === "done" && v_d5ec97.out_url) {

        await v_3f4e2e.env.DB.prepare(`UPDATE clones SET ${v_c8b83f} = ? WHERE id = ?`)
          .bind(v_d5ec97.out_url, v_6e0fd3)
          .run();
      } else {

        await v_f64843(v_3f4e2e.env.DB, v_04211c, v_6e0fd3);
        const v_f7a7f7 = await v_4b949c(v_3f4e2e.env.DB, v_04211c);
        if (v_f7a7f7?.status === "done" && v_f7a7f7.out_url) {

          await v_3f4e2e.env.DB.prepare(`UPDATE clones SET ${v_c8b83f} = ? WHERE id = ?`)
            .bind(v_f7a7f7.out_url, v_6e0fd3)
            .run();
        }

      }
    }

    if (v_4d33b2.idle_video_job_id) {
      const v_7f3fda = await v_4b949c(v_3f4e2e.env.DB, v_4d33b2.idle_video_job_id);
      if (v_7f3fda && v_7f3fda.user_id === v_43e90c) {

        let v_35d74b = null;
        if (v_4d33b2.voice_clone_job_id) {
          const v_710de1 = await v_4b949c(v_3f4e2e.env.DB, v_4d33b2.voice_clone_job_id);
          if (v_710de1 && v_710de1.user_id === v_43e90c) {
            const v_f17108 = new URL(v_3f4e2e.req.url).origin;
            v_35d74b = `${v_f17108}/oth-path${v_710de1.src_file_id}`;
          }
        }

        if (v_35d74b) {
          const v_9d7647 = crypto.randomUUID();
          const v_657c8f = await v_041f8e(
            v_3f4e2e.env.DB, v_9d7647, v_43e90c, "filler", v_7f3fda.src_file_id,
          );

          await v_f64843(v_3f4e2e.env.DB, v_9d7647, v_6e0fd3);

          if (v_3f4e2e.env.ORCHESTRATOR_URL && v_3f4e2e.env.ORCH_SECRET) {
            const v_f17108 = new URL(v_3f4e2e.req.url).origin;
            const v_2d0601 = `${v_f17108}/oth-path${v_7f3fda.src_file_id}`;
            v_3f4e2e.executionCtx.waitUntil(
              fetch(`${v_3f4e2e.env.ORCHESTRATOR_URL}/oth-path`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}`,
                },
                body: JSON.stringify({
                  job_id: v_9d7647,
                  kind: "filler",
                  face_url: v_2d0601,
                  clone_id: String(v_6e0fd3),
                  voice_raw_url: v_35d74b,
                  callback_token: v_657c8f,
                }),
                signal: AbortSignal.timeout(8000),
              })
                .then((v_8f00b9) => v_5193f8(v_3f4e2e.env.DB, v_9d7647, v_8f00b9.ok ? "running" : "failed"))
                .catch(() => v_5193f8(v_3f4e2e.env.DB, v_9d7647, "failed")),
            );
          }

          await v_842ce7(v_3f4e2e.env.DB, {
            cloneId: v_6e0fd3,
            userId: v_43e90c,
            faceSrcFileId: v_7f3fda.src_file_id,
            voiceRawUrl: v_35d74b,
            origin: new URL(v_3f4e2e.req.url).origin,
            orchestratorUrl: v_3f4e2e.env.ORCHESTRATOR_URL,
            orchSecret: v_3f4e2e.env.ORCH_SECRET,
            waitUntil: (v_e2a85c) => v_3f4e2e.executionCtx.waitUntil(v_e2a85c),
          });
        }
      }
    }

    if (v_4d33b2.clone_type === "memlow") {
      const v_911033 = JSON.stringify({
        persona: v_4d33b2.memlow_profile ?? {},
        family: [],
        _meta: { layer: "L1", rev: 1 },
      });
      try {
        await Promise.all([
          v_9c8187(v_3f4e2e.env, v_6e0fd3, v_911033),
          v_55eb2a(v_3f4e2e.env, v_6e0fd3, "[]", 0),
        ]);
      } catch (v_49263d) {
        console.error(`[MEMORY_INIT_FAIL] clone_id=${v_6e0fd3} err=${(v_49263d as Error).message}`);
      }
    }

    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "clone.create",
      details: { cloneId: v_6e0fd3, cloneType: v_4d33b2.clone_type },
    });

    if (v_4d33b2.visibility === "public" && v_4d33b2.clone_type !== "memlow") {
      try {
        const v_380fb2 = await v_a1651b
          .prepare(`SELECT name, email FROM users WHERE id = ?`)
          .bind(v_43e90c)
          .first<{ name: string | null; email: string | null }>();
        const v_6dd0ab =
          v_380fb2?.name || v_380fb2?.email?.split("@")[0] || "누군가";
        const v_823f08 = await v_a1651b
          .prepare(`SELECT follower_id FROM user_follows WHERE followee_id = ?`)
          .bind(v_43e90c)
          .all<{ follower_id: number }>();

        const v_110a8b = new Set<number>();
        for (const v_3ac7e7 of v_823f08.results ?? []) {
          if (v_3ac7e7.follower_id === v_43e90c) continue;
          if (v_110a8b.has(v_3ac7e7.follower_id)) continue;
          v_110a8b.add(v_3ac7e7.follower_id);
          await v_c226a5(v_3f4e2e.env, {
            userId: v_3ac7e7.follower_id,
            type: "followee_new_clone",
            title: "🌟 새 페르소나",
            body: `${v_6dd0ab} 님이 새 페르소나 '${v_4d33b2.name}' 을(를) 만들었어요`,
            url: `afterlife://clone/${v_6e0fd3}`,
            data: { cloneId: v_6e0fd3, ownerId: v_43e90c },
            skipEmail: true,
          });
        }
      } catch (v_49263d) {
        console.warn("[clone.create] followee_new_clone notify failed:", v_49263d);
      }
    }

    if (v_3f4e2e.env.PREBUILD_SECRET && v_3f4e2e.env.PRETHIRD_PUBLIC_BASE) {
      const v_f17108 = new URL(v_3f4e2e.req.url).origin;
      const v_a1651b = v_3f4e2e.env.DB;
      const v_43fd42 = v_3f4e2e.env.PREBUILD_SECRET;
      const v_694b25 = v_3f4e2e.env.PRETHIRD_PUBLIC_BASE;
      const v_062ae9 = v_6e0fd3;
      const v_0c8987 = v_43e90c;
      v_3f4e2e.executionCtx.waitUntil(
        (async () => {
          try {
            const v_3ac7e7 = await v_a1651b.prepare("SELECT * FROM clones WHERE id = ?").bind(v_062ae9).first<import("../lib/cloneAccess").CloneRow>();
            if (!v_3ac7e7?.voice_se_url) return; 
            const v_79521f = await v_87cfd2(v_a1651b, v_3ac7e7, v_0c8987, v_f17108);
            await v_67dc73(fetch, {
              base: v_694b25, secret: v_43fd42, cloneId: String(v_062ae9), voiceRawUrl: v_79521f.assets.voiceRawUrl,
            });
          } catch (v_9e86fd) {
            console.warn("[prebuild] trigger skipped:", v_9e86fd);
          }
        })(),
      );
    }

    return v_3f4e2e.json(
      {
        clone: {
          id: v_81161e.id,
          name: v_81161e.name,
          username: v_81161e.username,
          cloneType: v_81161e.clone_type,
          visibility: v_81161e.visibility,
          createdAt: v_81161e.created_at,
        },
        initial_memory: v_4d33b2.clone_type === "memlow"
          ? { ctx_key: `ctx:${v_6e0fd3}`, shared_key: `shared:${v_6e0fd3}` }
          : null,
      },
      201,
    );
  },
);

const v_5d756f = v_1f4ea7.object({
  q: v_1f4ea7.string().max(80).optional(),
  type: v_3a8949.optional(),
  category: v_1f4ea7.string().max(40).optional(),
  sort: v_1f4ea7.enum(["new", "popular"]).default("new"),
  cursor: v_1f4ea7.string().max(200).optional(),
  limit: v_1f4ea7.coerce.number().int().min(1).max(50).default(20),
});

function v_c9de8c(v_45efe3, v_389afb): string {
  const v_479f05 = `${v_45efe3}|${v_389afb}`;
  return btoa(v_479f05).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function v_e9da89(v_21cc31): { sortKey: string; id: number } | null {
  try {
    const v_8a9589 = v_21cc31.replace(/-/g, "+").replace(/_/g, "/");
    const v_8b8b16 = v_8a9589 + "=".repeat((4 - (v_8a9589.length % 4)) % 4);
    const v_479f05 = atob(v_8b8b16);
    const v_e86ad8 = v_479f05.lastIndexOf("|");
    if (v_e86ad8 < 0) return null;
    const v_45efe3 = v_479f05.slice(0, v_e86ad8);
    const v_389afb = Number(v_479f05.slice(v_e86ad8 + 1));
    if (!Number.isInteger(v_389afb) || v_389afb <= 0) return null;
    return { sortKey: v_45efe3, id: v_389afb };
  } catch {
    return null;
  }
}

v_f891e6.get("/search", async (v_3f4e2e) => {
  const v_ab6401 = v_5d756f.safeParse(
    Object.fromEntries(new URL(v_3f4e2e.req.url).searchParams.entries()),
  );
  if (!v_ab6401.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Query invalid.", v_ab6401.error.issues);
  }
  const v_24baff = v_ab6401.data;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_013af2 = await v_efcb2d(v_3f4e2e);

  const v_abcc8d = [v_74c502("c")];
  const v_925171 = [];
  if (v_013af2) {

    v_abcc8d.push(
      `(
         c.owner_id = ?
         OR (${v_a9ae28("c")} AND (
              c.visibility = 'public'
              OR (c.visibility = 'followers' AND
                  EXISTS (SELECT 1 FROM clone_follows cf
                           WHERE cf.clone_id = c.id AND cf.user_id = ?))
              OR (c.visibility = 'selected' AND
                  EXISTS (SELECT 1 FROM clone_allowed_viewers cav
                           WHERE cav.clone_id = c.id AND cav.user_id = ?))
         ))
       )`,
    );
    v_925171.push(v_013af2, v_013af2, v_013af2);

    v_abcc8d.push(`c.id NOT IN (SELECT clone_id FROM clone_blocks WHERE user_id = ?)`);
    v_925171.push(v_013af2);
    v_abcc8d.push(
      `c.owner_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)`,
    );
    v_925171.push(v_013af2);
  } else {

    v_abcc8d.push(`c.visibility = 'public' AND ${v_a9ae28("c")}`);
  }
  if (v_24baff.type) {
    v_abcc8d.push(`c.clone_type = ?`);
    v_925171.push(v_24baff.type);
  }
  if (v_24baff.category) {
    v_abcc8d.push(`c.category = ?`);
    v_925171.push(v_24baff.category);
  }

  const v_63b5ee = (v_cb35cb) => ({
    id: v_cb35cb.id,
    name: v_cb35cb.name,
    username: v_cb35cb.username,
    cloneType: v_cb35cb.clone_type,
    category: v_cb35cb.category,
    avatarUrl: v_cb35cb.avatar_url,
    stats: { followers: v_cb35cb.followers_count, messages: v_cb35cb.messages_count, gifts: v_cb35cb.gifts_count },
    createdAt: v_cb35cb.created_at,
  });

  if (v_24baff.q) {
    const v_ab2e34 = `
      SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url,
             c.created_at,
             COALESCE(s.followers_count, 0) AS followers_count,
             COALESCE(s.messages_count, 0)  AS messages_count,
             COALESCE(s.gifts_count, 0)     AS gifts_count
        FROM clones c
        LEFT JOIN clone_stats s ON s.clone_id = c.id
       WHERE ${v_abcc8d.join(" AND ")}
       ORDER BY COALESCE(s.followers_count, 0) DESC, c.id DESC
       LIMIT 500`;
    const v_75fbef = (
      await v_a1651b.prepare(v_ab2e34).bind(...v_925171).all<Parameters<typeof v_63b5ee>[0]>()
    ).results;
    const v_64462d = v_75fbef
      .map((v_cb35cb) => ({
        r: v_cb35cb,
        score: Math.max(
          v_e0041f(v_24baff.q!, v_cb35cb.name),
          v_e0041f(v_24baff.q!, v_cb35cb.username),
        ),
      }))
      .filter((v_62c214) => v_62c214.score >= v_cfdcb0)
      .sort((v_779914, v_148ff6) => v_148ff6.score - v_779914.score || v_148ff6.r.followers_count - v_779914.r.followers_count)
      .slice(0, v_24baff.limit)
      .map((v_62c214) => v_62c214.r);
    return v_3f4e2e.json({ items: v_64462d.map(v_63b5ee), nextCursor: null });
  }

  let v_5922ec;
  if (v_24baff.sort === "popular") {
    v_5922ec = `COALESCE(s.followers_count, 0) DESC, c.id DESC`;
    const v_c3bc75 = v_24baff.cursor ? v_e9da89(v_24baff.cursor) : null;
    if (v_c3bc75) {
      v_abcc8d.push(
        `(COALESCE(s.followers_count, 0) < ? OR (COALESCE(s.followers_count, 0) = ? AND c.id < ?))`,
      );
      v_925171.push(Number(v_c3bc75.sortKey), Number(v_c3bc75.sortKey), v_c3bc75.id);
    }
  } else {
    v_5922ec = `c.created_at DESC, c.id DESC`;
    const v_c3bc75 = v_24baff.cursor ? v_e9da89(v_24baff.cursor) : null;
    if (v_c3bc75) {
      v_abcc8d.push(`(c.created_at < ? OR (c.created_at = ? AND c.id < ?))`);
      v_925171.push(v_c3bc75.sortKey, v_c3bc75.sortKey, v_c3bc75.id);
    }
  }

  const v_f8df46 = `
    SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url,
           c.created_at,
           COALESCE(s.followers_count, 0) AS followers_count,
           COALESCE(s.messages_count, 0)  AS messages_count,
           COALESCE(s.gifts_count, 0)     AS gifts_count
      FROM clones c
      LEFT JOIN clone_stats s ON s.clone_id = c.id
     WHERE ${v_abcc8d.join(" AND ")}
     ORDER BY ${v_5922ec}
     LIMIT ?`;
  v_925171.push(v_24baff.limit + 1);

  const v_18b8bf = (
    await v_a1651b.prepare(v_f8df46).bind(...v_925171).all<{
      id: number;
      name: string;
      username: string;
      clone_type: string;
      category: string | null;
      avatar_url: string | null;
      created_at: string;
      followers_count: number;
      messages_count: number;
      gifts_count: number;
    }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_24baff.limit;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_24baff.limit) : v_18b8bf;
  let v_64f859 = null;
  if (v_6bbe19 && v_2365e9.length > 0) {
    const v_506e86 = v_2365e9[v_2365e9.length - 1]!;
    v_64f859 =
      v_24baff.sort === "popular"
        ? v_c9de8c(v_506e86.followers_count, v_506e86.id)
        : v_c9de8c(v_506e86.created_at, v_506e86.id);
  }

  return v_3f4e2e.json({
    items: v_2365e9.map(v_63b5ee),
    nextCursor: v_64f859,
  });
});

v_f891e6.get("/voices", v_6690d9, async (v_3f4e2e) => {
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, name_en, name_ja, name_zh_cn, name_id,
              gender, age_range, description, sort_order, src_file_id
       FROM voice_presets WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
    )
    .all<{
      id: number;
      name: string;
      name_en: string | null;
      name_ja: string | null;
      name_zh_cn: string | null;
      name_id: string | null;
      gender: string | null;
      age_range: string | null;
      description: string | null;
      sort_order: number;
      src_file_id: number | null;
    }>();
  const v_f17108 = new URL(v_3f4e2e.req.url).origin;

  const v_53e1f3 = (v_18b8bf.results ?? []).map((v_cb35cb) => ({
    id: v_cb35cb.id,
    name: v_cb35cb.name,
    nameEn: v_cb35cb.name_en,
    nameJa: v_cb35cb.name_ja,
    nameZhCn: v_cb35cb.name_zh_cn,
    nameId: v_cb35cb.name_id,
    gender: v_cb35cb.gender,
    ageRange: v_cb35cb.age_range,
    description: v_cb35cb.description,
    sortOrder: v_cb35cb.sort_order,
    srcFileId: v_cb35cb.src_file_id,
    sampleUrl: `${v_f17108}/oth-path${v_cb35cb.id}/sample`,
  }));
  return v_3f4e2e.json({ voices: v_53e1f3 });
});

v_f891e6.get("/voices/:id/sample", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid voice id.");
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT r2_key FROM voice_presets WHERE id = ? AND is_active = 1`)
    .bind(v_389afb)
    .first<{ r2_key: string | null }>();
  if (!v_3ac7e7?.r2_key) throw new v_3ebe58("NOT_FOUND", "Voice sample not found.");
  const v_8839e3 = await v_3f4e2e.env.R2_ARCHIVE.get(v_3ac7e7.r2_key);
  if (!v_8839e3) throw new v_3ebe58("NOT_FOUND", "Object missing in storage.");
  return new Response(v_8839e3.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
  });
});

v_f891e6.get("/system", v_6690d9, async (v_3f4e2e) => {
  const v_18b8bf = await v_3f4e2e.env.DB.prepare(
    `SELECT id, username, name, avatar_url, is_system FROM clones WHERE is_system = 1 AND ${v_74c502()}`,
  ).all<{ id: number; username: string; name: string; avatar_url: string | null; is_system: number }>();
  return v_3f4e2e.json({ items: v_18b8bf.results ?? [] });
});

v_f891e6.get("/persona-questions", v_6690d9, async (v_3f4e2e) => {
  const v_c3519b = await v_0b44ec(v_3f4e2e.env.DB);
  return v_3f4e2e.json({ questions: v_c3519b });
});

v_f891e6.get("/knowledge-questions", v_6690d9, async (v_3f4e2e) => {
  const v_c3519b = await v_70b594(v_3f4e2e.env.DB);
  return v_3f4e2e.json({ questions: v_c3519b });
});

v_f891e6.get("/knowledge-blacklist", v_6690d9, async (v_3f4e2e) => {
  const v_1468d5 = await v_cba618(v_3f4e2e.env.DB);
  return v_3f4e2e.json({ words: v_1468d5 });
});

v_f891e6.get("/:id/knowledge", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId") as number;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "소유자만 조회할 수 있어요.");
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT l1_profile FROM clones WHERE id = ? AND ${v_74c502()}`)
    .bind(v_6e0fd3)
    .first<{ l1_profile: string | null }>();
  let v_4622b9 = [];
  if (v_3ac7e7?.l1_profile) {
    try {
      const v_e2a85c = JSON.parse(v_3ac7e7.l1_profile);
      if (v_e2a85c && typeof v_e2a85c === "object" && Array.isArray(v_e2a85c.knowledge)) v_4622b9 = v_e2a85c.knowledge;
    } catch {

    }
  }
  return v_3f4e2e.json({ items: v_4622b9 });
});

v_f891e6.post("/:id/knowledge/interpret", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId") as number;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "소유자만 요청할 수 있어요.");

  const v_4d33b2 = await v_3f4e2e.req
    .json<{ questionKey?: unknown; answer?: unknown }>()
    .catch(() => ({}) as { questionKey?: unknown; answer?: unknown });
  const v_3960ea = typeof v_4d33b2.questionKey === "string" ? v_4d33b2.questionKey.trim() : "";
  const v_343c90 = typeof v_4d33b2.answer === "string" ? v_4d33b2.answer.trim() : "";
  if (!v_3960ea)
    throw new v_3ebe58("VALIDATION_FAILED", "questionKey 가 필요해요.");
  if (!v_343c90 || v_343c90.length > 3000)
    throw new v_3ebe58("VALIDATION_FAILED", "답변이 비어있거나 너무 길어요.");

  const v_c3519b = await v_70b594(v_a1651b);
  const v_ab6401 = v_c3519b.find((v_62c214) => v_62c214.key === v_3960ea);
  if (!v_ab6401) throw new v_3ebe58("NOT_FOUND", "질문을 찾을 수 없어요.");
  const v_966a46 = v_ab6401.slots ?? [];
  if (v_966a46.length === 0)
    throw new v_3ebe58("VALIDATION_FAILED", "질문에 카테고리(slot)가 없어요.");

  const v_43516e = await v_cba618(v_a1651b);
  if (v_43516e.length > 0) {
    const v_715950 = v_71b908(v_343c90, v_43516e);
    if (v_715950) {
      return v_3f4e2e.json(
        { error: "blacklist_hit", message: "다른 질문 부탁드립니다.", matched: v_715950 },
        400,
      );
    }
  }

  const v_694b25 = v_3f4e2e.env.PRETHIRD_PUBLIC_BASE;
  if (!v_694b25)
    throw new v_3ebe58("SERVICE_UNAVAILABLE", "interpret 서비스가 설정되지 않았어요.");
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_3f4e2e.env.KNOWLEDGE_INTERPRET_SECRET)
    v_3f4675["X-Internal-Secret"] = v_3f4e2e.env.KNOWLEDGE_INTERPRET_SECRET;

  const v_02f320 = await v_e35611(v_3f4e2e.env);

  let v_5fbc62 = {};
  try {
    const v_eb792a = await fetch(`${v_694b25}/prethird/knowledge/interpret`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({
        question: v_ab6401.label,
        answer: v_343c90,
        slots: v_966a46.map((v_fd5f43) => ({ key: v_fd5f43.key, label: v_fd5f43.label })),

        persona_name: v_eb25ce.name ?? null,
        extra_rules: v_02f320 || null,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!v_eb792a.ok) {
      console.warn("[knowledge-interpret] gabia HTTP", v_eb792a.status);
      throw new v_3ebe58("UPSTREAM_FAILURE", "해석 서비스가 응답하지 않아요.");
    }
    v_5fbc62 = await v_eb792a.json();
  } catch (v_9e86fd) {
    if (v_9e86fd instanceof v_3ebe58) throw v_9e86fd;
    console.warn("[knowledge-interpret] gabia fetch failed:", v_9e86fd);
    throw new v_3ebe58("UPSTREAM_FAILURE", "해석 서비스 오류");
  }

  const v_f13f1f = Array.isArray(v_5fbc62.slots) ? v_5fbc62.slots : [];
  const v_677216 = typeof v_5fbc62.reply === "string" ? v_5fbc62.reply : "";
  return v_3f4e2e.json({ slots: v_f13f1f, reply: v_677216 });
});

v_f891e6.post("/:id/knowledge/followup", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId") as number;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "소유자만 요청할 수 있어요.");

  const v_4d33b2 = await v_3f4e2e.req
    .json<{ questionLabel?: unknown; answer?: unknown }>()
    .catch(() => ({}) as { questionLabel?: unknown; answer?: unknown });
  const v_4f2598 = typeof v_4d33b2.questionLabel === "string" ? v_4d33b2.questionLabel.trim() : "";
  const v_343c90 = typeof v_4d33b2.answer === "string" ? v_4d33b2.answer.trim() : "";
  if (!v_4f2598 || !v_343c90) {
    throw new v_3ebe58("VALIDATION_FAILED", "questionLabel, answer 가 필요해요.");
  }

  const v_694b25 = v_3f4e2e.env.PRETHIRD_PUBLIC_BASE;
  if (!v_694b25) throw new v_3ebe58("SERVICE_UNAVAILABLE", "follow-up 서비스가 설정되지 않았어요.");
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_3f4e2e.env.KNOWLEDGE_INTERPRET_SECRET)
    v_3f4675["X-Internal-Secret"] = v_3f4e2e.env.KNOWLEDGE_INTERPRET_SECRET;

  let v_e1d486 = {};
  try {
    const v_eb792a = await fetch(`${v_694b25}/prethird/knowledge/followup`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({
        question: v_4f2598,
        answer: v_343c90,
        persona_name: v_eb25ce.name ?? null,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!v_eb792a.ok) {
      console.warn("[knowledge-followup] gabia HTTP", v_eb792a.status);
      return v_3f4e2e.json({ followup: "" });
    }
    v_e1d486 = await v_eb792a.json();
  } catch (v_9e86fd) {
    console.warn("[knowledge-followup] gabia fetch failed:", v_9e86fd);
    return v_3f4e2e.json({ followup: "" });
  }
  const v_e3e25f = typeof v_e1d486.followup === "string" ? v_e1d486.followup : "";
  return v_3f4e2e.json({ followup: v_e3e25f });
});

v_f891e6.put("/:id/knowledge", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId") as number;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "소유자만 변경할 수 있어요.");

  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT primary_editor_user_id, l1_profile FROM clones WHERE id = ? AND ${v_74c502()}`,
    )
    .bind(v_6e0fd3)
    .first<{ primary_editor_user_id: number | null; l1_profile: string | null }>();
  if (v_3ac7e7?.primary_editor_user_id !== v_43e90c)
    throw new v_3ebe58("FORBIDDEN", "주 편집자만 페르소나 정보를 수정할 수 있어요.");

  const v_4d33b2 = await v_3f4e2e.req
    .json<{ items?: unknown }>()
    .catch(() => ({}) as { items?: unknown });
  const v_b50631 = Array.isArray(v_4d33b2.items) ? v_4d33b2.items : [];
  const v_825625 = v_038cdc(v_b50631 as never, Date.now());
  if (!v_825625.ok) throw new v_3ebe58("VALIDATION_FAILED", v_825625.error);

  const v_43516e = await v_cba618(v_a1651b);
  if (v_43516e.length > 0) {
    for (const v_23805a of v_825625.items) {
      const v_715950 = v_71b908(v_23805a.a, v_43516e);
      if (v_715950) {
        return v_3f4e2e.json(
          {
            error: "blacklist_hit",
            message: "다른 질문 부탁드립니다.",
            matched: v_715950,
            key: v_23805a.key,
          },
          400,
        );
      }
    }
  }

  let v_020b4b = {};
  if (v_3ac7e7?.l1_profile) {
    try {
      const v_e2a85c = JSON.parse(v_3ac7e7.l1_profile);
      if (v_e2a85c && typeof v_e2a85c === "object") v_020b4b = v_e2a85c;
    } catch {

    }
  }
  v_020b4b.knowledge = v_825625.items;
  await v_a1651b
    .prepare(
      `UPDATE clones SET l1_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND ${v_74c502()}`,
    )
    .bind(JSON.stringify(v_020b4b), v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true, items: v_825625.items });
});

const v_32333b = v_1f4ea7.record(
  v_1f4ea7.string().max(50),
  v_1f4ea7.union([v_1f4ea7.string().max(200), v_1f4ea7.array(v_1f4ea7.string().max(50)).max(20)]),
);

v_f891e6.post("/persona-suggest", v_6690d9, async (v_3f4e2e) => {

  if (!v_3f4e2e.env.ORCHESTRATOR_URL || !v_3f4e2e.env.ORCH_SECRET) return v_3f4e2e.json({ suggestions: {} });
  const v_479f05 = await v_3f4e2e.req.json().catch(() => ({}));
  const v_8decf8 = v_32333b.safeParse(v_479f05);
  const v_727031 = v_8decf8.success ? v_8decf8.data : {};

  if (Object.keys(v_727031).length > 20) return v_3f4e2e.json({ suggestions: {} });

  const v_d32db2 = Object.values(v_727031).some((v_81e2ef) =>
    Array.isArray(v_81e2ef) ? v_81e2ef.length > 0 : v_81e2ef !== "",
  );
  if (!v_d32db2) return v_3f4e2e.json({ suggestions: {} });
  const v_c3519b = await v_0b44ec(v_3f4e2e.env.DB);
  const v_1ccb73 = v_c3519b
    .filter((v_ab6401) => v_ab6401.type === "gemma_choice")
    .map((v_ab6401) => ({ key: v_ab6401.key, label: v_ab6401.label, options_include: v_ab6401.options_include }));
  if (v_1ccb73.length === 0) return v_3f4e2e.json({ suggestions: {} });
  try {

    const v_cb35cb = await fetch(`${v_3f4e2e.env.ORCHESTRATOR_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}` },
      body: JSON.stringify({ profile: v_727031, questions: v_1ccb73 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!v_cb35cb.ok) return v_3f4e2e.json({ suggestions: {} });
    const v_9390e8 = await v_cb35cb.json<{ suggestions?: Record<string, string[]> }>();
    return v_3f4e2e.json({ suggestions: v_9390e8.suggestions ?? {} });
  } catch {

    return v_3f4e2e.json({ suggestions: {} });
  }
});

v_f891e6.post("/intro-suggest", v_6690d9, async (v_3f4e2e) => {

  if (!v_3f4e2e.env.ORCHESTRATOR_URL || !v_3f4e2e.env.ORCH_SECRET) return v_3f4e2e.json({ intro: "" });
  const v_479f05 = await v_3f4e2e.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));

  const v_727031 = {
    name: typeof v_479f05.name === "string" ? v_479f05.name.slice(0, 80) : undefined,
    relation: typeof v_479f05.relation === "string" ? v_479f05.relation.slice(0, 40) : undefined,
    personaAnswers:
      v_479f05.personaAnswers && typeof v_479f05.personaAnswers === "object"
        ? Object.fromEntries(
            Object.entries(v_479f05.personaAnswers as Record<string, unknown>)
              .filter(([v_0eb677, v_81e2ef]) => typeof v_0eb677 === "string" && typeof v_81e2ef === "string")
              .slice(0, 20)
              .map(([v_0eb677, v_81e2ef]) => [v_0eb677.slice(0, 50), (v_81e2ef as string).slice(0, 500)]),
          )
        : {},
  };
  try {
    const v_cb35cb = await fetch(`${v_3f4e2e.env.ORCHESTRATOR_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}` },
      body: JSON.stringify({ profile: v_727031 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!v_cb35cb.ok) return v_3f4e2e.json({ intro: "" });
    const v_9390e8 = await v_cb35cb.json<{ intro?: string }>();
    return v_3f4e2e.json({ intro: typeof v_9390e8.intro === "string" ? v_9390e8.intro : "" });
  } catch {

    return v_3f4e2e.json({ intro: "" });
  }
});

v_f891e6.post("/asset-job", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_479f05 = await v_3f4e2e.req.json<{ kind?: string; src_file_id?: number }>().catch(() => null);
  const v_94302c = v_479f05?.kind;
  const v_2fa661 = v_479f05?.src_file_id;

  if (v_94302c !== "idle_video" && v_94302c !== "voice_clone" && v_94302c !== "filler") {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid kind. Must be idle_video, voice_clone, or filler.");
  }
  if (!v_2fa661 || !Number.isInteger(v_2fa661)) {
    throw new v_3ebe58("VALIDATION_FAILED", "src_file_id required.");
  }
  const v_4de33e = await v_3f4e2e.env.DB
    .prepare(`SELECT id, r2_key, owner_user_id, purpose FROM files WHERE id = ?`)
    .bind(v_2fa661)
    .first<{ id: number; r2_key: string; owner_user_id: number | null; purpose: string | null }>();

  const v_8dc0bc = v_4de33e?.owner_user_id == null && v_4de33e?.purpose === "voice_catalog";
  if (!v_4de33e || (!v_8dc0bc && v_4de33e.owner_user_id !== v_43e90c)) {
    throw new v_3ebe58("NOT_FOUND", "Source file not found.");
  }
  const v_04211c = crypto.randomUUID();

  const v_59b4e0 = await v_041f8e(v_3f4e2e.env.DB, v_04211c, v_43e90c, v_94302c, v_2fa661);

  if (v_3f4e2e.env.ORCHESTRATOR_URL && v_3f4e2e.env.ORCH_SECRET) {
    const v_f17108 = new URL(v_3f4e2e.req.url).origin;
    const v_0ad77a = `${v_f17108}/oth-path${v_4de33e.id}`;

    v_3f4e2e.executionCtx.waitUntil(
      fetch(`${v_3f4e2e.env.ORCHESTRATOR_URL}/oth-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${v_3f4e2e.env.ORCH_SECRET}`,
        },
        body: JSON.stringify({ job_id: v_04211c, kind: v_94302c, src_url: v_0ad77a, callback_token: v_59b4e0 }),
        signal: AbortSignal.timeout(8000),
      })

        .then((v_8f00b9) => v_5193f8(v_3f4e2e.env.DB, v_04211c, v_8f00b9.ok ? "running" : "failed"))
        .catch(() => v_5193f8(v_3f4e2e.env.DB, v_04211c, "failed")),
    );
  }
  return v_3f4e2e.json({ job_id: v_04211c, status: "pending" }, 201);
});

v_f891e6.get("/asset-job/:id", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_d5ec97 = await v_4b949c(v_3f4e2e.env.DB, v_3f4e2e.req.param("id"));
  if (!v_d5ec97 || v_d5ec97.user_id !== v_43e90c) throw new v_3ebe58("NOT_FOUND", "Job not found.");
  return v_3f4e2e.json({
    job_id: v_d5ec97.id,
    kind: v_d5ec97.kind,
    status: v_d5ec97.status,
    out_url: v_d5ec97.out_url,
    error: v_d5ec97.error,
  });
});

v_f891e6.get("/:id", async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  const v_43e90c = await v_efcb2d(v_3f4e2e);
  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);

  if (v_eb25ce.visibility === "private" && v_00efe2 !== "owner" && v_00efe2 !== "coowner") {
    throw new v_3ebe58("FORBIDDEN", "비공개 페르소나예요.");
  }
  if (v_eb25ce.visibility === "followers" && v_00efe2 === null) {
    throw new v_3ebe58("FORBIDDEN", "팔로워에게만 공개된 페르소나예요.");
  }
  if (v_eb25ce.visibility === "selected") {
    const v_030f63 = v_00efe2 === "owner" || v_00efe2 === "coowner"
      ? true
      : v_43e90c != null && await v_3f4e2e.env.DB
          .prepare(
            `SELECT 1 FROM clone_allowed_viewers WHERE clone_id = ? AND user_id = ? LIMIT 1`,
          )
          .bind(v_6e0fd3, v_43e90c)
          .first();
    if (!v_030f63) throw new v_3ebe58("FORBIDDEN", "이 페르소나에 접근할 권한이 없어요.");
  }

  if (v_a697ec(v_eb25ce, v_00efe2)) {
    throw new v_3ebe58("FORBIDDEN", "이 페르소나는 현재 일시 중지 상태예요.");
  }

  const v_774c91 = (
    await v_3f4e2e.env.DB
      .prepare(`SELECT interest FROM clone_interests WHERE clone_id = ?`)
      .bind(v_6e0fd3)
      .all<{ interest: string }>()
  ).results.map((v_cb35cb) => v_cb35cb.interest);

  const v_548b93 =
    v_00efe2 === "owner" || v_00efe2 === "coowner"
      ? (await v_3f4e2e.env.DB
          .prepare(`SELECT user_id AS userId FROM clone_allowed_viewers WHERE clone_id = ?`)
          .bind(v_6e0fd3)
          .all<{ userId: number }>()).results.map((v_cb35cb) => v_cb35cb.userId)
      : undefined;

  const v_218436 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT
         (SELECT COALESCE(SUM(f.likes_count), 0) FROM feeds f
            WHERE f.clone_id = ?) AS likesCount,
         (SELECT COUNT(*) FROM feed_comments fc
            JOIN feeds f2 ON f2.id = fc.feed_id
            WHERE f2.clone_id = ?) AS commentsCount`,
    )
    .bind(v_6e0fd3, v_6e0fd3)
    .first<{ likesCount: number; commentsCount: number }>();

  let v_db2b0a = false;
  if (v_43e90c) {
    const v_cb35cb = await v_3f4e2e.env.DB
      .prepare(
        `SELECT 1 AS x FROM feed_likes fl
           JOIN feeds f ON f.id = fl.feed_id
          WHERE fl.user_id = ? AND f.clone_id = ?
          LIMIT 1`,
      )
      .bind(v_43e90c, v_6e0fd3)
      .first<{ x: number }>();
    v_db2b0a = !!v_cb35cb;
  }

  return v_3f4e2e.json({
    clone: {
      id: v_eb25ce.id,
      ownerId: v_eb25ce.owner_id,
      name: v_eb25ce.name,
      username: v_eb25ce.username,
      description: v_eb25ce.description,
      cloneType: v_eb25ce.clone_type,
      category: v_eb25ce.category,
      visibility: v_eb25ce.visibility,
      avatarUrl: v_eb25ce.avatar_url,
      coverImageUrl: v_eb25ce.cover_image_url,
      voiceType: v_eb25ce.voice_type,
      voicePresetId: v_eb25ce.voice_preset_id,
      trainingStatus: v_eb25ce.training_status,
      interests: v_774c91,
      ...(v_548b93 !== undefined ? { allowedViewers: v_548b93 } : {}),
      stats: {
        followers: v_eb25ce.followers_count,
        messages: v_eb25ce.messages_count,
        gifts: v_eb25ce.gifts_count,
        likes: v_218436?.likesCount ?? 0,
        comments: v_218436?.commentsCount ?? 0,
      },
      likedByMe: v_db2b0a,
      createdAt: v_eb25ce.created_at,
      viewerRole: v_00efe2,
      pipeline: v_eb25ce.pipeline,
    },
  });
});

const v_90be18 = v_1f4ea7
  .object({
    name: v_1f4ea7.string().min(1).max(80).optional(),
    description: v_1f4ea7.string().max(2000).optional(),
    avatar_url: v_1f4ea7.url().max(500).optional(),
    cover_image_url: v_1f4ea7.url().max(500).optional(),
    visibility: v_818579.optional(),
    voice_preset_id: v_1f4ea7.number().int().positive().nullable().optional(),
    l1_profile: v_3ea364.optional(),
    interests: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),

    allowed_viewers: v_1f4ea7.array(v_1f4ea7.number().int().positive()).max(200).optional(),
  })
  .strict()
  .refine((v_b6c474) => Object.keys(v_b6c474).length > 0, {
    message: "At least one field required.",
  });

v_f891e6.patch("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_90be18);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "소유자만 변경할 수 있어요.");

  if (v_4d33b2.l1_profile !== undefined) {
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT primary_editor_user_id FROM clones WHERE id = ? AND ${v_74c502()}`)
      .bind(v_6e0fd3)
      .first<{ primary_editor_user_id: number | null }>();
    if (v_3ac7e7?.primary_editor_user_id !== v_43e90c) {
      throw new v_3ebe58("FORBIDDEN", "주 편집자만 페르소나 정보를 수정할 수 있어요.");
    }
  }

  const v_75ae3e = [];
  const v_925171 = [];
  const v_f73a2d = [];
  if (v_4d33b2.name !== undefined) {
    v_75ae3e.push(`name = ?`);
    v_925171.push(v_4d33b2.name);
    v_f73a2d.push("name");
  }
  if (v_4d33b2.description !== undefined) {
    v_75ae3e.push(`description = ?`);
    v_925171.push(v_4d33b2.description);
    v_f73a2d.push("description");
  }
  if (v_4d33b2.avatar_url !== undefined) {
    v_75ae3e.push(`avatar_url = ?`);
    v_925171.push(v_4d33b2.avatar_url);
    v_f73a2d.push("avatar_url");
  }
  if (v_4d33b2.cover_image_url !== undefined) {
    v_75ae3e.push(`cover_image_url = ?`);
    v_925171.push(v_4d33b2.cover_image_url);
    v_f73a2d.push("cover_image_url");
  }
  if (v_4d33b2.visibility !== undefined) {
    v_75ae3e.push(`visibility = ?`);
    v_925171.push(v_4d33b2.visibility);
    v_f73a2d.push("visibility");
  }
  if (v_4d33b2.voice_preset_id !== undefined) {

    if (v_4d33b2.voice_preset_id !== null) {
      const v_f653fc = await v_a1651b
        .prepare(`SELECT id FROM voice_presets WHERE id = ? AND is_active = 1`)
        .bind(v_4d33b2.voice_preset_id)
        .first<{ id: number }>();
      if (!v_f653fc) throw new v_3ebe58("VALIDATION_FAILED", "Invalid or inactive voice_preset_id.");
    }
    v_75ae3e.push(`voice_preset_id = ?`, `voice_type = ?`);
    v_925171.push(v_4d33b2.voice_preset_id);
    v_925171.push(v_4d33b2.voice_preset_id === null ? "text_only" : "preset");
    v_f73a2d.push("voice_preset_id");
  }
  if (v_4d33b2.l1_profile !== undefined) {

    const v_b41be3 = { ...(v_4d33b2.l1_profile as Record<string, unknown>) };
    if (v_b41be3.knowledge === undefined) {
      const v_c3bc75 = await v_a1651b
        .prepare(`SELECT l1_profile FROM clones WHERE id = ? AND ${v_74c502()}`)
        .bind(v_6e0fd3)
        .first<{ l1_profile: string | null }>();
      if (v_c3bc75?.l1_profile) {
        try {
          const v_ba2215 = JSON.parse(v_c3bc75.l1_profile);
          if (v_ba2215 && typeof v_ba2215 === "object" && v_ba2215.knowledge !== undefined) {
            v_b41be3.knowledge = v_ba2215.knowledge;
          }
        } catch {

        }
      }
    }
    v_75ae3e.push(`l1_profile = ?`);
    v_925171.push(JSON.stringify(v_b41be3));
    v_f73a2d.push("l1_profile");
  }
  v_75ae3e.push(`updated_at = CURRENT_TIMESTAMP`);
  v_925171.push(v_6e0fd3);

  const v_be9ad5 = [
    v_a1651b
      .prepare(
        `UPDATE clones SET ${v_75ae3e.join(", ")} WHERE id = ? AND ${v_74c502()}`,
      )
      .bind(...v_925171),
  ];

  if (v_4d33b2.l1_profile !== undefined) {
    v_be9ad5.push(
      v_a1651b
        .prepare("DELETE FROM persona_attributes WHERE clone_id = ? AND level = 'l1'")
        .bind(v_6e0fd3),
    );
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_4d33b2.l1_profile.attrs)) {
      v_be9ad5.push(
        v_a1651b
          .prepare(
            "INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?, 'l1', ?, ?)",
          )
          .bind(v_6e0fd3, v_0eb677, v_81e2ef),
      );
    }
  }

  if (v_4d33b2.interests !== undefined) {
    v_be9ad5.push(
      v_a1651b.prepare(`DELETE FROM clone_interests WHERE clone_id = ?`).bind(v_6e0fd3),
    );

    const v_110a8b = new Set<string>();
    for (const v_479f05 of v_4d33b2.interests) {
      const v_81e2ef = v_479f05.trim();
      if (!v_81e2ef || v_110a8b.has(v_81e2ef)) continue;
      v_110a8b.add(v_81e2ef);
      v_be9ad5.push(
        v_a1651b
          .prepare(`INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`)
          .bind(v_6e0fd3, v_81e2ef),
      );
    }
    v_f73a2d.push("interests");
  }

  if (v_4d33b2.allowed_viewers !== undefined) {
    v_be9ad5.push(
      v_a1651b.prepare(`DELETE FROM clone_allowed_viewers WHERE clone_id = ?`).bind(v_6e0fd3),
    );
    const v_72b85d = new Set<number>();
    for (const v_0c8987 of v_4d33b2.allowed_viewers) {
      if (v_0c8987 === v_43e90c) continue; 
      if (v_72b85d.has(v_0c8987)) continue;
      v_72b85d.add(v_0c8987);
      v_be9ad5.push(
        v_a1651b
          .prepare(
            `INSERT INTO clone_allowed_viewers (clone_id, user_id) VALUES (?, ?)`,
          )
          .bind(v_6e0fd3, v_0c8987),
      );
    }
    v_f73a2d.push("allowed_viewers");
  }

  await v_a1651b.batch(v_be9ad5);

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "clone.update",
    details: { cloneId: v_6e0fd3, updatedFields: v_f73a2d },
  });
  return v_3f4e2e.json({ ok: true, updatedFields: v_f73a2d });
});

const v_02c038 = v_1f4ea7
  .object({
    memory_summary: v_1f4ea7.string().max(2000).optional(),
    relationship: v_1f4ea7.string().max(2000).optional(),
    context: v_1f4ea7.string().max(2000).optional(),
    recent_topics: v_1f4ea7.string().max(2000).optional(),

    relation_category: v_1f4ea7.string().max(40).optional(),
    relation_subtype: v_1f4ea7.string().max(100).optional(),
    relation_episode: v_1f4ea7.string().max(2000).optional(),
    address_form: v_1f4ea7.string().max(100).optional(),
    speech_form: v_1f4ea7.string().max(40).optional(),
    job_category: v_1f4ea7.string().max(100).optional(),
    job_detail: v_1f4ea7.string().max(500).optional(),
  })
  .strict()
  .refine((v_b6c474) => Object.keys(v_b6c474).length > 0, {
    message: "At least one field required.",
  });

const v_03f1e5 = [
  "memory_summary",
  "relationship",
  "context",
  "recent_topics",
  "relation_category",
  "relation_subtype",
  "relation_episode",
  "address_form",
  "speech_form",
  "job_category",
  "job_detail",
] as const;

v_f891e6.patch("/:id/l2", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_02c038);
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);
  if (!v_00efe2 && v_eb25ce.visibility !== "public") {
    throw new v_3ebe58("FORBIDDEN", "이 클론에 접근할 수 없어요.");
  }

  if (v_a697ec(v_eb25ce, v_00efe2)) {
    throw new v_3ebe58("FORBIDDEN", "이 클론은 현재 일시 중지 상태예요.");
  }

  const v_479f05 = await v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c);
  let v_9390e8 = {};
  if (v_479f05) { try { v_9390e8 = JSON.parse(v_479f05); } catch { v_9390e8 = {}; } }
  for (const v_0eb677 of v_03f1e5) {
    if (v_4d33b2[v_0eb677] !== undefined) v_9390e8[v_0eb677] = v_4d33b2[v_0eb677];
  }
  try {
    await v_5729a9(v_3f4e2e.env, v_6e0fd3, v_43e90c, JSON.stringify(v_9390e8));
  } catch (v_9e86fd) {
    throw new v_3ebe58("INTERNAL_ERROR", "L2 저장에 실패했어요.");
  }

  const v_76a373 = {};
  for (const v_0eb677 of v_03f1e5) {
    if (v_9390e8[v_0eb677] !== undefined) v_76a373[v_0eb677] = v_9390e8[v_0eb677];
  }
  return v_3f4e2e.json({ l2_profile: v_76a373 });
});

v_f891e6.get("/:id/l2", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);
  if (!v_00efe2 && v_eb25ce.visibility !== "public") {
    throw new v_3ebe58("FORBIDDEN", "이 클론에 접근할 수 없어요.");
  }

  const v_479f05 = await v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c);
  let v_9390e8 = {};
  if (v_479f05) { try { v_9390e8 = JSON.parse(v_479f05); } catch { v_9390e8 = {}; } }
  const v_76a373 = {};
  for (const v_0eb677 of v_03f1e5) {
    if (v_9390e8[v_0eb677] !== undefined) v_76a373[v_0eb677] = v_9390e8[v_0eb677];
  }
  return v_3f4e2e.json({ l2_profile: v_76a373 });
});

v_f891e6.post("/:id/follow", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  if (v_eb25ce.visibility === "private") {
    const v_22da99 =
      v_eb25ce.owner_id === v_43e90c
        ? "owner"
        : await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c);
    if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "비공개 페르소나는 팔로우할 수 없어요.");
  }

  if (v_eb25ce.admin_suspended_at && v_eb25ce.owner_id !== v_43e90c) {
    const v_32b0ce = await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c);
    if (v_32b0ce !== "owner") {
      throw new v_3ebe58("FORBIDDEN", "이 페르소나는 현재 일시 중지 상태예요.");
    }
  }

  const v_43c42e = await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .run();

  if ((v_43c42e.meta?.changes ?? 0) > 0) {
    await v_80a022(v_3f4e2e.env, "clone_follow", { actorId: v_43e90c, cloneId: v_6e0fd3 });
  }
  return v_3f4e2e.json({ ok: true });
});

v_f891e6.delete("/:id/follow", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_f891e6.get("/:id/followers", async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT cf.id        AS followId,
                cf.user_id   AS userId,
                cf.created_at AS createdAt,
                u.name       AS userName,
                u.email      AS userEmail,
                u.avatar_url AS userAvatarUrl
           FROM clone_follows cf
           JOIN users u ON u.id = cf.user_id
          WHERE cf.clone_id = ? AND u.deleted_at IS NULL
          ORDER BY cf.id DESC
          LIMIT ?`,
      )
      .bind(v_6e0fd3, v_02be30)
      .all<{
        followId: number;
        userId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;
  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      followId: v_cb35cb.followId,
      userId: v_cb35cb.userId,
      name: v_cb35cb.userName,
      email: v_cb35cb.userEmail,
      avatarUrl: v_cb35cb.userAvatarUrl,
      createdAt: v_cb35cb.createdAt,
    })),
  });
});

v_f891e6.get("/:id/like-status", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT 1 AS hit FROM feed_likes fl
         JOIN feeds f ON f.id = fl.feed_id
        WHERE fl.user_id = ? AND f.clone_id = ?
        LIMIT 1`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .first<{ hit: number }>();
  return v_3f4e2e.json({ liked: v_3ac7e7 != null });
});

const v_df219a = v_1f4ea7.object({
  giftId: v_1f4ea7.string().min(1).max(80),
  giftName: v_1f4ea7.string().min(1).max(120),
  amount: v_1f4ea7.number().positive().max(10_000_000), 
  pin: v_1f4ea7.string().regex(/^\d{6}$/, "6-digit PIN required"),
});

v_f891e6.post("/:id/gift", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_f7e120 = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_df219a);

  const v_72b02d = v_3f4e2e.env.COMPANY_GIFT_WALLET;
  if (!v_72b02d) {
    throw new v_3ebe58(
      "INTERNAL_ERROR",
      "Server missing COMPANY_GIFT_WALLET configuration.",
    );
  }
  const v_a832b3 = Number(v_3f4e2e.env.PAYMENT_CURRENCY ?? "18") || 18;

  const v_eddf67 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, xrun_member_id, email FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_f7e120)
    .first<{ id: number; xrun_member_id: number | null; email: string | null }>();
  if (!v_eddf67) throw new v_3ebe58("UNAUTHENTICATED", "사용자를 찾을 수 없어요.");
  if (!v_eddf67.xrun_member_id) {
    throw new v_3ebe58("CONFLICT", "내 계정에 xrun 이 연동되어 있지 않아요.");
  }

  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare(`SELECT id, owner_id, admin_suspended_at FROM clones WHERE id = ? AND ${v_74c502()}`)
    .bind(v_6e0fd3)
    .first<{ id: number; owner_id: number; admin_suspended_at: string | null }>();
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  if (v_eb25ce.owner_id === v_f7e120) {
    throw new v_3ebe58("VALIDATION_FAILED", "자기 자신의 페르소나에는 선물할 수 없어요.");
  }

  if (v_eb25ce.admin_suspended_at) {
    const v_32b0ce = await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_f7e120);
    if (v_32b0ce !== "owner") {
      throw new v_3ebe58("FORBIDDEN", "일시 중지된 페르소나에는 선물할 수 없어요.");
    }
  }

  const v_257b90 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, xrun_wallet, xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_eb25ce.owner_id)
    .first<{ id: number; xrun_wallet: string | null; xrun_member_id: number | null }>();

  const v_ed9f44 = !!v_257b90?.xrun_member_id;

  const v_c83285 = v_d548ed(v_eddf67.email) ? v_8e9814 : v_4d33b2.amount;
  const v_22c1da = v_ed9f44
    ? Math.round(v_c83285 * 0.6 * 1_000_000) / 1_000_000
    : v_c83285;
  const v_1d6a30 = v_ed9f44
    ? Math.round(v_c83285 * 0.4 * 1_000_000) / 1_000_000
    : 0;

  const v_f5353f = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO gift_logs
         (sender_user_id, clone_id, owner_user_id, gift_id, gift_name,
          total_amount, company_amount, owner_amount,
          company_address, owner_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      v_f7e120,
      v_6e0fd3,
      v_eb25ce.owner_id,
      v_4d33b2.giftId,
      v_4d33b2.giftName,
      v_c83285,
      v_22c1da,
      v_1d6a30,
      v_72b02d,

      v_257b90?.xrun_wallet ?? null,
    )
    .run();
  const v_7a7843 = Number(v_f5353f.meta.last_row_id);

  const v_69d950 = v_ed9f44
    ? [
        { toAddress: v_72b02d, amount: String(v_22c1da) },
        { toMember: v_257b90!.xrun_member_id!, amount: String(v_1d6a30) },
      ]
    : [{ toAddress: v_72b02d, amount: String(v_22c1da) }];
  const v_38fb16 = await v_7a6fc0(v_3f4e2e.env, {
    fromMember: v_eddf67.xrun_member_id,
    recipients: v_69d950,
    currency: v_a832b3,
    pin: v_4d33b2.pin,
    source: "afterlife.gift",
  });

  const v_9d0f12 =
    !v_38fb16.ok && v_d548ed(v_eddf67.email) && (v_38fb16.code === 401 || v_38fb16.code === 403);
  if (v_9d0f12) {
    console.log(`[gift][TEST_BYPASS] PIN 오류 무시, 송금 없이 정산 로직 진행 — member=${v_eddf67.xrun_member_id} reason=${v_38fb16.reason}`);
  } else if (!v_38fb16.ok) {

    await v_3f4e2e.env.DB
      .prepare(
        `UPDATE gift_logs SET status = 'failed', failure_reason = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .bind(v_38fb16.reason ?? "unknown", v_7a7843)
      .run();

    if (v_38fb16.code === 401 || v_38fb16.code === 403) {
      const v_13cd33 = /paymentPin not set/i.test(v_38fb16.reason ?? "");
      throw new v_3ebe58(
        v_13cd33 ? "PAYMENT_PIN_REQUIRED" : "PAYMENT_PIN_INVALID",
        v_13cd33 ? "결제 비밀번호가 설정되어 있지 않아요." : "결제 비밀번호가 일치하지 않아요.",
        { reason: v_38fb16.reason },
      );
    }
    if (v_38fb16.code === 402) {
      throw new v_3ebe58("INSUFFICIENT_FUNDS", "Insufficient XRUN balance.", {
        reason: v_38fb16.reason,
      });
    }
    if (v_38fb16.code === 501 || v_38fb16.code === 404) {
      throw new v_3ebe58(
        "UPSTREAM_NOT_IMPLEMENTED",
        "xrun transfer endpoint not yet available.",
        { reason: v_38fb16.reason },
      );
    }
    throw new v_3ebe58("UPSTREAM_FAILURE", v_38fb16.reason ?? "xrun transfer error");
  }

  const v_e58fdc = v_72b02d.toLowerCase();
  const v_2cc4d6 = v_38fb16.txs.find((v_8d41d7) => v_8d41d7.toAddress.toLowerCase() === v_e58fdc);
  const v_ed8237 = v_38fb16.txs.find((v_8d41d7) => v_8d41d7.toAddress.toLowerCase() !== v_e58fdc);
  console.log(
    `[gift] xrun txs:`,
    v_38fb16.txs.map((v_8d41d7) => `${v_8d41d7.toAddress}=${(v_8d41d7.txHash ?? "").slice(0, 12)}`).join(" | "),
    `companyMatch=${!!v_2cc4d6} ownerMatch=${!!v_ed8237} newBalance=${v_38fb16.newBalance}`,
  );
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE gift_logs
          SET status = 'sent',
              tx_company = ?,
              tx_owner = ?,
              owner_address = COALESCE(?, owner_address),
              completed_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(
      v_2cc4d6?.txHash ?? null,
      v_ed8237?.txHash ?? null,
      v_ed8237?.toAddress ?? null, 
      v_7a7843,
    )
    .run();

  await v_74defc(v_3f4e2e, {
    userId: v_f7e120,
    action: "clone.gift.sent",
    details: {
      cloneId: v_6e0fd3,
      ownerId: v_eb25ce.owner_id,
      giftId: v_4d33b2.giftId,
      amount: v_c83285,
    },
  });

  await v_80a022(v_3f4e2e.env, "clone_gift", {
    actorId: v_f7e120,
    cloneId: v_6e0fd3,
    extraBody: `${v_4d33b2.giftName} 선물 (+${v_1d6a30} XRUN)`,
  });

  try {
    const { recordAfterlifeGiftCommission: v_b48b59 } = await import("../lib/giftCommission");
    const v_cb35cb = await v_b48b59(v_3f4e2e.env, {
      cloneId: v_6e0fd3,
      ownerXrunMember: v_257b90?.xrun_member_id ?? null,
      totalXrun: v_c83285,
      giftName: v_4d33b2.giftName,
    });
    if (!v_cb35cb.recorded) {
      console.log(`[gift] commission skip: ${v_cb35cb.reason}`);
    } else {
      console.log(`[gift] commission recorded — recommender=${v_cb35cb.recommender} amount=${v_cb35cb.amount}`);
    }
  } catch (v_49263d) {
    console.warn("[gift] commission record failed:", (v_49263d as Error).message);
  }

  return v_3f4e2e.json({
    ok: true,
    gift: {
      id: v_7a7843,
      giftId: v_4d33b2.giftId,
      giftName: v_4d33b2.giftName,
      total: v_c83285,
      companyAmount: v_22c1da,
      ownerAmount: v_1d6a30,
      txCompany: v_2cc4d6?.txHash ?? null,
      txOwner: v_ed8237?.txHash ?? null,
      newBalance: v_38fb16.newBalance,
    },
  });
});

v_f891e6.post("/:id/block", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_2e83b0 = await v_3f4e2e.env.DB
    .prepare(`SELECT owner_id AS ownerId FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ ownerId: number }>();
  if (v_2e83b0?.ownerId === v_43e90c) {
    throw new v_3ebe58("VALIDATION_FAILED", "본인의 페르소나는 차단할 수 없어요.");
  }

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_blocks (user_id, clone_id) VALUES (?, ?)`,
    ).bind(v_43e90c, v_6e0fd3),
    v_3f4e2e.env.DB.prepare(
      `DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`,
    ).bind(v_43e90c, v_6e0fd3),
  ]);
  return v_3f4e2e.json({ ok: true, blocked: true });
});

v_f891e6.delete("/:id/block", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM clone_blocks WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true, blocked: false });
});

const v_4a3250 = v_1f4ea7.object({
  reason: v_1f4ea7.string().max(500).optional(),
});
v_f891e6.post("/:id/report", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_4a3250).catch(() => ({ reason: undefined }));

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_reports (user_id, clone_id, reason)
         VALUES (?, ?, ?)`,
    ).bind(v_43e90c, v_6e0fd3, v_4d33b2.reason ?? null),
    v_3f4e2e.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_blocks (user_id, clone_id) VALUES (?, ?)`,
    ).bind(v_43e90c, v_6e0fd3),
    v_3f4e2e.env.DB.prepare(
      `DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`,
    ).bind(v_43e90c, v_6e0fd3),
  ]);
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "clone.report",
    details: { cloneId: v_6e0fd3, reason: v_4d33b2.reason ?? null },
  });
  return v_3f4e2e.json({ ok: true, reported: true, blocked: true });
});

const v_1e23ae = v_1f4ea7.object({
  durationSeconds: v_1f4ea7.number().int().min(0).max(86400).optional(),
});
v_f891e6.post("/:id/call-event", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_1e23ae).catch(() => ({ durationSeconds: undefined }));
  await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_6e0fd3, "call");

  const v_a712cf = v_4d33b2.durationSeconds ?? 0;
  const v_b72a1c = await v_70d294(v_3f4e2e.env, v_43e90c, v_6e0fd3, v_a712cf);
  const v_27e8db = v_b72a1c.scoreApplied;
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "clone.call_event",
    details: { cloneId: v_6e0fd3, durationSeconds: v_a712cf, scoreApplied: v_27e8db },
  });
  return v_3f4e2e.json({ ok: true, scoreApplied: v_27e8db });
});

v_f891e6.post("/:id/learn-event", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_6e0fd3, "learn");

  const v_4d76f9 = `intimacy_cd:learn:${v_43e90c}:${v_6e0fd3}`;
  const v_2ba83d = !!(await v_3f4e2e.env.KV_RATE.get(v_4d76f9));
  let v_27e8db = 0;
  if (!v_2ba83d) {
    const v_cb35cb = await v_721d54(v_3f4e2e.env, v_43e90c, v_6e0fd3, v_cf0463.learn, "learn");
    v_27e8db = v_cb35cb.applied;
    if (v_27e8db > 0) {
      await v_3f4e2e.env.KV_RATE.put(v_4d76f9, "1", { expirationTtl: 20 * 60 });
    }
  }
  return v_3f4e2e.json({ ok: true, bumped: true, scoreApplied: v_27e8db });
});

v_f891e6.post("/:id/chat-event", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_6e0fd3, "chat");
  const v_cb35cb = await v_721d54(v_3f4e2e.env, v_43e90c, v_6e0fd3, v_cf0463.chat, "chat");
  return v_3f4e2e.json({ ok: true, scoreApplied: v_cb35cb.applied });
});

v_f891e6.get("/:id/gifts/summary", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  const v_18b8bf = await v_a1651b
    .prepare(
      `SELECT g.gift_id, g.gift_name,
              COUNT(*) AS cnt, MAX(g.created_at) AS last_at,
              u.name AS sender_name
       FROM gift_logs g
       LEFT JOIN users u ON u.id = g.sender_user_id
       WHERE g.clone_id = ? AND g.status = 'sent'
       GROUP BY g.gift_id, g.gift_name, g.sender_user_id
       ORDER BY cnt DESC, last_at DESC
       LIMIT 200`,
    )
    .bind(v_6e0fd3)
    .all<{
      gift_id: string;
      gift_name: string;
      cnt: number;
      last_at: string; 
      sender_name: string | null;
    }>();

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => ({
    giftId: v_cb35cb.gift_id,
    giftName: v_cb35cb.gift_name,
    count: v_cb35cb.cnt,
    sender: v_5acfc3(v_cb35cb.sender_name), 
  }));

  return v_3f4e2e.json({ items: v_4622b9 });
});

v_f891e6.post("/:cloneId/self-confirm", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("cloneId"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");

  const v_4d33b2 = await v_3f4e2e.req
    .json<{ vectors?: number[][]; displayName?: string }>()
    .catch(() => ({}) as { vectors?: number[][]; displayName?: string });
  const v_f94e64 = v_4d33b2.vectors;
  if (
    !Array.isArray(v_f94e64) ||
    v_f94e64.length !== 3 ||
    v_f94e64.some(
      (v_81e2ef) => !Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || v_81e2ef.some((v_62c214) => typeof v_62c214 !== "number" || !Number.isFinite(v_62c214)),
    )
  )
    throw new v_3ebe58("VALIDATION_FAILED", "vectors: 정확히 3개의 512차원 수치 배열이어야 합니다");

  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    `SELECT id, clone_type, self_person_id FROM clones WHERE id = ? AND owner_id = ? AND ${v_74c502()}`,
  )
    .bind(v_6e0fd3, v_43e90c)
    .first<{ id: number; clone_type: string; self_person_id: number | null }>();
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "클론을 찾을 수 없습니다.");
  if (v_eb25ce.clone_type === "expert")
    throw new v_3ebe58("VALIDATION_FAILED", "전문가 클론은 self 개념이 없습니다.");
  if (v_eb25ce.self_person_id !== null) throw new v_3ebe58("CONFLICT", "이미 self가 확정된 클론입니다.");

  const v_8a1355 = v_4d33b2.displayName !== undefined ? v_d0fd96(v_4d33b2.displayName) : null;
  const v_43c42e = await v_4c5429(v_3f4e2e.env, { userId: v_43e90c, cloneId: v_6e0fd3, vectors: v_f94e64, displayName: v_8a1355 });
  return v_3f4e2e.json(v_43c42e);
});

v_f891e6.get("/:cloneId/face-policy", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("cloneId"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");

  const v_eb25ce = await v_3f4e2e.env.DB.prepare(`SELECT clone_type FROM clones WHERE id = ? AND ${v_74c502()}`)
    .bind(v_6e0fd3)
    .first<{ clone_type: string }>();
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "클론을 찾을 수 없습니다.");

  return v_3f4e2e.json({ faceIdentifyEnabled: v_eb25ce.clone_type !== "expert" });
});
