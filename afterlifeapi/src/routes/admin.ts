import { Hono, type Context } from "hono";
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
import { loadKnowledgeQuestions, validateKnowledgeQuestions } from "../lib/knowledgeQuestions";
import { loadBlacklist, validateBlacklist } from "../lib/knowledgeBlacklist";
import { normalizeKnowledge } from "../lib/knowledgeStore";
import { notify } from "../lib/notify";
import {
  getPersonaPriceXrun,
  setPersonaPriceXrun,
  getKnowledgeInterpretRules,
  setKnowledgeInterpretRules,
} from "../lib/appConfig";

export const admin = new Hono<AppEnv>();

admin.get("/health", (c) => c.json({ ok: true, module: "admin" }));

admin.get("/config/persona-price", requireAdmin, async (c) => {
  const priceXrun = await getPersonaPriceXrun(c.env);
  return c.json({ priceXrun });
});
admin.patch("/config/persona-price", requireAdmin, async (c) => {
  const body = await c.req.json<{ priceXrun?: unknown }>().catch(() => ({} as { priceXrun?: unknown }));
  const price = Number(body.priceXrun);
  if (!Number.isFinite(price) || price < 0) {
    throw new APIError("VALIDATION_FAILED", "priceXrun must be a non-negative number.");
  }
  await setPersonaPriceXrun(c.env, price);
  return c.json({ ok: true, priceXrun: price });
});

const KNOWLEDGE_RULES_MAX = 8000;
admin.get("/config/knowledge-rules", requireAdmin, async (c) => {
  const rules = await getKnowledgeInterpretRules(c.env);
  return c.json({ rules });
});
admin.patch("/config/knowledge-rules", requireAdmin, async (c) => {
  const body = await c.req.json<{ rules?: unknown }>().catch(() => ({} as { rules?: unknown }));
  const rules = typeof body.rules === "string" ? body.rules : "";
  if (rules.length > KNOWLEDGE_RULES_MAX) {
    throw new APIError("VALIDATION_FAILED", `rules must be ≤ ${KNOWLEDGE_RULES_MAX} chars.`);
  }
  await setKnowledgeInterpretRules(c.env, rules);
  return c.json({ ok: true, rules });
});

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

admin.get("/knowledge-questions", requireAdmin, async (c) => {
  const questions = await loadKnowledgeQuestions(c.env.DB);
  return c.json({ questions });
});

