import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { logActivity } from "../lib/logger";
import { similarityScore, SEARCH_SIMILARITY_THRESHOLD } from "../lib/similarity";
import {
  hasAcceptedShare,
  isFollower,
  loadCloneById,
  resolveOptionalUser,
  resolveResponseViewerRole,
} from "../lib/cloneAccess";
import { writeCtx, writeShared, readOnt, writeOnt } from "../lib/memoryStore";
import {
  bumpInteraction,
  bumpInteractionThrottled,
  addIntimacyScore,
  INTIMACY_WEIGHTS,
  CALL_MIN_SECONDS_FOR_SCORE,
} from "../lib/interactions";
import { externalTransferSplit } from "../lib/xrun";
import { notify, notifyCloneEvent } from "../lib/notify";
import { loadPersonaQuestions } from "../lib/personaQuestions";
import { createJob, getJob, setStatus, linkClone } from "../lib/assetJobs";
import { maskUsername } from "../lib/utils";
import { triggerPrebuild } from "../lib/prebuildClient";
import { buildCallBundle } from "../lib/callBundle";

export const clones = new Hono<AppEnv>();

clones.get("/health", (c) => c.json({ ok: true, module: "clones" }));

clones.get("/check-username", async (c) => {
  const url = new URL(c.req.url);
  const u = (url.searchParams.get("u") ?? "").trim().toLowerCase();
  if (!u) {
    return c.json({ available: false, reason: "invalid" });
  }
  if (!/^[a-z0-9_]{3,30}$/.test(u)) {
    return c.json({ available: false, reason: "invalid" });
  }

  const reserved = new Set([
    "admin", "administrator", "root", "staff", "system", "support",
    "help", "official", "afterlife", "api", "null", "undefined",
    "anonymous", "mod", "moderator", "owner",
  ]);
  if (reserved.has(u)) {
    return c.json({ available: false, reason: "reserved" });
  }
  const row = await c.env.DB
    .prepare(`SELECT 1 AS x FROM clones WHERE username = ? LIMIT 1`)
    .bind(u)
    .first<{ x: number }>();
  return c.json({ available: !row });
});

const cloneType = z.enum(["memlow", "friend", "mentor", "celeb"]);

const visibility = z.enum(["public", "private", "followers", "selected"]);

const USERNAME_BLACKLIST = new Set([
  "admin", "administrator", "root", "staff", "system", "support",
  "help", "official", "afterlife", "api", "null", "undefined",
  "anonymous", "mod", "moderator", "owner",
]);
const MAX_MEMLOW_PROFILE_BYTES = 32 * 1024; 

const l1ProfileSchema = z.object({
  attrs: z.record(z.string(), z.string()),
  notes: z.string().max(4000).default(''),
  personality_core: z.string().max(500).optional(),
  tone: z.string().max(500).optional(),
});

const personaWizardSchema = z.object({
  age: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  mbti: z.string().max(10).optional(),
  personaTypes: z.array(z.string().max(20)).max(8).optional(),
}).optional();

function buildL1FromWizard(
  base: { attrs?: Record<string, string>; notes?: string; personality_core?: string; tone?: string } | undefined,
  persona: { age?: string; gender?: string; mbti?: string; personaTypes?: string[] } | undefined,
): Record<string, unknown> | null {
  const hasBase = !!base;
  const hasPersona = !!persona && Object.values(persona).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
  );
  if (!hasBase && !hasPersona) return null;

  const attrs: Record<string, string> = { ...(base?.attrs ?? {}) };
  if (persona?.age) attrs.age = persona.age;
  if (persona?.gender) attrs.gender = persona.gender;
  if (persona?.mbti) attrs.mbti = persona.mbti;

  const l1: Record<string, unknown> = { attrs, notes: base?.notes ?? "" };

  if (base?.personality_core) l1.personality_core = base.personality_core;
  else {
    const traits = persona?.personaTypes ?? [];
    if (traits.length) l1.personality_core = `${traits.join(", ")} 성향`;
  }
  if (base?.tone) l1.tone = base.tone;
  return l1;
}

const createSchema = z.object({

  clone_type: cloneType.default("friend"),
  name: z.string().min(1).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "username must be lowercase alphanumeric + underscore"),
  description: z.string().max(2000).optional(),
  category: z.string().max(40).optional(),
  visibility: visibility.default("private"),
  avatar_url: z.url().max(500).optional(),
  cover_image_url: z.url().max(500).optional(),
  voice_preset_id: z.number().int().positive().optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),

  memlow_profile: z.record(z.string(), z.unknown()).optional(),

  l1_profile: l1ProfileSchema.optional(),

  persona: personaWizardSchema,

  pin: z.string().regex(/^\d{6}$/).optional(),

  personaAnswers: z.record(
    z.string().regex(/^[a-zA-Z0-9_]{1,50}$/),
    z.string().max(500),
  ).optional(),

  relation: z.string().max(40).optional(),

  idle_video_job_id: z.string().uuid().optional(),
  voice_clone_job_id: z.string().uuid().optional(),
});

const PERSONA_PAID_PRICE_XRUN = 100;

const TEST_PRICE_EMAILS = new Set(["oth-user@example.invalid", "oth-test@example.invalid"]);
const isTestPriceEmail = (e?: string | null): boolean => !!e && TEST_PRICE_EMAILS.has(e);
const TEST_PRICE_XRUN = 0.05;

