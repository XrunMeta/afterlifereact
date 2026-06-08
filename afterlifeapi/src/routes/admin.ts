import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { runCleanup } from "../scheduled/cleanup";
import { requireAdmin, requireSuperAdmin } from "../middleware/auth";
import { parseJson, z } from "../lib/validate";
import { getKekProvider, openAny, openV3, sealV3, seal, extractDekId } from "../lib/ale";
import { requestKekProvider } from "../lib/kekProvider";
import { writeDecryptionAudit } from "../lib/auditChain";
import { loadSystemPersona } from "../lib/systemPersona";
import { loadPersonaQuestions, validatePersonaQuestions } from "../lib/personaQuestions";

export const admin = new Hono<AppEnv>();

admin.get("/health", (c) => c.json({ ok: true, module: "admin" }));

const openSchema = z.object({
  resourceType: z.enum(["message.content", "user.phone", "user.age"]),
  resourceId: z.number().int().positive(),
  reason: z.string().min(10).max(500), 
  ticketId: z.string().max(128).optional(),
});

interface ResourceFetch {
  blob: string | null;
  aleContext: string;
}

async function fetchEncryptedField(
  db: D1Database,
  resourceType: z.infer<typeof openSchema>["resourceType"],
  resourceId: number,
): Promise<ResourceFetch | null> {
  if (resourceType === "message.content") {
    const row = await db
      .prepare(`SELECT content, clone_id FROM messages WHERE id = ?`)
      .bind(resourceId)
      .first<{ content: string | null; clone_id: number | null }>();
    if (!row) return null;
    return {
      blob: row.content,
      aleContext: `msg:${row.clone_id ?? "unknown"}`,
    };
  }
  if (resourceType === "user.phone") {
    const row = await db
      .prepare(`SELECT phone FROM users WHERE id = ?`)
      .bind(resourceId)
      .first<{ phone: string | null }>();
    if (!row) return null;
    return { blob: row.phone, aleContext: "user.phone" };
  }
  if (resourceType === "user.age") {
    const row = await db
      .prepare(`SELECT age_enc FROM users WHERE id = ?`)
      .bind(resourceId)
      .first<{ age_enc: string | null }>();
    if (!row) return null;
    return { blob: row.age_enc, aleContext: "user.age" };
  }
  return null;
}

function resourceTypeToHint(
  resourceType: "message.content" | "user.phone" | "user.age",
  resourceId: number,
): { key: "users.phone" | "users.age_enc" | "messages.content"; resourceId: number } | undefined {
  if (resourceType === "user.phone") return { key: "users.phone", resourceId };
  if (resourceType === "user.age") return { key: "users.age_enc", resourceId };
  if (resourceType === "message.content") return { key: "messages.content", resourceId };
  return undefined;
}

admin.post("/decryption/open", requireAdmin, async (c) => {
  const adminId = c.get("adminUserId");
  if (!adminId) throw new APIError("UNAUTHENTICATED", "Admin identity missing.");
  const body = await parseJson(c, openSchema);

  const fetched = await fetchEncryptedField(c.env.DB, body.resourceType, body.resourceId);
  if (!fetched) throw new APIError("NOT_FOUND", "Resource not found.");
  if (!fetched.blob) {

    return c.json({ ok: false, reason: "EMPTY_OR_PURGED" }, 410);
  }

  const lazyRotationEnabled = c.env.LAZY_ROTATION_ENABLED === "1";
  const version = fetched.blob.split(".")[0];
  let plaintext: string;
  try {
    if (version === "v3") {
      const provider = await requestKekProvider(c);
      plaintext = await openV3(c.env.DB, fetched.blob, provider, { lazyRotationEnabled });
    } else {

      const legacyProvider = getKekProvider(c.env.ALE_KEK);
      const v3Provider = await requestKekProvider(c);
      const hint = resourceTypeToHint(body.resourceType, body.resourceId);
      plaintext = await openAny(fetched.blob, {
        db: c.env.DB,
        hkdfContext: fetched.aleContext,
        legacyProvider,
        v3Provider,
        actor: { type: "admin", id: adminId },
        auditSecret: c.env.AUDIT_SECRET,
        lazyMigrateEnabled: c.env.LAZY_V2_MIGRATE_ENABLED === "1",
        hint,
      });
    }
  } catch (err) {
    if ((err as { code?: string }).code === "SHREDDED") {
      throw err;
    }
    throw new APIError("INTERNAL_ERROR", `Decryption failed: ${(err as Error).message}`);
  }

  await writeDecryptionAudit(c.env.DB, c.env.AUDIT_SECRET, {
    actor: { type: "admin", id: adminId },
    op: "decrypt",
    resourceType: body.resourceType,
    resourceId: body.resourceId,
    reason: body.reason,
    ticketId: body.ticketId ?? null,
  });

  return c.json({
    ok: true,
    resourceType: body.resourceType,
    resourceId: body.resourceId,
    version,
    plaintext,
  });
});