admin.put("/knowledge-questions", requireSuperAdmin, async (c) => {
  const adminId = c.get("adminUserId") ?? null;
  const body = await c.req
    .json<{ questions?: unknown }>()
    .catch(() => ({}) as { questions?: unknown });
  const result = validateKnowledgeQuestions(body.questions);
  if (!result.ok) return c.json({ error: result.error }, 400);
  await c.env.DB.prepare(
    `INSERT INTO knowledge_question_schema (id, schema_json, updated_by, updated_at)
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

admin.get("/knowledge-blacklist", requireAdmin, async (c) => {
  const words = await loadBlacklist(c.env.DB);
  return c.json({ words });
});

admin.put("/knowledge-blacklist", requireAdmin, async (c) => {
  const adminId = c.get("adminUserId") ?? null;
  const body = await c.req
    .json<{ words?: unknown }>()
    .catch(() => ({}) as { words?: unknown });
  const result = validateBlacklist(body.words);
  if (!result.ok) return c.json({ error: result.error }, 400);
  await c.env.DB.prepare(
    `INSERT INTO knowledge_blacklist (id, blacklist_json, updated_by, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       blacklist_json = excluded.blacklist_json,
       updated_by     = excluded.updated_by,
       updated_at     = excluded.updated_at`,
  )
    .bind(JSON.stringify(result.words), adminId, Date.now())
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
  if (!Number.isInteger(id) || id <= 0)
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  const row = await c.env.DB
    .prepare(
      "SELECT id, name, username, l1_profile FROM clones WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(id)
    .first<{ id: number; name: string; username: string; l1_profile: string | null }>();
  if (!row) throw new APIError("NOT_FOUND", "Clone not found.");
  let l1: unknown = null;
  if (row.l1_profile) {
    try {
      l1 = JSON.parse(row.l1_profile);
    } catch {

    }
  }
  return c.json({ id: row.id, name: row.name, username: row.username, l1_profile: l1 });
});

const adminL1UpdateSchema = z.object({
  l1_profile: z.object({
    attrs: z.record(z.string(), z.string()).optional(),
    notes: z.string().max(4000).optional(),
    personality_core: z.string().max(500).optional(),
    tone: z.string().max(500).optional(),
    knowledge: z
      .array(
        z.object({
          key: z.string().max(50).nullish(),
          q: z.string().max(200).nullish(),
          a: z.string().max(3000),
        }),
      )
      .max(60) 
      .optional(),
  }),
});

admin.put("/oth-path", requireSuperAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0)
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  const body = await parseJson(c, adminL1UpdateSchema);
  const row = await c.env.DB
    .prepare("SELECT l1_profile FROM clones WHERE id = ? AND deleted_at IS NULL")
    .bind(id)
    .first<{ l1_profile: string | null }>();
  if (!row) throw new APIError("NOT_FOUND", "Clone not found.");

  let prev: Record<string, unknown> = {};
  if (row.l1_profile) {
    try {
      const p = JSON.parse(row.l1_profile);
      if (p && typeof p === "object") prev = p as Record<string, unknown>;
    } catch {

    }
  }

  const next: Record<string, unknown> = { ...prev };
  const upd = body.l1_profile;
  if (upd.attrs !== undefined) next.attrs = upd.attrs;
  if (upd.notes !== undefined) next.notes = upd.notes;
  if (upd.personality_core !== undefined) next.personality_core = upd.personality_core;
  if (upd.tone !== undefined) next.tone = upd.tone;
  if (upd.knowledge !== undefined) {
    const norm = normalizeKnowledge(upd.knowledge as never, Date.now());
    if (!norm.ok) throw new APIError("VALIDATION_FAILED", norm.error);
    next.knowledge = norm.items;
  }

  await c.env.DB
    .prepare(
      "UPDATE clones SET l1_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(JSON.stringify(next), id)
    .run();
  return c.json({ ok: true, l1_profile: next });
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
              created_at AS createdAt,
              soft_deleted_at AS softDeletedAt,
              suspended_until AS suspendedUntil,
              banned_until AS bannedUntil
         FROM users
        WHERE xrun_member_id = ?
        ORDER BY (deletion_state = 'active' AND deleted_at IS NULL) DESC, id DESC
        LIMIT 1`,
    )
    .bind(xrunId)
    .first<{
      id: number;
      name: string | null;
      email: string;
      deletionState: string;
      createdAt: string | null;
      softDeletedAt: string | null;
      suspendedUntil: string | null;
      bannedUntil: string | null;
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
          WHERE c.owner_id = ? AND c.deletion_state = 'active'
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

  const commentReports = await c.env.DB
    .prepare(
      `SELECT COUNT(*) AS cnt
         FROM comment_reports cmr
         JOIN feed_comments fc ON fc.id = cmr.comment_id
        WHERE fc.user_id = ?`,
    )
    .bind(user.id)
    .first<{ cnt: number }>();

  const reportsMade = await c.env.DB
    .prepare(
      `SELECT (
         (SELECT COUNT(*) FROM user_reports    WHERE reporter_id = ?) +
         (SELECT COUNT(*) FROM clone_reports   WHERE user_id     = ?) +
         (SELECT COUNT(*) FROM comment_reports WHERE user_id     = ?)
       ) AS cnt`,
    )
    .bind(user.id, user.id, user.id)
    .first<{ cnt: number }>();

  const lastWarning = await c.env.DB
    .prepare(`SELECT reason FROM user_warnings WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`)
    .bind(user.id)
    .first<{ reason: string | null }>();

  return c.json({
    user: { ...user, suspensionReason: lastWarning?.reason ?? null },
    clones,
    cloneReportsCount: cloneReports?.cnt ?? 0,
    userReportsCount: userReports?.cnt ?? 0,
    commentReportsCount: commentReports?.cnt ?? 0,

    reportsReceivedCount: (cloneReports?.cnt ?? 0) + (userReports?.cnt ?? 0) + (commentReports?.cnt ?? 0),
    reportsMadeCount: reportsMade?.cnt ?? 0,
  });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB
    .prepare(`UPDATE users SET suspended_until = NULL, banned_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(id)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "User not found.");
  return c.json({ ok: true });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const body = await c.req
    .json<{ action?: string; suspendDays?: number | null; reason?: string }>()
    .catch(() => ({}) as { action?: string; suspendDays?: number | null; reason?: string });
  const VALID = ["warn", "clone_deactivate", "clone_delete", "clone_create_ban", "account_ban"];
  const action = body.action === "suspend" ? "clone_create_ban" : body.action ?? "";
  if (!VALID.includes(action)) throw new APIError("VALIDATION_FAILED", "Invalid action.");

  const user = await c.env.DB
    .prepare(`SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(id)
    .first<{ id: number }>();
  if (!user) throw new APIError("NOT_FOUND", "User not found.");

  const days = Number.isInteger(body.suspendDays) && (body.suspendDays as number) > 0 ? (body.suspendDays as number) : 0;
  const adminId = c.get("adminUserId") ?? 0;
  let penaltyMsg = "";

  switch (action) {
    case "warn":
      await c.env.DB
        .prepare(`INSERT INTO user_warnings (user_id, admin_id, report_id, report_type, reason) VALUES (?, ?, NULL, 'manual', ?)`)
        .bind(id, adminId, body.reason ?? "관리자 직접 경고")
        .run();
      penaltyMsg = "관리자에 의해 경고가 발급되었습니다.";
      break;
    case "clone_create_ban":
      await c.env.DB.prepare(`UPDATE users SET suspended_until = datetime('now', ?) WHERE id = ?`).bind(`+${days || 30} days`, id).run();
      penaltyMsg = `${days || 30}일간 페르소나 생성이 제한됩니다.`;
      break;
    case "account_ban":
      await c.env.DB.prepare(`UPDATE users SET banned_until = datetime('now', ?) WHERE id = ?`).bind(`+${days || 30} days`, id).run();
      penaltyMsg = `${days || 30}일간 계정 사용이 정지됩니다.`;
      break;
    case "clone_deactivate":
      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = NULL WHERE owner_id = ? AND deletion_state = 'active'`).bind(id).run();
      penaltyMsg = "보유 페르소나가 비활성화되었습니다.";
      break;
    case "clone_delete":
      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(id).run();
      penaltyMsg = "보유 페르소나가 삭제되었습니다.";
      break;
  }

  const row = await c.env.DB
    .prepare(`SELECT suspended_until AS suspendedUntil, banned_until AS bannedUntil FROM users WHERE id = ?`)
    .bind(id)
    .first<{ suspendedUntil: string | null; bannedUntil: string | null }>();

  const fmtKstDate = (ts: string | null): string | null => {
    if (!ts) return null;
    const ms = new Date(ts.replace(" ", "T") + "Z").getTime() + 9 * 3600000;
    if (Number.isNaN(ms)) return null;
    const d = new Date(ms);
    return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
  };

  if (action === "account_ban") {
    const until = fmtKstDate(row?.bannedUntil ?? null);
    if (until) penaltyMsg = `${until}까지 계정 사용이 정지됩니다. (신고 누적)`;
  } else if (action === "clone_create_ban") {
    const until = fmtKstDate(row?.suspendedUntil ?? null);
    if (until) penaltyMsg = `${until}까지 페르소나 생성이 제한됩니다. (신고 누적)`;
  }

  const isDateBased = action === "account_ban" || action === "clone_create_ban";
  const notifyBody = isDateBased
    ? penaltyMsg || body.reason || "회원님에 대한 제재가 적용되었습니다."
    : body.reason || penaltyMsg || "회원님에 대한 제재가 적용되었습니다.";

  await notify(c.env, {
    userId: id,
    type: "moderation",
    title: action === "warn" ? "신고 처리 안내" : "활동 제재 안내",
    body: notifyBody,
    url: "afterlife://reports/received",
    data: { action, manual: true, bannedUntil: row?.bannedUntil ?? null, suspendedUntil: row?.suspendedUntil ?? null },
    skipEmail: true,
  }).catch(() => {});

  return c.json({ ok: true, action, suspendedUntil: row?.suspendedUntil ?? null, bannedUntil: row?.bannedUntil ?? null });
});

admin.get("/reports", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const type = url.searchParams.get("type") ?? "all"; 
  const status = url.searchParams.get("status") ?? ""; 
  const minCount = Number(url.searchParams.get("minCount") ?? 0);
  const maxCount = Number(url.searchParams.get("maxCount") ?? 0);
  const q = (url.searchParams.get("q") ?? "").trim();
  const targetId = Number(url.searchParams.get("targetId") ?? 0); 
  const responsibleUserId = Number(url.searchParams.get("responsibleUserId") ?? 0); 
  const reporterUserId = Number(url.searchParams.get("reporterId") ?? 0); 
  const from = (url.searchParams.get("from") ?? "").trim(); 
  const to = (url.searchParams.get("to") ?? "").trim(); 
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 20)));

  const cloneSql = `
    SELECT 'clone' AS type,
           cr.id AS id,
           cr.user_id AS reporterId,
           ru.name AS reporterName,
           ru.email AS reporterEmail,
           cr.clone_id AS targetId,
           c.name AS targetName,
           c.username AS targetSub,
           c.owner_id AS targetOwnerId,
           co.name AS targetOwnerName,
           cr.reason AS reason,
           cr.status AS status,
           cr.admin_message AS adminMessage,
           cr.reporter_message AS reporterMessage,
           cr.target_message AS targetMessage,
           cr.clone_id AS personaId,
           c.name AS personaName,
           c.owner_id AS responsibleUserId,
           co.name AS responsibleUserName,
           ru.xrun_member_id AS reporterXrunMemberId,
           co.xrun_member_id AS responsibleXrunMemberId,
           co.banned_until AS responsibleBannedUntil,
           co.suspended_until AS responsibleSuspendedUntil,
           NULL AS content,
           cr.created_at AS createdAt,
           cr.reviewed_at AS reviewedAt,
           (SELECT COUNT(*) FROM clone_reports x WHERE x.clone_id = cr.clone_id AND x.status = 'reviewed') AS targetReportCount
      FROM clone_reports cr
      JOIN users ru ON ru.id = cr.user_id
      JOIN clones c ON c.id = cr.clone_id
      LEFT JOIN users co ON co.id = c.owner_id
  `;
  const userSql = `
    SELECT 'user' AS type,
           ur.id AS id,
           ur.reporter_id AS reporterId,
           ru.name AS reporterName,
           ru.email AS reporterEmail,
           ur.target_id AS targetId,
           tu.name AS targetName,
           tu.email AS targetSub,
           NULL AS targetOwnerId,
           NULL AS targetOwnerName,
           ur.reason AS reason,
           ur.status AS status,
           ur.admin_message AS adminMessage,
           ur.reporter_message AS reporterMessage,
           ur.target_message AS targetMessage,
           NULL AS personaId,
           NULL AS personaName,
           ur.target_id AS responsibleUserId,
           tu.name AS responsibleUserName,
           ru.xrun_member_id AS reporterXrunMemberId,
           tu.xrun_member_id AS responsibleXrunMemberId,
           tu.banned_until AS responsibleBannedUntil,
           tu.suspended_until AS responsibleSuspendedUntil,
           NULL AS content,
           ur.created_at AS createdAt,
           ur.reviewed_at AS reviewedAt,
           (SELECT COUNT(*) FROM user_reports x WHERE x.target_id = ur.target_id AND x.status = 'reviewed') AS targetReportCount
      FROM user_reports ur
      JOIN users ru ON ru.id = ur.reporter_id
      JOIN users tu ON tu.id = ur.target_id
  `;

  const commentSql = `
    SELECT 'comment' AS type,
           cmr.id AS id,
           cmr.user_id AS reporterId,
           ru.name AS reporterName,
           ru.email AS reporterEmail,
           cmr.comment_id AS targetId,
           cu.name AS targetName,
           fcc.content AS targetSub,
           cmr.clone_id AS targetOwnerId,
           cc.name AS targetOwnerName,
           cmr.reason AS reason,
           cmr.status AS status,
           cmr.admin_message AS adminMessage,
           cmr.reporter_message AS reporterMessage,
           cmr.target_message AS targetMessage,
           cmr.clone_id AS personaId,
           cc.name AS personaName,
           fcc.user_id AS responsibleUserId,
           cu.name AS responsibleUserName,
           ru.xrun_member_id AS reporterXrunMemberId,
           cu.xrun_member_id AS responsibleXrunMemberId,
           cu.banned_until AS responsibleBannedUntil,
           cu.suspended_until AS responsibleSuspendedUntil,
           fcc.content AS content,
           cmr.created_at AS createdAt,
           cmr.reviewed_at AS reviewedAt,
           (SELECT COUNT(*) FROM comment_reports x WHERE x.comment_id = cmr.comment_id AND x.status = 'reviewed') AS targetReportCount
      FROM comment_reports cmr
      JOIN users ru ON ru.id = cmr.user_id
      LEFT JOIN feed_comments fcc ON fcc.id = cmr.comment_id
      LEFT JOIN users cu ON cu.id = fcc.user_id
      LEFT JOIN clones cc ON cc.id = cmr.clone_id
  `;

  const base =
    type === "clone" ? `(${cloneSql}) AS r`
    : type === "user" ? `(${userSql}) AS r`
    : type === "comment" ? `(${commentSql}) AS r`
    : `(${cloneSql} UNION ALL ${userSql} UNION ALL ${commentSql}) AS r`;

  const where: string[] = ["1=1"];
  const binds: unknown[] = [];
  if (status && ["open", "reviewed", "dismissed", "actioned"].includes(status)) {
    where.push("r.status = ?");
    binds.push(status);
  }
  if (q) {
    where.push(`(
      r.reporterName LIKE ? OR r.reporterEmail LIKE ? OR
      COALESCE(r.targetName,'') LIKE ? OR COALESCE(r.targetSub,'') LIKE ? OR
      COALESCE(r.reason,'') LIKE ?
    )`);
    const pat = `%${q}%`;
    binds.push(pat, pat, pat, pat, pat);
  }
  if (targetId > 0) {
    where.push("r.targetId = ?");
    binds.push(targetId);
  }

  if (responsibleUserId > 0) {
    where.push("r.responsibleUserId = ?");
    binds.push(responsibleUserId);
  }

  if (reporterUserId > 0) {
    where.push("r.reporterId = ?");
    binds.push(reporterUserId);
  }
  if (minCount > 0) {
    where.push("r.targetReportCount >= ?");
    binds.push(minCount);
  }
  if (maxCount > 0) {
    where.push("r.targetReportCount <= ?");
    binds.push(maxCount);
  }
  if (from) {
    where.push("r.createdAt >= ?");
    binds.push(`${from} 00:00:00`);
  }
  if (to) {
    where.push("r.createdAt <= ?");
    binds.push(`${to} 23:59:59`);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM ${base} WHERE ${whereSql}`)
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = (
    await c.env.DB
      .prepare(`SELECT r.* FROM ${base} WHERE ${whereSql} ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`)
      .bind(...binds, limit, offset)
      .all()
  ).results;

  return c.json({ items: rows, total: totalRow?.cnt ?? 0, offset, limit });
});

async function notifyReporterOfReportOutcome(
  c: Context<AppEnv>,
  reportType: "user" | "clone" | "comment",
  reporterId: number | null | undefined,
  status: string,
  reporterMessage: string | null,
): Promise<void> {
  if (!reporterId) return;
  const label =
    status === "reviewed" ? "수락되었어요"
    : status === "dismissed" ? "반려되었어요"
    : status === "actioned" ? "조치되었어요"
    : "처리되었어요";
  const body = reporterMessage?.trim() || `내가 접수한 신고가 ${label}.`;
  await notify(c.env, {
    userId: reporterId,
    type: "moderation",
    title: "내 신고 처리 안내",
    body,

    url: "afterlife://reports/made",
    data: { reportType, status },
    skipEmail: true,
  }).catch(() => {});
}

async function issueReportWarning(
  c: Context<AppEnv>,
  reportType: "user" | "clone" | "comment",
  reportId: number,
  targetUserId: number | null | undefined,
  cloneId: number | null | undefined,
  adminMessage: string | null,
): Promise<number | undefined> {
  if (!targetUserId) return undefined;
  const already = await c.env.DB
    .prepare(`SELECT 1 AS x FROM user_warnings WHERE report_id = ? AND report_type = ? LIMIT 1`)
    .bind(reportId, reportType)
    .first();
  if (!already) {
    const adminId = c.get("adminUserId") ?? 0;
    await c.env.DB
      .prepare(
        `INSERT INTO user_warnings (user_id, admin_id, report_id, report_type, reason) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(targetUserId, adminId, reportId, reportType, adminMessage)
      .run();
  }
  const cnt = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`)
    .bind(targetUserId)
    .first<{ n: number }>();
  const warningCount = cnt?.n ?? 0;
  if (already) return warningCount; 

  void cloneId;
  await notify(c.env, {
    userId: targetUserId,
    type: "moderation",
    title: "신고 처리 안내",
    body: adminMessage || "회원님에 대한 신고가 처리되었습니다.",
    url: "afterlife://reports/received",
    data: { warningCount },
    skipEmail: true,
  }).catch(() => {});

  return warningCount;
}

const CLONE_REPORT_STATUSES = ["open", "reviewed", "dismissed"] as const;
admin.patch("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const body = await c.req
    .json<{ status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string }>()
    .catch(() => ({}) as { status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string });
  const status = body.status ?? "";
  if (!(CLONE_REPORT_STATUSES as readonly string[]).includes(status)) {
    throw new APIError("VALIDATION_FAILED", "Invalid status.");
  }
  const isOpen = status === "open";

  const reporterMessage = isOpen ? null : (body.reporterMessage ?? body.adminMessage ?? null);
  const targetMessage = isOpen ? null : (body.targetMessage ?? body.adminMessage ?? null);

  const adminMessage = targetMessage;

  const reviewedClause = isOpen ? "reviewed_at = NULL" : "reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)";
  const r = await c.env.DB
    .prepare(`UPDATE clone_reports SET status = ?, ${reviewedClause}, admin_message = ?, reporter_message = ?, target_message = ? WHERE id = ?`)
    .bind(status, adminMessage, reporterMessage, targetMessage, id)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Report not found.");

  let warningCount: number | undefined;
  if (status === "reviewed") {
    const owner = await c.env.DB
      .prepare(
        `SELECT cl.owner_id AS ownerId, cr.clone_id AS cloneId FROM clone_reports cr JOIN clones cl ON cl.id = cr.clone_id WHERE cr.id = ?`,
      )
      .bind(id)
      .first<{ ownerId: number; cloneId: number }>();
    warningCount = await issueReportWarning(c, "clone", id, owner?.ownerId, owner?.cloneId, adminMessage);
  }

  if (!isOpen) {
    const rep = await c.env.DB
      .prepare(`SELECT user_id AS reporterId FROM clone_reports WHERE id = ?`)
      .bind(id)
      .first<{ reporterId: number | null }>();
    await notifyReporterOfReportOutcome(c, "clone", rep?.reporterId, status, reporterMessage);
  }
  return c.json({ ok: true, id, status, adminMessage, warningCount });
});
admin.delete("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM clone_reports WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Report not found.");
  return c.json({ ok: true, id });
});

const USER_REPORT_STATUSES = ["open", "reviewed", "dismissed", "actioned"] as const;
admin.patch("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const body = await c.req
    .json<{ status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string }>()
    .catch(() => ({}) as { status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string });
  const status = body.status ?? "";
  if (!(USER_REPORT_STATUSES as readonly string[]).includes(status)) {
    throw new APIError("VALIDATION_FAILED", "Invalid status.");
  }
  const isOpen = status === "open";

  const reporterMessage = isOpen ? null : (body.reporterMessage ?? body.adminMessage ?? null);
  const targetMessage = isOpen ? null : (body.targetMessage ?? body.adminMessage ?? null);

  const adminMessage = targetMessage;

  const reviewedClause = isOpen ? "reviewed_at = NULL" : "reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)";
  const r = await c.env.DB
    .prepare(`UPDATE user_reports SET status = ?, ${reviewedClause}, admin_message = ?, reporter_message = ?, target_message = ? WHERE id = ?`)
    .bind(status, adminMessage, reporterMessage, targetMessage, id)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Report not found.");

  let warningCount: number | undefined;
  if (status === "reviewed") {
    const rep = await c.env.DB
      .prepare(`SELECT target_id AS targetId FROM user_reports WHERE id = ?`)
      .bind(id)
      .first<{ targetId: number }>();
    warningCount = await issueReportWarning(c, "user", id, rep?.targetId, null, adminMessage);
  }

  if (!isOpen) {
    const rep = await c.env.DB
      .prepare(`SELECT reporter_id AS reporterId FROM user_reports WHERE id = ?`)
      .bind(id)
      .first<{ reporterId: number | null }>();
    await notifyReporterOfReportOutcome(c, "user", rep?.reporterId, status, reporterMessage);
  }
  return c.json({ ok: true, id, status, adminMessage, warningCount });
});
admin.delete("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM user_reports WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Report not found.");
  return c.json({ ok: true, id });
});