clones.post(
  "/",
  requireAuth,
  requireIdempotencyKey("clones.create"),
  async (c) => {
    const body = await parseJson(c, createSchema);
    const userId = c.get("userId")!;
    const db = c.env.DB;

    const susp = await db
      .prepare(
        `SELECT suspended_until FROM users
          WHERE id = ? AND suspended_until IS NOT NULL
            AND suspended_until > datetime('now')`,
      )
      .bind(userId)
      .first<{ suspended_until: string }>();
    if (susp) {
      throw new APIError(
        "FORBIDDEN",
        "신고 누적으로 계정이 일시 비활성화되어 페르소나를 생성할 수 없어요.",
        { suspendedUntil: susp.suspended_until },
      );
    }

    if (USERNAME_BLACKLIST.has(body.username)) {
      throw new APIError("VALIDATION_FAILED", "username is reserved.");
    }
    if (body.memlow_profile) {
      const size = new TextEncoder().encode(JSON.stringify(body.memlow_profile)).length;
      if (size > MAX_MEMLOW_PROFILE_BYTES) {
        throw new APIError(
          "VALIDATION_FAILED",
          `memlow_profile too large (${size}B > ${MAX_MEMLOW_PROFILE_BYTES}B).`,
        );
      }
    }

    const existing = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM clones
          WHERE owner_id = ?
            AND deletion_state = 'active'
            AND deleted_at IS NULL`,
      )
      .bind(userId)
      .first<{ n: number }>();
    const usedCount = existing?.n ?? 0;

    const me = await db
      .prepare(`SELECT email FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ email: string | null }>();
    const personaPrice = isTestPriceEmail(me?.email) ? TEST_PRICE_XRUN : PERSONA_PAID_PRICE_XRUN;

    if (usedCount >= 100) {
      throw new APIError(
        "QUOTA_EXCEEDED",
        "최대 페르소나 개수(100개)에 도달했어요.",
      );
    }
    if (usedCount >= 1) {

      if (!body.pin) {
        throw new APIError("PAYMENT_REQUIRED", "Persona creation requires payment.", {
          priceXrun: personaPrice,
          message: `2번째 페르소나부터 ${personaPrice} XRUN 이 부과됩니다.`,
        });
      }

      const bypassPin = (c.env as unknown as { DEV_PAYMENT_BYPASS_PIN?: string }).DEV_PAYMENT_BYPASS_PIN;
      if (!bypassPin || body.pin !== bypassPin) {

        const companyAddr = c.env.COMPANY_CHARGE_WALLET;
        if (!companyAddr) {
          throw new APIError("INTERNAL_ERROR", "Server missing COMPANY_CHARGE_WALLET configuration.");
        }
        const senderRow = await db
          .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
          .bind(userId)
          .first<{ xrun_member_id: number | null }>();
        if (!senderRow?.xrun_member_id) {
          throw new APIError("CONFLICT", "xrun 계정이 연동되어 있지 않아요.");
        }
        const currency = Number(c.env.PAYMENT_CURRENCY ?? "18") || 18;
        const { externalTransferSplit } = await import("../lib/xrun");
        const payRes = await externalTransferSplit(c.env, {
          fromMember: senderRow.xrun_member_id,
          recipients: [{ toAddress: companyAddr, amount: String(personaPrice) }],
          currency,
          pin: body.pin,
          source: "afterlife.persona-create",
        });

        const testBypassed =
          isTestPriceEmail(me?.email) && !payRes.ok && (payRes.code === 401 || payRes.code === 403);
        if (testBypassed) {
          console.log(`[persona-create][TEST_BYPASS] PIN 오류 무시하고 생성 진행 — reason=${payRes.reason}`);
        } else if (!payRes.ok) {

          if (payRes.code === 401 || payRes.code === 403) {
            const pinNotSet = /paymentPin not set/i.test(payRes.reason ?? "");
            throw new APIError(
              pinNotSet ? "PAYMENT_PIN_REQUIRED" : "PAYMENT_PIN_INVALID",
              pinNotSet ? "결제 비밀번호가 설정되어 있지 않아요." : "결제 비밀번호가 일치하지 않아요.",
              { reason: payRes.reason ?? null },
            );
          }
          if (payRes.code === 402) {
            throw new APIError("INSUFFICIENT_FUNDS", "XRUN 잔액이 부족해요.");
          }
          throw new APIError("UPSTREAM_FAILURE", payRes.reason ?? "xrun transfer error");
        }

        try {
          const { recordAfterlifePersonaPayment } = await import("../lib/giftCommission");
          const r = await recordAfterlifePersonaPayment(c.env, {
            userId,
            totalXrun: personaPrice,
            companyWallet: companyAddr,
          });
          if (r.recorded) {
            console.log(`[persona-create] settlement recorded — amount=${r.amount}`);
          } else {
            console.log(`[persona-create] settlement skip: ${r.reason}`);
          }
        } catch (err) {
          console.warn("[persona-create] settlement record failed:", (err as Error).message);
        }
      } else {

        console.warn("[DEV_BYPASS] persona payment skipped via bypass PIN, userId=", userId);
      }
    }

    if (body.voice_preset_id) {
      const vp = await db
        .prepare(`SELECT id FROM voice_presets WHERE id = ? AND is_active = 1`)
        .bind(body.voice_preset_id)
        .first<{ id: number }>();
      if (!vp) throw new APIError("VALIDATION_FAILED", "Invalid or inactive voice_preset_id.");
    }

    const voiceType = body.voice_preset_id ? "preset" : "text_only";

    let l1Base = body.l1_profile;
    if (body.personaAnswers && Object.keys(body.personaAnswers).length) {
      const questions = await loadPersonaQuestions(c.env.DB);
      const qByKey = new Map(questions.map((q) => [q.key, q]));
      const base = l1Base ?? { attrs: {}, notes: "" };
      const attrs: Record<string, string> = { ...(base.attrs ?? {}) };
      const core: Record<string, unknown> = { ...base, attrs };
      for (const [key, value] of Object.entries(body.personaAnswers)) {
        if (!value) continue;
        const q = qByKey.get(key);
        if (!q) continue; 

        if (q.targetField && q.targetField !== "attrs" && q.targetField !== "__proto__") {
          core[q.targetField] = value;
        } else if (!q.targetField) {
          attrs[key] = value;
        }
      }
      core.attrs = attrs;
      l1Base = core as typeof l1Base;
    }

    const l1Profile = buildL1FromWizard(l1Base, body.persona);

    let inserted:
      | {
          id: number;
          name: string;
          username: string;
          clone_type: string;
          visibility: string;
          created_at: string;
        }
      | null;
    try {

      inserted = await db
        .prepare(
          `INSERT INTO clones
             (owner_id, name, username, description, clone_type, category, visibility,
              avatar_url, cover_image_url, voice_type, voice_preset_id,
              l1_profile, primary_editor_user_id, relation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id, name, username, clone_type, visibility, created_at`,
        )
        .bind(
          userId,
          body.name,
          body.username,
          body.description ?? null,
          body.clone_type,
          body.category ?? null,
          body.visibility,
          body.avatar_url ?? null,
          body.cover_image_url ?? null,
          voiceType,
          body.voice_preset_id ?? null,
          l1Profile !== null ? JSON.stringify(l1Profile) : null,
          userId,
          body.relation ?? null,
        )
        .first();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (/UNIQUE constraint failed: clones\.username/i.test(msg)) {
        throw new APIError("CONFLICT", "중복된 아이디입니다. 다른 아이디를 사용해주세요.");
      }

      throw err;
    }
    if (!inserted) throw new APIError("INTERNAL_ERROR", "페르소나 생성에 실패했어요.");

    const cloneId = inserted.id;

    try {
      const stmts: D1PreparedStatement[] = [];
      for (const it of body.interests ?? []) {
        stmts.push(
          db
            .prepare(
              `INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`,
            )
            .bind(cloneId, it),
        );
      }

      stmts.push(
        db
          .prepare(
            `INSERT INTO clone_shares
               (clone_id, owner_id, target_user_id, role, status)
             VALUES (?, ?, ?, 'owner', 'accepted')`,
          )
          .bind(cloneId, userId, userId),
      );

      stmts.push(
        db
          .prepare(
            `INSERT INTO clone_stats (clone_id, followers_count, messages_count, gifts_count)
             VALUES (?, 0, 0, 0)
             ON CONFLICT(clone_id) DO NOTHING`,
          )
          .bind(cloneId),
      );

      const l1Attrs = l1Profile?.attrs as Record<string, string> | undefined;
      if (l1Attrs) {
        for (const [key, value] of Object.entries(l1Attrs)) {
          if (!value) continue;
          stmts.push(
            db
              .prepare(
                `INSERT INTO persona_attributes (clone_id, level, key, value)
                 VALUES (?, 'l1', ?, ?)`,
              )
              .bind(cloneId, key, value),
          );
        }
      }
      await db.batch(stmts);
    } catch (err) {

      await db.prepare(`DELETE FROM clones WHERE id = ?`).bind(cloneId).run();
      throw err;
    }

    for (const [jobId, col] of [
      [body.idle_video_job_id, "idle_video_url"],
      [body.voice_clone_job_id, "voice_se_url"],
    ] as [string | undefined, string][]) {
      if (!jobId) continue;
      const job = await getJob(c.env.DB, jobId);
      if (!job || job.user_id !== userId) continue; 
      if (job.status === "done" && job.out_url) {

        await c.env.DB.prepare(`UPDATE clones SET ${col} = ? WHERE id = ?`)
          .bind(job.out_url, cloneId)
          .run();
      } else {

        await linkClone(c.env.DB, jobId, cloneId);
        const refreshed = await getJob(c.env.DB, jobId);
        if (refreshed?.status === "done" && refreshed.out_url) {

          await c.env.DB.prepare(`UPDATE clones SET ${col} = ? WHERE id = ?`)
            .bind(refreshed.out_url, cloneId)
            .run();
        }

      }
    }

    if (body.clone_type === "memlow") {
      const ctxSeed = JSON.stringify({
        persona: body.memlow_profile ?? {},
        family: [],
        _meta: { layer: "L1", rev: 1 },
      });
      try {
        await Promise.all([
          writeCtx(c.env, cloneId, ctxSeed),
          writeShared(c.env, cloneId, "[]", 0),
        ]);
      } catch (err) {
        console.error(`[MEMORY_INIT_FAIL] clone_id=${cloneId} err=${(err as Error).message}`);
      }
    }

    await logActivity(c, {
      userId,
      action: "clone.create",
      details: { cloneId, cloneType: body.clone_type },
    });

    if (body.visibility === "public" && body.clone_type !== "memlow") {
      try {
        const actor = await db
          .prepare(`SELECT name, email FROM users WHERE id = ?`)
          .bind(userId)
          .first<{ name: string | null; email: string | null }>();
        const actorName =
          actor?.name || actor?.email?.split("@")[0] || "누군가";
        const followers = await db
          .prepare(`SELECT follower_id FROM user_follows WHERE followee_id = ?`)
          .bind(userId)
          .all<{ follower_id: number }>();

        const seen = new Set<number>();
        for (const row of followers.results ?? []) {
          if (row.follower_id === userId) continue;
          if (seen.has(row.follower_id)) continue;
          seen.add(row.follower_id);
          await notify(c.env, {
            userId: row.follower_id,
            type: "followee_new_clone",
            title: "🌟 새 페르소나",
            body: `${actorName} 님이 새 페르소나 '${body.name}' 을(를) 만들었어요`,
            url: `afterlife://clone/${cloneId}`,
            data: { cloneId, ownerId: userId },
            skipEmail: true,
          });
        }
      } catch (err) {
        console.warn("[clone.create] followee_new_clone notify failed:", err);
      }
    }

    if (c.env.PREBUILD_SECRET && c.env.PRETHIRD_PUBLIC_BASE) {
      const origin = new URL(c.req.url).origin;
      const db = c.env.DB;
      const secret = c.env.PREBUILD_SECRET;
      const base = c.env.PRETHIRD_PUBLIC_BASE;
      const cid = cloneId;
      const uid = userId;
      c.executionCtx.waitUntil(
        (async () => {
          try {
            const row = await db.prepare("SELECT * FROM clones WHERE id = ?").bind(cid).first<import("../lib/cloneAccess").CloneRow>();
            if (!row?.voice_se_url) return; 
            const bundle = await buildCallBundle(db, row, uid, origin);
            await triggerPrebuild(fetch, {
              base, secret, cloneId: String(cid), voiceRawUrl: bundle.assets.voiceRawUrl,
            });
          } catch (e) {
            console.warn("[prebuild] trigger skipped:", e);
          }
        })(),
      );
    }

    return c.json(
      {
        clone: {
          id: inserted.id,
          name: inserted.name,
          username: inserted.username,
          cloneType: inserted.clone_type,
          visibility: inserted.visibility,
          createdAt: inserted.created_at,
        },
        initial_memory: body.clone_type === "memlow"
          ? { ctx_key: `ctx:${cloneId}`, shared_key: `shared:${cloneId}` }
          : null,
      },
      201,
    );
  },
);