admin.get("/decryption/audit", requireAdmin, async (c) => {
  const resourceType = c.req.query("resourceType");
  const resourceId = c.req.query("resourceId");
  const actorId = c.req.query("actorId");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);

  const where: string[] = [];
  const binds: unknown[] = [];
  if (resourceType) {
    where.push("resource_type = ?");
    binds.push(resourceType);
  }
  if (resourceId) {
    where.push("resource_id = ?");
    binds.push(resourceId);
  }
  if (actorId) {
    where.push("actor_id = ?");
    binds.push(actorId);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT id, actor_type AS actorType, actor_id AS actorId, ticket_id AS ticketId,
                op, resource_type AS resourceType, resource_id AS resourceId,
                reason, ts
           FROM decryption_audit_log
          ${whereSql}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit)
      .all()
  ).results;

  return c.json({ entries: rows });
});

admin.post("/cleanup/run", async (c) => {
  const token = c.req.header("X-Admin-Cron-Token");
  const expected = (c.env as unknown as { ADMIN_CRON_TOKEN?: string }).ADMIN_CRON_TOKEN;
  if (!expected || !token || token !== expected) {
    throw new APIError("NOT_FOUND", "Not found.");
  }
  const result = await runCleanup(c.env);
  return c.json(result);
});

admin.post("/_dev/seal-v3", async (c) => {
  if (!c.env.ADMIN_BOOTSTRAP_TOKEN || c.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new APIError("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const body = await c.req.json<{
    token: string;
    resourceType: string;
    resourceId: string;
    plaintext: string;
  }>();
  if (body.token !== c.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new APIError("NOT_FOUND", "Not found.");
  }
  const provider = await requestKekProvider(c);
  const blob = await sealV3(
    c.env.DB,
    body.plaintext,
    provider,
    { type: body.resourceType, id: body.resourceId },
  );
  return c.json({ blob, dekId: extractDekId(blob) }, 201);
});

admin.post("/_dev/seal-v2", async (c) => {
  if (!c.env.ADMIN_BOOTSTRAP_TOKEN || c.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new APIError("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const body = await c.req.json<{
    token: string;
    hkdfContext: string;
    plaintext: string;
  }>();
  if (body.token !== c.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new APIError("NOT_FOUND", "Not found.");
  }
  const provider = getKekProvider(c.env.ALE_KEK);
  const blob = seal(body.plaintext, provider, body.hkdfContext);
  return c.json({ blob }, 201);
});

admin.post("/_dev/open-v3", async (c) => {
  if (!c.env.ADMIN_BOOTSTRAP_TOKEN || c.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new APIError("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const body = await c.req.json<{
    token: string;
    blob: string;
    lazyRotationOverride?: boolean;
  }>();
  if (body.token !== c.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new APIError("NOT_FOUND", "Not found.");
  }
  const provider = await requestKekProvider(c);
  const lazyRotationEnabled =
    body.lazyRotationOverride ?? c.env.LAZY_ROTATION_ENABLED === "1";
  const plain = await openV3(c.env.DB, body.blob, provider, { lazyRotationEnabled });
  return c.json({ plain });
});

admin.post("/_dev/open-any", async (c) => {
  if (!c.env.ADMIN_BOOTSTRAP_TOKEN || c.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new APIError("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const body = await c.req.json<{
    token: string;
    blob: string;
    hkdfContext: string;
    hint?: { key: "users.phone" | "users.age_enc" | "messages.content"; resourceId: string | number };
    lazyMigrateOverride?: boolean;
  }>();
  if (body.token !== c.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new APIError("NOT_FOUND", "Not found.");
  }
  const legacyProvider = getKekProvider(c.env.ALE_KEK);
  const v3Provider = await requestKekProvider(c);
  const lazyMigrateEnabled =
    body.lazyMigrateOverride ?? c.env.LAZY_V2_MIGRATE_ENABLED === "1";
  const plain = await openAny(body.blob, {
    db: c.env.DB,
    hkdfContext: body.hkdfContext,
    legacyProvider,
    v3Provider,
    actor: { type: "system", id: "dev-smoke" },
    auditSecret: c.env.AUDIT_SECRET,
    lazyMigrateEnabled,
    hint: body.hint,
  });
  return c.json({ plain });
});

admin.get("/system-persona", requireAdmin, async (c) => {
  const l0 = await loadSystemPersona(c.env.DB);
  return c.json(l0);
});

admin.put("/system-persona", requireSuperAdmin, async (c) => {
  const adminId = c.get("adminUserId") ?? null;
  const body = await c.req
    .json<{ rules_text?: unknown; blocklist?: unknown }>()
    .catch(() => ({}) as { rules_text?: unknown; blocklist?: unknown });
  const rulesText = typeof body.rules_text === "string" ? body.rules_text : "";
  if (rulesText.length > 8000) return c.json({ error: "rules_text_too_long" }, 400);
  const blocklistArr = Array.isArray(body.blocklist)
    ? body.blocklist.filter((x: unknown): x is string => typeof x === "string").slice(0, 1000)
    : [];
  await c.env.DB.prepare(
    `INSERT INTO system_persona (id, rules_text, blocklist, updated_by, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       rules_text  = excluded.rules_text,
       blocklist   = excluded.blocklist,
       updated_by  = excluded.updated_by,
       updated_at  = excluded.updated_at`,
  )
    .bind(rulesText, JSON.stringify(blocklistArr), adminId, Date.now())
    .run();
  return c.json({ ok: true });
});

admin.get("/persona-questions", requireAdmin, async (c) => {
  const questions = await loadPersonaQuestions(c.env.DB);
  return c.json({ questions });
});

admin.put("/persona-questions", requireSuperAdmin, async (c) => {
  const adminId = c.get("adminUserId") ?? null;
  const body = await c.req
    .json<{ questions?: unknown }>()
    .catch(() => ({}) as { questions?: unknown });
  const result = validatePersonaQuestions(body.questions);
  if (!result.ok) return c.json({ error: result.error }, 400);
  await c.env.DB.prepare(
    `INSERT INTO persona_question_schema (id, schema_json, updated_by, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       schema_json = excluded.schema_json,
       updated_by  = excluded.updated_by,
       updated_at  = excluded.updated_at`,
  )
    .bind(JSON.stringify(result.questions), adminId, Date.now())
    .run();
  return c.json({ ok: true });
});

admin.get("/voices", requireAdmin, async (c) => {
  const rows = await c.env.DB
    .prepare(
      `SELECT id, name, gender, age_range, description, sort_order, is_active, r2_key, se_key
       FROM voice_presets ORDER BY sort_order ASC, id ASC`,
    )
    .all();
  return c.json({ voices: rows.results ?? [] });
});

const voicePostSchema = z.object({
  name: z.string().min(1).max(80),
  gender: z.string().max(40).optional(),
  age_range: z.string().max(40).optional(),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
  r2_key: z.string().max(500).optional(),
  se_key: z.string().max(500).optional(),
});

const voicePutSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  gender: z.string().max(40).optional(),
  age_range: z.string().max(40).optional(),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
  r2_key: z.string().max(500).optional(),
  se_key: z.string().max(500).optional(),
});

function assertR2KeyPrefix(r2_key: string | undefined): void {
  if (r2_key !== undefined && !r2_key.startsWith("voice/")) {
    throw new APIError("VALIDATION_FAILED", "r2_key must start with 'voice/'.");
  }
}

admin.post("/voices", requireSuperAdmin, async (c) => {
  const b = await parseJson(c, voicePostSchema);
  assertR2KeyPrefix(b.r2_key);
  const ins = await c.env.DB
    .prepare(
      `INSERT INTO voice_presets (name, gender, age_range, description, sort_order, is_active, r2_key, se_key)
       VALUES (?,?,?,?,?,?,?,?) RETURNING id`,
    )
    .bind(
      b.name,
      b.gender ?? null,
      b.age_range ?? null,
      b.description ?? null,
      b.sort_order ?? 100,
      b.is_active ?? 1,
      b.r2_key ?? null,
      b.se_key ?? null,
    )
    .first<{ id: number }>();
  return c.json({ id: ins!.id }, 201);
});

admin.put("/voices/:id", requireSuperAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const b = await parseJson(c, voicePutSchema);
  assertR2KeyPrefix(b.r2_key);
  const fields: string[] = [];
  const binds: unknown[] = [];
  const mapping: Array<[keyof typeof b, string]> = [
    ["name", "name"],
    ["gender", "gender"],
    ["age_range", "age_range"],
    ["description", "description"],
    ["sort_order", "sort_order"],
    ["is_active", "is_active"],
    ["r2_key", "r2_key"],
    ["se_key", "se_key"],
  ];
  for (const [k, col] of mapping) {
    if (b[k] !== undefined) {
      fields.push(`${col} = ?`);
      binds.push(b[k]);
    }
  }
  if (!fields.length) throw new APIError("VALIDATION_FAILED", "No fields to update.");
  binds.push(id);
  const r = await c.env.DB
    .prepare(`UPDATE voice_presets SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Voice not found.");
  return c.json({ ok: true });
});

admin.delete("/oth-path", requireAdmin, async (c) => {
  const idRaw = c.req.param("id");
  const cloneId = Number(idRaw);
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const existing = await c.env.DB
    .prepare(`SELECT id, deletion_state FROM clones WHERE id = ?`)
    .bind(cloneId)
    .first<{ id: number; deletion_state: string }>();
  if (!existing) throw new APIError("NOT_FOUND", "Clone not found.");
  if (existing.deletion_state !== "active") {
    return c.json({ ok: true, alreadyDeleted: true, deletionState: existing.deletion_state });
  }
  await c.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(cloneId)
    .run();
  return c.json({ ok: true, deletedId: cloneId, deletionState: "soft_deleted" });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const existing = await c.env.DB
    .prepare(`SELECT id, deletion_state FROM clones WHERE id = ?`)
    .bind(cloneId)
    .first<{ id: number; deletion_state: string }>();
  if (!existing) throw new APIError("NOT_FOUND", "Clone not found.");
  if (existing.deletion_state !== "active") {
    return c.json({ ok: true, alreadyDisabled: true, deletionState: existing.deletion_state });
  }
  await c.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(cloneId)
    .run();
  return c.json({ ok: true, cloneId, deletionState: "soft_deleted" });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const existing = await c.env.DB
    .prepare(`SELECT id, deletion_state FROM clones WHERE id = ?`)
    .bind(cloneId)
    .first<{ id: number; deletion_state: string }>();
  if (!existing) throw new APIError("NOT_FOUND", "Clone not found.");
  if (existing.deletion_state === "active") {
    return c.json({ ok: true, alreadyActive: true, deletionState: "active" });
  }
  if (existing.deletion_state === "hard_deleted" || existing.deletion_state === "archived_cold") {
    throw new APIError("CONFLICT", `Cannot activate from state '${existing.deletion_state}'.`);
  }
  await c.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'active',
              soft_deleted_at = NULL,
              deleted_at = NULL
        WHERE id = ?`,
    )
    .bind(cloneId)
    .run();
  return c.json({ ok: true, cloneId, deletionState: "active" });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const status = url.searchParams.get("status");

  const where: string[] = ["1=1"];
  const binds: unknown[] = [];
  if (status && ["open", "reviewed", "dismissed", "actioned"].includes(status)) {
    where.push("r.status = ?");
    binds.push(status);
  }

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT r.id AS id,
                r.reporter_id AS reporterId,
                ru.name AS reporterName,
                ru.email AS reporterEmail,
                r.target_id AS targetId,
                tu.name AS targetName,
                tu.email AS targetEmail,
                r.reason AS reason,
                r.status AS status,
                r.created_at AS createdAt,
                r.reviewed_at AS reviewedAt
           FROM user_reports r
           JOIN users ru ON ru.id = r.reporter_id
           JOIN users tu ON tu.id = r.target_id
          WHERE ${where.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...binds, limit)
      .all()
  ).results;
  return c.json({ items: rows });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const status = url.searchParams.get("status");

  const where: string[] = ["1=1"];
  const binds: unknown[] = [];
  if (status && ["open", "reviewed", "dismissed"].includes(status)) {
    where.push("r.status = ?");
    binds.push(status);
  }

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT r.id AS id,
                r.user_id AS userId,
                u.name AS userName,
                u.email AS userEmail,
                r.clone_id AS cloneId,
                c.name AS cloneName,
                c.username AS cloneUsername,
                c.owner_id AS cloneOwnerId,
                co.name AS cloneOwnerName,
                co.email AS cloneOwnerEmail,
                r.reason AS reason,
                r.status AS status,
                r.created_at AS createdAt,
                r.reviewed_at AS reviewedAt
           FROM clone_reports r
           JOIN users u ON u.id = r.user_id
           JOIN clones c ON c.id = r.clone_id
           LEFT JOIN users co ON co.id = c.owner_id
          WHERE ${where.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...binds, limit)
      .all()
  ).results;
  return c.json({ items: rows });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const row = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.username, c.description,
            c.clone_type AS cloneType, c.visibility,
            c.training_status AS trainingStatus,
            c.owner_id AS ownerId, u.name AS ownerName,
            c.created_at AS createdAt,
            c.deletion_state AS deletionState,
            c.soft_deleted_at AS softDeletedAt,
            c.deleted_at AS deletedAt
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(id)
    .first();
  if (!row) throw new APIError("NOT_FOUND", "Clone not found.");
  return c.json(row);
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const row = await c.env.DB.prepare(
    `SELECT id, name, email, gender, age, credits,
            funnel_stage AS funnelStage,
            deletion_state AS deletionState,
            created_at AS createdAt
       FROM users WHERE id = ?`,
  )
    .bind(id)
    .first();
  if (!row) throw new APIError("NOT_FOUND", "User not found.");
  return c.json(row);
});