const COMMENT_REPORT_STATUSES = ["open", "reviewed", "dismissed"] as const;
admin.patch("/comments/reports/:id", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const body = await c.req
    .json<{ status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string }>()
    .catch(() => ({}) as { status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string });
  const status = body.status ?? "";
  if (!(COMMENT_REPORT_STATUSES as readonly string[]).includes(status)) {
    throw new APIError("VALIDATION_FAILED", "Invalid status.");
  }
  const isOpen = status === "open";

  const reporterMessage = isOpen ? null : (body.reporterMessage ?? body.adminMessage ?? null);
  const targetMessage = isOpen ? null : (body.targetMessage ?? body.adminMessage ?? null);

  const adminMessage = targetMessage;

  const reviewedClause = isOpen ? "reviewed_at = NULL" : "reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)";
  const r = await c.env.DB
    .prepare(`UPDATE comment_reports SET status = ?, ${reviewedClause}, admin_message = ?, reporter_message = ?, target_message = ? WHERE id = ?`)
    .bind(status, adminMessage, reporterMessage, targetMessage, id)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Report not found.");

  let warningCount: number | undefined;
  if (status === "reviewed") {
    const author = await c.env.DB
      .prepare(`SELECT user_id AS authorId FROM feed_comments WHERE id = (SELECT comment_id FROM comment_reports WHERE id = ?)`)
      .bind(id)
      .first<{ authorId: number }>();
    const cmrClone = await c.env.DB
      .prepare(`SELECT clone_id AS cloneId FROM comment_reports WHERE id = ?`)
      .bind(id)
      .first<{ cloneId: number }>();
    warningCount = await issueReportWarning(c, "comment", id, author?.authorId, cmrClone?.cloneId, adminMessage);
  }

  if (!isOpen) {
    const rep = await c.env.DB
      .prepare(`SELECT user_id AS reporterId FROM comment_reports WHERE id = ?`)
      .bind(id)
      .first<{ reporterId: number | null }>();
    await notifyReporterOfReportOutcome(c, "comment", rep?.reporterId, status, reporterMessage);
  }
  return c.json({ ok: true, id, status, adminMessage, warningCount });
});
admin.delete("/comments/reports/:id", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM comment_reports WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Report not found.");
  return c.json({ ok: true, id });
});