const searchQuery = z.object({
  q: z.string().max(80).optional(),
  type: cloneType.optional(),
  category: z.string().max(40).optional(),
  sort: z.enum(["new", "popular"]).default("new"),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function encodeCursor(sortKey: string | number, id: number): string {
  const raw = `${sortKey}|${id}`;
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeCursor(token: string): { sortKey: string; id: number } | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob(padded);
    const idx = raw.lastIndexOf("|");
    if (idx < 0) return null;
    const sortKey = raw.slice(0, idx);
    const id = Number(raw.slice(idx + 1));
    if (!Number.isInteger(id) || id <= 0) return null;
    return { sortKey, id };
  } catch {
    return null;
  }
}

clones.get("/search", async (c) => {
  const q = searchQuery.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!q.success) {
    throw new APIError("VALIDATION_FAILED", "Query invalid.", q.error.issues);
  }
  const params = q.data;
  const db = c.env.DB;

  const viewerId = await resolveOptionalUser(c);

  const where: string[] = [`c.deleted_at IS NULL`, `c.deletion_state = 'active'`];
  const binds: unknown[] = [];
  if (viewerId) {
    where.push(
      `(
         c.visibility = 'public'
         OR c.owner_id = ?
         OR (c.visibility = 'followers' AND
             EXISTS (SELECT 1 FROM clone_follows cf
                      WHERE cf.clone_id = c.id AND cf.user_id = ?))
         OR (c.visibility = 'selected' AND
             EXISTS (SELECT 1 FROM clone_allowed_viewers cav
                      WHERE cav.clone_id = c.id AND cav.user_id = ?))
       )`,
    );
    binds.push(viewerId, viewerId, viewerId);

    where.push(`c.id NOT IN (SELECT clone_id FROM clone_blocks WHERE user_id = ?)`);
    binds.push(viewerId);
    where.push(
      `c.owner_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)`,
    );
    binds.push(viewerId);
  } else {
    where.push(`c.visibility = 'public'`);
  }
  if (params.type) {
    where.push(`c.clone_type = ?`);
    binds.push(params.type);
  }
  if (params.category) {
    where.push(`c.category = ?`);
    binds.push(params.category);
  }

  const mapClone = (r: {
    id: number; name: string; username: string; clone_type: string;
    category: string | null; avatar_url: string | null; created_at: string;
    followers_count: number; messages_count: number; gifts_count: number;
  }) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    cloneType: r.clone_type,
    category: r.category,
    avatarUrl: r.avatar_url,
    stats: { followers: r.followers_count, messages: r.messages_count, gifts: r.gifts_count },
    createdAt: r.created_at,
  });

  if (params.q) {
    const poolSql = `
      SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url,
             c.created_at,
             COALESCE(s.followers_count, 0) AS followers_count,
             COALESCE(s.messages_count, 0)  AS messages_count,
             COALESCE(s.gifts_count, 0)     AS gifts_count
        FROM clones c
        LEFT JOIN clone_stats s ON s.clone_id = c.id
       WHERE ${where.join(" AND ")}
       ORDER BY COALESCE(s.followers_count, 0) DESC, c.id DESC
       LIMIT 500`;
    const pool = (
      await db.prepare(poolSql).bind(...binds).all<Parameters<typeof mapClone>[0]>()
    ).results;
    const scored = pool
      .map((r) => ({
        r,
        score: Math.max(
          similarityScore(params.q!, r.name),
          similarityScore(params.q!, r.username),
        ),
      }))
      .filter((x) => x.score >= SEARCH_SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score || b.r.followers_count - a.r.followers_count)
      .slice(0, params.limit)
      .map((x) => x.r);
    return c.json({ items: scored.map(mapClone), nextCursor: null });
  }

  let orderBy: string;
  if (params.sort === "popular") {
    orderBy = `COALESCE(s.followers_count, 0) DESC, c.id DESC`;
    const cur = params.cursor ? decodeCursor(params.cursor) : null;
    if (cur) {
      where.push(
        `(COALESCE(s.followers_count, 0) < ? OR (COALESCE(s.followers_count, 0) = ? AND c.id < ?))`,
      );
      binds.push(Number(cur.sortKey), Number(cur.sortKey), cur.id);
    }
  } else {
    orderBy = `c.created_at DESC, c.id DESC`;
    const cur = params.cursor ? decodeCursor(params.cursor) : null;
    if (cur) {
      where.push(`(c.created_at < ? OR (c.created_at = ? AND c.id < ?))`);
      binds.push(cur.sortKey, cur.sortKey, cur.id);
    }
  }

  const sql = `
    SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url,
           c.created_at,
           COALESCE(s.followers_count, 0) AS followers_count,
           COALESCE(s.messages_count, 0)  AS messages_count,
           COALESCE(s.gifts_count, 0)     AS gifts_count
      FROM clones c
      LEFT JOIN clone_stats s ON s.clone_id = c.id
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ?`;
  binds.push(params.limit + 1);

  const rows = (
    await db.prepare(sql).bind(...binds).all<{
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

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;
  let nextCursor: string | null = null;
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1]!;
    nextCursor =
      params.sort === "popular"
        ? encodeCursor(last.followers_count, last.id)
        : encodeCursor(last.created_at, last.id);
  }

  return c.json({
    items: page.map(mapClone),
    nextCursor,
  });
});