admin.get("/by-xrun/:xrunMemberId/summary", requireAdmin, async (c) => {
  const xrunId = Number(c.req.param("xrunMemberId"));
  if (!Number.isInteger(xrunId) || xrunId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid xrun member id.");
  }
  const user = await c.env.DB
    .prepare(
      `SELECT id, name, email,
              deletion_state AS deletionState,
              created_at AS createdAt
         FROM users
        WHERE xrun_member_id = ?
        LIMIT 1`,
    )
    .bind(xrunId)
    .first<{
      id: number;
      name: string | null;
      email: string;
      deletionState: string;
      createdAt: string | null;
    }>();

  if (!user) {
    return c.json({
      user: null,
      clones: [],
      cloneReportsCount: 0,
      userReportsCount: 0,
    });
  }

  const clones = (
    await c.env.DB
      .prepare(
        `SELECT c.id, c.name, c.username,
                c.clone_type AS cloneType,
                c.visibility,
                c.training_status AS trainingStatus,
                c.deletion_state AS deletionState,
                c.created_at AS createdAt,
                (SELECT COUNT(*) FROM clone_reports cr WHERE cr.clone_id = c.id) AS reportCount
           FROM clones c
          WHERE c.owner_id = ?
          ORDER BY c.id DESC
          LIMIT 200`,
      )
      .bind(user.id)
      .all()
  ).results;

  const cloneReports = await c.env.DB
    .prepare(
      `SELECT COUNT(*) AS cnt
         FROM clone_reports cr
         JOIN clones c ON c.id = cr.clone_id
        WHERE c.owner_id = ?`,
    )
    .bind(user.id)
    .first<{ cnt: number }>();

  const userReports = await c.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM user_reports WHERE target_id = ?`)
    .bind(user.id)
    .first<{ cnt: number }>();

  return c.json({
    user,
    clones,
    cloneReportsCount: cloneReports?.cnt ?? 0,
    userReportsCount: userReports?.cnt ?? 0,
  });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const rows = await c.env.DB
    .prepare(
      `SELECT cr.id, cr.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              cr.reason, cr.status,
              cr.created_at AS createdAt,
              cr.reviewed_at AS reviewedAt
         FROM clone_reports cr
         JOIN users u ON u.id = cr.user_id
        WHERE cr.clone_id = ?
        ORDER BY cr.created_at DESC
        LIMIT 200`,
    )
    .bind(cloneId)
    .all();
  return c.json({ items: rows.results });
});

