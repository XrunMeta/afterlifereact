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