clones.get("/voices", requireAuth, async (c) => {
  const rows = await c.env.DB
    .prepare(
      `SELECT id, name, gender, age_range, description, sort_order, src_file_id
       FROM voice_presets WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
    )
    .all<{ id: number; name: string; gender: string | null; age_range: string | null; description: string | null; sort_order: number; src_file_id: number | null }>();
  const origin = new URL(c.req.url).origin;
  const voices = (rows.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    gender: r.gender,
    ageRange: r.age_range,
    description: r.description,
    sortOrder: r.sort_order,
    srcFileId: r.src_file_id,
    sampleUrl: `${origin}/oth-path${r.id}/sample`,
  }));
  return c.json({ voices });
});

clones.get("/voices/:id/sample", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid voice id.");
  const row = await c.env.DB
    .prepare(`SELECT r2_key FROM voice_presets WHERE id = ? AND is_active = 1`)
    .bind(id)
    .first<{ r2_key: string | null }>();
  if (!row?.r2_key) throw new APIError("NOT_FOUND", "Voice sample not found.");
  const obj = await c.env.R2_ARCHIVE.get(row.r2_key);
  if (!obj) throw new APIError("NOT_FOUND", "Object missing in storage.");
  return new Response(obj.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
  });
});

clones.get("/system", requireAuth, async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, username, name, avatar_url, is_system FROM clones WHERE is_system = 1 AND deleted_at IS NULL",
  ).all<{ id: number; username: string; name: string; avatar_url: string | null; is_system: number }>();
  return c.json({ items: rows.results ?? [] });
});

clones.get("/persona-questions", requireAuth, async (c) => {
  const questions = await loadPersonaQuestions(c.env.DB);
  return c.json({ questions });
});

const suggestProfileSchema = z.record(
  z.string().max(50),
  z.union([z.string().max(200), z.array(z.string().max(50)).max(20)]),
);

clones.post("/persona-suggest", requireAuth, async (c) => {

  if (!c.env.ORCHESTRATOR_URL || !c.env.ORCH_SECRET) return c.json({ suggestions: {} });
  const raw = await c.req.json().catch(() => ({}));
  const parsed = suggestProfileSchema.safeParse(raw);
  const profile = parsed.success ? parsed.data : {};

  if (Object.keys(profile).length > 20) return c.json({ suggestions: {} });

  const hasContent = Object.values(profile).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== "",
  );
  if (!hasContent) return c.json({ suggestions: {} });
  const questions = await loadPersonaQuestions(c.env.DB);
  const gemmaQuestions = questions
    .filter((q) => q.type === "gemma_choice")
    .map((q) => ({ key: q.key, label: q.label, options_include: q.options_include }));
  if (gemmaQuestions.length === 0) return c.json({ suggestions: {} });
  try {

    const r = await fetch(`${c.env.ORCHESTRATOR_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.ORCH_SECRET}` },
      body: JSON.stringify({ profile, questions: gemmaQuestions }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return c.json({ suggestions: {} });
    const data = await r.json<{ suggestions?: Record<string, string[]> }>();
    return c.json({ suggestions: data.suggestions ?? {} });
  } catch {

    return c.json({ suggestions: {} });
  }
});

clones.post("/intro-suggest", requireAuth, async (c) => {

  if (!c.env.ORCHESTRATOR_URL || !c.env.ORCH_SECRET) return c.json({ intro: "" });
  const raw = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));

  const profile = {
    name: typeof raw.name === "string" ? raw.name.slice(0, 80) : undefined,
    relation: typeof raw.relation === "string" ? raw.relation.slice(0, 40) : undefined,
    personaAnswers:
      raw.personaAnswers && typeof raw.personaAnswers === "object"
        ? Object.fromEntries(
            Object.entries(raw.personaAnswers as Record<string, unknown>)
              .filter(([k, v]) => typeof k === "string" && typeof v === "string")
              .slice(0, 20)
              .map(([k, v]) => [k.slice(0, 50), (v as string).slice(0, 500)]),
          )
        : {},
  };
  try {
    const r = await fetch(`${c.env.ORCHESTRATOR_URL}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.ORCH_SECRET}` },
      body: JSON.stringify({ profile }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return c.json({ intro: "" });
    const data = await r.json<{ intro?: string }>();
    return c.json({ intro: typeof data.intro === "string" ? data.intro : "" });
  } catch {

    return c.json({ intro: "" });
  }
});

clones.post("/asset-job", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const raw = await c.req.json<{ kind?: string; src_file_id?: number }>().catch(() => null);
  const kind = raw?.kind;
  const srcFileId = raw?.src_file_id;
  if (kind !== "idle_video" && kind !== "voice_clone") {
    throw new APIError("VALIDATION_FAILED", "Invalid kind. Must be idle_video or voice_clone.");
  }
  if (!srcFileId || !Number.isInteger(srcFileId)) {
    throw new APIError("VALIDATION_FAILED", "src_file_id required.");
  }
  const file = await c.env.DB
    .prepare(`SELECT id, r2_key, owner_user_id, purpose FROM files WHERE id = ?`)
    .bind(srcFileId)
    .first<{ id: number; r2_key: string; owner_user_id: number | null; purpose: string | null }>();

  const isPublicCatalog = file?.owner_user_id == null && file?.purpose === "voice_catalog";
  if (!file || (!isPublicCatalog && file.owner_user_id !== userId)) {
    throw new APIError("NOT_FOUND", "Source file not found.");
  }
  const jobId = crypto.randomUUID();

  const callbackToken = await createJob(c.env.DB, jobId, userId, kind, srcFileId);

  if (c.env.ORCHESTRATOR_URL && c.env.ORCH_SECRET) {
    const origin = new URL(c.req.url).origin;
    const srcUrl = `${origin}/oth-path${file.id}`;

    c.executionCtx.waitUntil(
      fetch(`${c.env.ORCHESTRATOR_URL}/oth-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${c.env.ORCH_SECRET}`,
        },
        body: JSON.stringify({ job_id: jobId, kind, src_url: srcUrl, callback_token: callbackToken }),
        signal: AbortSignal.timeout(8000),
      })

        .then((res) => setStatus(c.env.DB, jobId, res.ok ? "running" : "failed"))
        .catch(() => setStatus(c.env.DB, jobId, "failed")),
    );
  }
  return c.json({ job_id: jobId, status: "pending" }, 201);
});

clones.get("/asset-job/:id", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const job = await getJob(c.env.DB, c.req.param("id"));
  if (!job || job.user_id !== userId) throw new APIError("NOT_FOUND", "Job not found.");
  return c.json({
    job_id: job.id,
    kind: job.kind,
    status: job.status,
    out_url: job.out_url,
    error: job.error,
  });
});

clones.get("/:id", async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  const userId = await resolveOptionalUser(c);
  const viewerRole = await resolveResponseViewerRole(c.env.DB, clone, userId);

  if (clone.visibility === "private" && viewerRole !== "owner" && viewerRole !== "coowner") {
    throw new APIError("FORBIDDEN", "비공개 페르소나예요.");
  }
  if (clone.visibility === "followers" && viewerRole === null) {
    throw new APIError("FORBIDDEN", "팔로워에게만 공개된 페르소나예요.");
  }
  if (clone.visibility === "selected") {
    const isAllowed = viewerRole === "owner" || viewerRole === "coowner"
      ? true
      : userId != null && await c.env.DB
          .prepare(
            `SELECT 1 FROM clone_allowed_viewers WHERE clone_id = ? AND user_id = ? LIMIT 1`,
          )
          .bind(cloneId, userId)
          .first();
    if (!isAllowed) throw new APIError("FORBIDDEN", "이 페르소나에 접근할 권한이 없어요.");
  }

  const interests = (
    await c.env.DB
      .prepare(`SELECT interest FROM clone_interests WHERE clone_id = ?`)
      .bind(cloneId)
      .all<{ interest: string }>()
  ).results.map((r) => r.interest);

  const allowedViewers =
    viewerRole === "owner" || viewerRole === "coowner"
      ? (await c.env.DB
          .prepare(`SELECT user_id AS userId FROM clone_allowed_viewers WHERE clone_id = ?`)
          .bind(cloneId)
          .all<{ userId: number }>()).results.map((r) => r.userId)
      : undefined;

  const aggRow = await c.env.DB
    .prepare(
      `SELECT
         (SELECT COALESCE(SUM(f.likes_count), 0) FROM feeds f
            WHERE f.clone_id = ?) AS likesCount,
         (SELECT COUNT(*) FROM feed_comments fc
            JOIN feeds f2 ON f2.id = fc.feed_id
            WHERE f2.clone_id = ?) AS commentsCount`,
    )
    .bind(cloneId, cloneId)
    .first<{ likesCount: number; commentsCount: number }>();

  let likedByMe = false;
  if (userId) {
    const r = await c.env.DB
      .prepare(
        `SELECT 1 AS x FROM feed_likes fl
           JOIN feeds f ON f.id = fl.feed_id
          WHERE fl.user_id = ? AND f.clone_id = ?
          LIMIT 1`,
      )
      .bind(userId, cloneId)
      .first<{ x: number }>();
    likedByMe = !!r;
  }

  return c.json({
    clone: {
      id: clone.id,
      ownerId: clone.owner_id,
      name: clone.name,
      username: clone.username,
      description: clone.description,
      cloneType: clone.clone_type,
      category: clone.category,
      visibility: clone.visibility,
      avatarUrl: clone.avatar_url,
      coverImageUrl: clone.cover_image_url,
      voiceType: clone.voice_type,
      voicePresetId: clone.voice_preset_id,
      trainingStatus: clone.training_status,
      interests,
      ...(allowedViewers !== undefined ? { allowedViewers } : {}),
      stats: {
        followers: clone.followers_count,
        messages: clone.messages_count,
        gifts: clone.gifts_count,
        likes: aggRow?.likesCount ?? 0,
        comments: aggRow?.commentsCount ?? 0,
      },
      likedByMe,
      createdAt: clone.created_at,
      viewerRole,
    },
  });
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().max(2000).optional(),
    avatar_url: z.url().max(500).optional(),
    cover_image_url: z.url().max(500).optional(),
    visibility: visibility.optional(),
    voice_preset_id: z.number().int().positive().nullable().optional(),
    l1_profile: l1ProfileSchema.optional(),
    interests: z.array(z.string().min(1).max(40)).max(20).optional(),

    allowed_viewers: z.array(z.number().int().positive()).max(200).optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, {
    message: "At least one field required.",
  });

clones.patch("/:id", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const body = await parseJson(c, patchSchema);
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  const isOwner =
    clone.owner_id === userId ||
    (await hasAcceptedShare(db, cloneId, userId)) === "owner";
  if (!isOwner) throw new APIError("FORBIDDEN", "소유자만 변경할 수 있어요.");

  if (body.l1_profile !== undefined) {
    const row = await db
      .prepare("SELECT primary_editor_user_id FROM clones WHERE id = ? AND deleted_at IS NULL")
      .bind(cloneId)
      .first<{ primary_editor_user_id: number | null }>();
    if (row?.primary_editor_user_id !== userId) {
      throw new APIError("FORBIDDEN", "주 편집자만 페르소나 정보를 수정할 수 있어요.");
    }
  }

  const sets: string[] = [];
  const binds: unknown[] = [];
  const updatedFields: string[] = [];
  if (body.name !== undefined) {
    sets.push(`name = ?`);
    binds.push(body.name);
    updatedFields.push("name");
  }
  if (body.description !== undefined) {
    sets.push(`description = ?`);
    binds.push(body.description);
    updatedFields.push("description");
  }
  if (body.avatar_url !== undefined) {
    sets.push(`avatar_url = ?`);
    binds.push(body.avatar_url);
    updatedFields.push("avatar_url");
  }
  if (body.cover_image_url !== undefined) {
    sets.push(`cover_image_url = ?`);
    binds.push(body.cover_image_url);
    updatedFields.push("cover_image_url");
  }
  if (body.visibility !== undefined) {
    sets.push(`visibility = ?`);
    binds.push(body.visibility);
    updatedFields.push("visibility");
  }
  if (body.voice_preset_id !== undefined) {

    if (body.voice_preset_id !== null) {
      const vp = await db
        .prepare(`SELECT id FROM voice_presets WHERE id = ? AND is_active = 1`)
        .bind(body.voice_preset_id)
        .first<{ id: number }>();
      if (!vp) throw new APIError("VALIDATION_FAILED", "Invalid or inactive voice_preset_id.");
    }
    sets.push(`voice_preset_id = ?`, `voice_type = ?`);
    binds.push(body.voice_preset_id);
    binds.push(body.voice_preset_id === null ? "text_only" : "preset");
    updatedFields.push("voice_preset_id");
  }
  if (body.l1_profile !== undefined) {
    sets.push(`l1_profile = ?`);
    binds.push(JSON.stringify(body.l1_profile));
    updatedFields.push("l1_profile");
  }
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  binds.push(cloneId);

  const statements = [
    db
      .prepare(
        `UPDATE clones SET ${sets.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(...binds),
  ];

  if (body.l1_profile !== undefined) {
    statements.push(
      db
        .prepare("DELETE FROM persona_attributes WHERE clone_id = ? AND level = 'l1'")
        .bind(cloneId),
    );
    for (const [k, v] of Object.entries(body.l1_profile.attrs)) {
      statements.push(
        db
          .prepare(
            "INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?, 'l1', ?, ?)",
          )
          .bind(cloneId, k, v),
      );
    }
  }

  if (body.interests !== undefined) {
    statements.push(
      db.prepare(`DELETE FROM clone_interests WHERE clone_id = ?`).bind(cloneId),
    );

    const seen = new Set<string>();
    for (const raw of body.interests) {
      const v = raw.trim();
      if (!v || seen.has(v)) continue;
      seen.add(v);
      statements.push(
        db
          .prepare(`INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`)
          .bind(cloneId, v),
      );
    }
    updatedFields.push("interests");
  }

  if (body.allowed_viewers !== undefined) {
    statements.push(
      db.prepare(`DELETE FROM clone_allowed_viewers WHERE clone_id = ?`).bind(cloneId),
    );
    const seenU = new Set<number>();
    for (const uid of body.allowed_viewers) {
      if (uid === userId) continue; 
      if (seenU.has(uid)) continue;
      seenU.add(uid);
      statements.push(
        db
          .prepare(
            `INSERT INTO clone_allowed_viewers (clone_id, user_id) VALUES (?, ?)`,
          )
          .bind(cloneId, uid),
      );
    }
    updatedFields.push("allowed_viewers");
  }

  await db.batch(statements);

  await logActivity(c, {
    userId,
    action: "clone.update",
    details: { cloneId, updatedFields },
  });
  return c.json({ ok: true, updatedFields });
});