function parseSubListParams(c: { req: { url: string } }) {
  const url = new URL(c.req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 20)));
  return { q, offset, limit };
}

admin.get("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  const { q, offset, limit } = parseSubListParams(c);

  const commentType = new URL(c.req.url).searchParams.get("commentType") ?? "all";

  const where: string[] = ["f.clone_id = ?"];
  const binds: unknown[] = [cloneId];
  if (commentType === "parent") where.push("fcc.parent_comment_id IS NULL");
  else if (commentType === "reply") where.push("fcc.parent_comment_id IS NOT NULL");
  if (q) {
    where.push(`(u.name LIKE ? OR u.email LIKE ? OR fcc.content LIKE ?)`);
    const pat = `%${q}%`;
    binds.push(pat, pat, pat);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM feed_comments fcc JOIN feeds f ON f.id = fcc.feed_id JOIN users u ON u.id = fcc.user_id WHERE ${whereSql}`)
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = await c.env.DB
    .prepare(
      `SELECT fcc.id, fcc.feed_id AS feedId, fcc.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              fcc.content, fcc.created_at AS createdAt,
              fcc.likes_count AS likeCount,
              fcc.parent_comment_id AS parentId,
              pu.name AS parentUserName,
              pc.content AS parentContent,
              (SELECT COUNT(*) FROM feed_comments r WHERE r.parent_comment_id = fcc.id) AS replyCount,
              (SELECT COUNT(*) FROM comment_reports cr WHERE cr.comment_id = fcc.id) AS reportCount,
              (SELECT cr.status FROM comment_reports cr WHERE cr.comment_id = fcc.id
                 ORDER BY (cr.status = 'reviewed') DESC, cr.created_at DESC LIMIT 1) AS reportStatus
         FROM feed_comments fcc
         JOIN feeds f ON f.id = fcc.feed_id
         JOIN users u ON u.id = fcc.user_id
         LEFT JOIN feed_comments pc ON pc.id = fcc.parent_comment_id
         LEFT JOIN users pu ON pu.id = pc.user_id
        WHERE ${whereSql}
        ORDER BY fcc.created_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all();
  return c.json({ items: rows.results, total: totalRow?.cnt ?? 0, offset, limit });
});
admin.delete("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM feed_comments WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Comment not found.");
  return c.json({ ok: true, id });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  const { q, offset, limit } = parseSubListParams(c);

  const where: string[] = ["f.clone_id = ?"];
  const binds: unknown[] = [cloneId];
  if (q) {
    where.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    const pat = `%${q}%`;
    binds.push(pat, pat);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM feed_likes fl JOIN feeds f ON f.id = fl.feed_id JOIN users u ON u.id = fl.user_id WHERE ${whereSql}`)
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = await c.env.DB
    .prepare(
      `SELECT fl.id, fl.feed_id AS feedId, fl.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              fl.created_at AS createdAt
         FROM feed_likes fl
         JOIN feeds f ON f.id = fl.feed_id
         JOIN users u ON u.id = fl.user_id
        WHERE ${whereSql}
        ORDER BY fl.created_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all();
  return c.json({ items: rows.results, total: totalRow?.cnt ?? 0, offset, limit });
});
admin.delete("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM feed_likes WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Like not found.");
  return c.json({ ok: true, id });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  const { q, offset, limit } = parseSubListParams(c);

  const where: string[] = ["cf.clone_id = ?"];
  const binds: unknown[] = [cloneId];
  if (q) {
    where.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    const pat = `%${q}%`;
    binds.push(pat, pat);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM clone_follows cf JOIN users u ON u.id = cf.user_id WHERE ${whereSql}`)
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = await c.env.DB
    .prepare(
      `SELECT cf.id, cf.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              cf.created_at AS createdAt
         FROM clone_follows cf
         JOIN users u ON u.id = cf.user_id
        WHERE ${whereSql}
        ORDER BY cf.created_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all();
  return c.json({ items: rows.results, total: totalRow?.cnt ?? 0, offset, limit });
});
admin.delete("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM clone_follows WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Follow not found.");
  return c.json({ ok: true, id });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  const { q, offset, limit } = parseSubListParams(c);

  const where: string[] = ["uci.clone_id = ?"];
  const binds: unknown[] = [cloneId];
  if (q) {
    where.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    const pat = `%${q}%`;
    binds.push(pat, pat);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM user_clone_interactions uci JOIN users u ON u.id = uci.user_id WHERE ${whereSql}`)
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = await c.env.DB
    .prepare(
      `SELECT uci.id, uci.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              uci.chat_count AS chatCount,
              uci.call_count AS callCount,
              uci.learn_count AS learnCount,
              uci.feed_count AS feedCount,
              uci.last_at AS lastAt
         FROM user_clone_interactions uci
         JOIN users u ON u.id = uci.user_id
        WHERE ${whereSql}
        ORDER BY uci.last_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all();
  return c.json({ items: rows.results, total: totalRow?.cnt ?? 0, offset, limit });
});
admin.delete("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid id.");
  const r = await c.env.DB.prepare(`DELETE FROM user_clone_interactions WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Interaction not found.");
  return c.json({ ok: true, id });
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