const l2PatchSchema = z
  .object({
    memory_summary: z.string().max(2000).optional(),
    relationship: z.string().max(2000).optional(),
    context: z.string().max(2000).optional(),
    recent_topics: z.string().max(2000).optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, {
    message: "At least one field required.",
  });

clones.patch("/:id/l2", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const body = await parseJson(c, l2PatchSchema);
  const userId = c.get("userId")!;

  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  const viewerRole = await resolveResponseViewerRole(c.env.DB, clone, userId);
  if (!viewerRole && clone.visibility !== "public") {
    throw new APIError("FORBIDDEN", "이 클론에 접근할 수 없어요.");
  }

  const raw = await readOnt(c.env, cloneId, userId);
  let data: Record<string, unknown> = {};
  if (raw) { try { data = JSON.parse(raw); } catch { data = {}; } }
  for (const k of ["memory_summary", "relationship", "context", "recent_topics"] as const) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  try {
    await writeOnt(c.env, cloneId, userId, JSON.stringify(data));
  } catch (e) {
    throw new APIError("INTERNAL_ERROR", "L2 저장에 실패했어요.");
  }

  const clean: Record<string, unknown> = {};
  for (const k of ["memory_summary", "relationship", "context", "recent_topics"] as const) {
    if (data[k] !== undefined) clean[k] = data[k];
  }
  return c.json({ l2_profile: clean });
});

clones.post("/:id/follow", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  if (clone.visibility === "private") {
    const role =
      clone.owner_id === userId
        ? "owner"
        : await hasAcceptedShare(db, cloneId, userId);
    if (!role) throw new APIError("FORBIDDEN", "비공개 페르소나는 팔로우할 수 없어요.");
  }

  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(userId, cloneId)
    .run();

  if ((result.meta?.changes ?? 0) > 0) {
    await notifyCloneEvent(c.env, "clone_follow", { actorId: userId, cloneId });
  }
  return c.json({ ok: true });
});

clones.delete("/:id/follow", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`)
    .bind(userId, cloneId)
    .run();
  return c.json({ ok: true });
});

clones.get("/:id/followers", async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
  const rows = (
    await c.env.DB
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
      .bind(cloneId, limit)
      .all<{
        followId: number;
        userId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;
  return c.json({
    items: rows.map((r) => ({
      followId: r.followId,
      userId: r.userId,
      name: r.userName,
      email: r.userEmail,
      avatarUrl: r.userAvatarUrl,
      createdAt: r.createdAt,
    })),
  });
});

clones.get("/:id/like-status", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  const row = await c.env.DB
    .prepare(
      `SELECT 1 AS hit FROM feed_likes fl
         JOIN feeds f ON f.id = fl.feed_id
        WHERE fl.user_id = ? AND f.clone_id = ?
        LIMIT 1`,
    )
    .bind(userId, cloneId)
    .first<{ hit: number }>();
  return c.json({ liked: row != null });
});

const giftSchema = z.object({
  giftId: z.string().min(1).max(80),
  giftName: z.string().min(1).max(120),
  amount: z.number().positive().max(10_000_000), 
  pin: z.string().regex(/^\d{6}$/, "6-digit PIN required"),
});

clones.post("/:id/gift", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const senderId = c.get("userId")!;
  const body = await parseJson(c, giftSchema);

  const companyAddr = c.env.COMPANY_GIFT_WALLET;
  if (!companyAddr) {
    throw new APIError(
      "INTERNAL_ERROR",
      "Server missing COMPANY_GIFT_WALLET configuration.",
    );
  }
  const currency = Number(c.env.PAYMENT_CURRENCY ?? "18") || 18;

  const sender = await c.env.DB
    .prepare(`SELECT id, xrun_member_id, email FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(senderId)
    .first<{ id: number; xrun_member_id: number | null; email: string | null }>();
  if (!sender) throw new APIError("UNAUTHENTICATED", "사용자를 찾을 수 없어요.");
  if (!sender.xrun_member_id) {
    throw new APIError("CONFLICT", "내 계정에 xrun 이 연동되어 있지 않아요.");
  }

  const clone = await c.env.DB
    .prepare(`SELECT id, owner_id FROM clones WHERE id = ? AND deleted_at IS NULL`)
    .bind(cloneId)
    .first<{ id: number; owner_id: number }>();
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  if (clone.owner_id === senderId) {
    throw new APIError("VALIDATION_FAILED", "자기 자신의 페르소나에는 선물할 수 없어요.");
  }

  const owner = await c.env.DB
    .prepare(
      `SELECT id, xrun_wallet, xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(clone.owner_id)
    .first<{ id: number; xrun_wallet: string | null; xrun_member_id: number | null }>();

  const ownerLinked = !!owner?.xrun_member_id;

  const total = isTestPriceEmail(sender.email) ? TEST_PRICE_XRUN : body.amount;
  const companyAmount = ownerLinked
    ? Math.round(total * 0.6 * 1_000_000) / 1_000_000
    : total;
  const ownerAmount = ownerLinked
    ? Math.round(total * 0.4 * 1_000_000) / 1_000_000
    : 0;

  const insertRes = await c.env.DB
    .prepare(
      `INSERT INTO gift_logs
         (sender_user_id, clone_id, owner_user_id, gift_id, gift_name,
          total_amount, company_amount, owner_amount,
          company_address, owner_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      senderId,
      cloneId,
      clone.owner_id,
      body.giftId,
      body.giftName,
      total,
      companyAmount,
      ownerAmount,
      companyAddr,

      owner?.xrun_wallet ?? null,
    )
    .run();
  const logId = Number(insertRes.meta.last_row_id);

  const recipients = ownerLinked
    ? [
        { toAddress: companyAddr, amount: String(companyAmount) },
        { toMember: owner!.xrun_member_id!, amount: String(ownerAmount) },
      ]
    : [{ toAddress: companyAddr, amount: String(companyAmount) }];
  const xrunRes = await externalTransferSplit(c.env, {
    fromMember: sender.xrun_member_id,
    recipients,
    currency,
    pin: body.pin,
    source: "afterlife.gift",
  });

  const giftTestBypass =
    !xrunRes.ok && isTestPriceEmail(sender.email) && (xrunRes.code === 401 || xrunRes.code === 403);
  if (giftTestBypass) {
    console.log(`[gift][TEST_BYPASS] PIN 오류 무시, 송금 없이 정산 로직 진행 — member=${sender.xrun_member_id} reason=${xrunRes.reason}`);
  } else if (!xrunRes.ok) {

    await c.env.DB
      .prepare(
        `UPDATE gift_logs SET status = 'failed', failure_reason = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .bind(xrunRes.reason ?? "unknown", logId)
      .run();

    if (xrunRes.code === 401 || xrunRes.code === 403) {
      const pinNotSet = /paymentPin not set/i.test(xrunRes.reason ?? "");
      throw new APIError(
        pinNotSet ? "PAYMENT_PIN_REQUIRED" : "PAYMENT_PIN_INVALID",
        pinNotSet ? "결제 비밀번호가 설정되어 있지 않아요." : "결제 비밀번호가 일치하지 않아요.",
        { reason: xrunRes.reason },
      );
    }
    if (xrunRes.code === 402) {
      throw new APIError("INSUFFICIENT_FUNDS", "Insufficient XRUN balance.", {
        reason: xrunRes.reason,
      });
    }
    if (xrunRes.code === 501 || xrunRes.code === 404) {
      throw new APIError(
        "UPSTREAM_NOT_IMPLEMENTED",
        "xrun transfer endpoint not yet available.",
        { reason: xrunRes.reason },
      );
    }
    throw new APIError("UPSTREAM_FAILURE", xrunRes.reason ?? "xrun transfer error");
  }

  const companyAddrL = companyAddr.toLowerCase();
  const companyTx = xrunRes.txs.find((t) => t.toAddress.toLowerCase() === companyAddrL);
  const ownerTx = xrunRes.txs.find((t) => t.toAddress.toLowerCase() !== companyAddrL);
  console.log(
    `[gift] xrun txs:`,
    xrunRes.txs.map((t) => `${t.toAddress}=${(t.txHash ?? "").slice(0, 12)}`).join(" | "),
    `companyMatch=${!!companyTx} ownerMatch=${!!ownerTx} newBalance=${xrunRes.newBalance}`,
  );
  await c.env.DB
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
      companyTx?.txHash ?? null,
      ownerTx?.txHash ?? null,
      ownerTx?.toAddress ?? null, 
      logId,
    )
    .run();

  await logActivity(c, {
    userId: senderId,
    action: "clone.gift.sent",
    details: {
      cloneId,
      ownerId: clone.owner_id,
      giftId: body.giftId,
      amount: total,
    },
  });

  await notifyCloneEvent(c.env, "clone_gift", {
    actorId: senderId,
    cloneId,
    extraBody: `${body.giftName} 선물 (+${ownerAmount} XRUN)`,
  });

  try {
    const { recordAfterlifeGiftCommission } = await import("../lib/giftCommission");
    const r = await recordAfterlifeGiftCommission(c.env, {
      cloneId,
      ownerXrunMember: owner?.xrun_member_id ?? null,
      totalXrun: total,
      giftName: body.giftName,
    });
    if (!r.recorded) {
      console.log(`[gift] commission skip: ${r.reason}`);
    } else {
      console.log(`[gift] commission recorded — recommender=${r.recommender} amount=${r.amount}`);
    }
  } catch (err) {
    console.warn("[gift] commission record failed:", (err as Error).message);
  }

  return c.json({
    ok: true,
    gift: {
      id: logId,
      giftId: body.giftId,
      giftName: body.giftName,
      total,
      companyAmount,
      ownerAmount,
      txCompany: companyTx?.txHash ?? null,
      txOwner: ownerTx?.txHash ?? null,
      newBalance: xrunRes.newBalance,
    },
  });
});

clones.post("/:id/block", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_blocks (user_id, clone_id) VALUES (?, ?)`,
    ).bind(userId, cloneId),
    c.env.DB.prepare(
      `DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`,
    ).bind(userId, cloneId),
  ]);
  return c.json({ ok: true, blocked: true });
});

clones.delete("/:id/block", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`DELETE FROM clone_blocks WHERE user_id = ? AND clone_id = ?`)
    .bind(userId, cloneId)
    .run();
  return c.json({ ok: true, blocked: false });
});

const reportSchema = z.object({
  reason: z.string().max(500).optional(),
});
clones.post("/:id/report", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  const body = await parseJson(c, reportSchema).catch(() => ({ reason: undefined }));

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_reports (user_id, clone_id, reason)
         VALUES (?, ?, ?)`,
    ).bind(userId, cloneId, body.reason ?? null),
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_blocks (user_id, clone_id) VALUES (?, ?)`,
    ).bind(userId, cloneId),
    c.env.DB.prepare(
      `DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`,
    ).bind(userId, cloneId),
  ]);
  await logActivity(c, {
    userId,
    action: "clone.report",
    details: { cloneId, reason: body.reason ?? null },
  });
  return c.json({ ok: true, reported: true, blocked: true });
});

const callEventSchema = z.object({
  durationSeconds: z.number().int().min(0).max(86400).optional(),
});
clones.post("/:id/call-event", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  const body = await parseJson(c, callEventSchema).catch(() => ({ durationSeconds: undefined }));
  await bumpInteraction(c.env, userId, cloneId, "call");

  const duration = body.durationSeconds ?? 0;
  let scoreApplied = 0;
  if (duration >= CALL_MIN_SECONDS_FOR_SCORE) {
    const r = await addIntimacyScore(c.env, userId, cloneId, INTIMACY_WEIGHTS.call, "call");
    scoreApplied = r.applied;
  }
  await logActivity(c, {
    userId,
    action: "clone.call_event",
    details: { cloneId, durationSeconds: duration, scoreApplied },
  });
  return c.json({ ok: true, scoreApplied });
});

clones.post("/:id/learn-event", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;

  await bumpInteraction(c.env, userId, cloneId, "learn");

  const cooldownKey = `intimacy_cd:learn:${userId}:${cloneId}`;
  const onCooldown = !!(await c.env.KV_RATE.get(cooldownKey));
  let scoreApplied = 0;
  if (!onCooldown) {
    const r = await addIntimacyScore(c.env, userId, cloneId, INTIMACY_WEIGHTS.learn, "learn");
    scoreApplied = r.applied;
    if (scoreApplied > 0) {
      await c.env.KV_RATE.put(cooldownKey, "1", { expirationTtl: 20 * 60 });
    }
  }
  return c.json({ ok: true, bumped: true, scoreApplied });
});

clones.post("/:id/chat-event", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  await bumpInteraction(c.env, userId, cloneId, "chat");
  const r = await addIntimacyScore(c.env, userId, cloneId, INTIMACY_WEIGHTS.chat, "chat");
  return c.json({ ok: true, scoreApplied: r.applied });
});

clones.get("/:id/gifts/summary", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  if (clone.owner_id !== userId)
    throw new APIError("FORBIDDEN", "소유자만 열람할 수 있어요.");

  const rows = await db
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
    .bind(cloneId)
    .all<{
      gift_id: string;
      gift_name: string;
      cnt: number;
      last_at: string; 
      sender_name: string | null;
    }>();

  const items = (rows.results ?? []).map((r) => ({
    giftId: r.gift_id,
    giftName: r.gift_name,
    count: r.cnt,
    sender: maskUsername(r.sender_name), 
  }));

  return c.json({ items });
});
