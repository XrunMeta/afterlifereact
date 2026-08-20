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
  getGiftCatalog,
  setGiftCatalog,
  getSignupFreeCredits,
  setSignupFreeCredits,
  getSystemFunctionConfig,
  setSystemFunctionConfig,
  isValidSemver,
  type GiftCatalogItem,
  type ServerStatus,
} from "../lib/appConfig";

export const admin = new Hono<AppEnv>();

admin.get("/health", (c) => c.json({ ok: true, module: "admin" }));

const VALID_SERVER_STATUS = new Set<ServerStatus>(["running", "maintenance", "stopped"]);
admin.get("/system/function-config", requireAdmin, async (c) => {
  const cfg = await getSystemFunctionConfig(c.env);
  return c.json(cfg);
});
admin.patch("/system/function-config", requireAdmin, async (c) => {
  const body = await c.req.json<{
    serverStatus?: unknown;
    minVersionIos?: unknown;
    minVersionAndroid?: unknown;
  }>().catch(() => ({} as { serverStatus?: unknown; minVersionIos?: unknown; minVersionAndroid?: unknown }));

  const patch: {
    serverStatus?: ServerStatus;
    minVersionIos?: string;
    minVersionAndroid?: string;
  } = {};

  if (body.serverStatus !== undefined) {
    if (typeof body.serverStatus !== "string" || !VALID_SERVER_STATUS.has(body.serverStatus as ServerStatus)) {
      throw new APIError(
        "VALIDATION_FAILED",
        "serverStatus must be one of running|maintenance|stopped.",
      );
    }
    patch.serverStatus = body.serverStatus as ServerStatus;
  }
  if (body.minVersionIos !== undefined) {
    if (typeof body.minVersionIos !== "string" || !isValidSemver(body.minVersionIos)) {
      throw new APIError("VALIDATION_FAILED", "minVersionIos must be empty or X.Y.Z (digits).");
    }
    patch.minVersionIos = body.minVersionIos;
  }
  if (body.minVersionAndroid !== undefined) {
    if (typeof body.minVersionAndroid !== "string" || !isValidSemver(body.minVersionAndroid)) {
      throw new APIError("VALIDATION_FAILED", "minVersionAndroid must be empty or X.Y.Z (digits).");
    }
    patch.minVersionAndroid = body.minVersionAndroid;
  }
  if (Object.keys(patch).length === 0) {
    throw new APIError("VALIDATION_FAILED", "No fields to update.");
  }
  const cfg = await setSystemFunctionConfig(c.env, patch);
  return c.json({ ok: true, ...cfg });
});

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

const SIGNUP_FREE_CREDITS_LIMIT = 600000; 
admin.get("/config/signup-free-credits", requireAdmin, async (c) => {
  const credits = await getSignupFreeCredits(c.env);
  return c.json({ credits });
});
admin.patch("/config/signup-free-credits", requireAdmin, async (c) => {
  const body = await c.req.json<{ credits?: unknown }>().catch(() => ({} as { credits?: unknown }));
  const n = Number(body.credits);
  if (!Number.isFinite(n) || n < 0 || n > SIGNUP_FREE_CREDITS_LIMIT) {
    throw new APIError(
      "VALIDATION_FAILED",
      `credits must be an integer between 0 and ${SIGNUP_FREE_CREDITS_LIMIT}.`,
    );
  }
  const credits = Math.floor(n);
  await setSignupFreeCredits(c.env, credits);
  return c.json({ ok: true, credits });
});

const KNOWLEDGE_RULES_MAX = 16000;
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

const GIFT_CATALOG_MAX_ITEMS = 200;
admin.get("/config/gift-catalog", requireAdmin, async (c) => {
  const items = await getGiftCatalog(c.env);
  return c.json({ items });
});
admin.patch("/config/gift-catalog", requireAdmin, async (c) => {
  const body = await c.req.json<{ items?: unknown }>().catch(() => ({} as { items?: unknown }));
  if (!Array.isArray(body.items)) {
    throw new APIError("VALIDATION_FAILED", "items must be an array.");
  }
  if (body.items.length > GIFT_CATALOG_MAX_ITEMS) {
    throw new APIError("VALIDATION_FAILED", `too many items (max ${GIFT_CATALOG_MAX_ITEMS}).`);
  }
  const clean: GiftCatalogItem[] = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") {
      throw new APIError("VALIDATION_FAILED", "each item must be an object.");
    }
    const it = raw as Partial<GiftCatalogItem>;
    if (typeof it.id !== "string" || !it.id.trim()) throw new APIError("VALIDATION_FAILED", "id required.");
    if (typeof it.name !== "string" || !it.name.trim()) throw new APIError("VALIDATION_FAILED", "name required.");
    if (typeof it.emoji !== "string" || !it.emoji.trim()) throw new APIError("VALIDATION_FAILED", "emoji required.");
    if (typeof it.price !== "number" || !Number.isFinite(it.price) || it.price < 0) {
      throw new APIError("VALIDATION_FAILED", "price must be non-negative number.");
    }
    const clean1: GiftCatalogItem = {
      id: it.id.trim(),
      name: it.name.trim(),
      emoji: it.emoji.trim(),
      price: it.price,
    };
    if (it.imageUrl !== undefined && it.imageUrl !== null) {
      if (typeof it.imageUrl !== "string") {
        throw new APIError("VALIDATION_FAILED", "imageUrl must be string.");
      }
      const trimmed = it.imageUrl.trim();
      if (trimmed.length > 0) {
        if (trimmed.length > 500) {
          throw new APIError("VALIDATION_FAILED", "imageUrl too long.");
        }
        clean1.imageUrl = trimmed;
      }
    }

    if (it.xrunPrice !== undefined && it.xrunPrice !== null) {
      if (typeof it.xrunPrice !== "number" || !Number.isFinite(it.xrunPrice) || it.xrunPrice < 0) {
        throw new APIError("VALIDATION_FAILED", "xrunPrice must be non-negative number.");
      }
      clean1.xrunPrice = it.xrunPrice;
    }

    if (it.svgaUrl !== undefined && it.svgaUrl !== null) {
      if (typeof it.svgaUrl !== "string") {
        throw new APIError("VALIDATION_FAILED", "svgaUrl must be string.");
      }
      const trimmed = it.svgaUrl.trim();
      if (trimmed.length > 0) {
        if (trimmed.length > 500) {
          throw new APIError("VALIDATION_FAILED", "svgaUrl too long.");
        }
        clean1.svgaUrl = trimmed;
      }
    }
    clean.push(clean1);
  }
  await setGiftCatalog(c.env, clean);
  return c.json({ ok: true, items: clean });
});

admin.get("/call-sessions", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const userId = url.searchParams.get("userId");
  const cloneId = url.searchParams.get("cloneId");
  const q = (url.searchParams.get("q") ?? "").trim();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: string[] = [];
  const binds: (string | number)[] = [];
  if (userId) { where.push("cs.user_id = ?"); binds.push(Number(userId)); }
  if (cloneId) { where.push("cs.clone_id = ?"); binds.push(Number(cloneId)); }
  if (from) { where.push("cs.started_at >= ?"); binds.push(Number(from)); }
  if (to) { where.push("cs.started_at <= ?"); binds.push(Number(to)); }
  if (q) {
    where.push("(u.email LIKE ? OR u.name LIKE ? OR c.name LIKE ? OR cs.call_id LIKE ?)");
    const like = `%${q}%`;
    binds.push(like, like, like, like);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await c.env.DB
    .prepare(
      `SELECT cs.call_id       AS callId,
              cs.user_id       AS userId,
              u.email          AS userEmail,
              u.name           AS userName,
              cs.clone_id      AS cloneId,
              c.name           AS cloneName,
              c.username       AS cloneUsername,
              cs.persona_slug  AS personaSlug,
              cs.started_at    AS startedAt,
              cs.greeted_at    AS greetedAt,
              cs.ended_at      AS endedAt,
              cs.duration_sec  AS durationSec,
              cs.allowed_sec   AS allowedSec,
              cs.billed_sec    AS billedSec,
              cs.unbilled_sec  AS unbilledSec,
              cs.billed_at     AS billedAt
         FROM call_sessions cs
         LEFT JOIN users  u ON u.id = cs.user_id
         LEFT JOIN clones c ON c.id = cs.clone_id
         ${whereSql}
         ORDER BY cs.started_at DESC
         LIMIT ?`,
    )
    .bind(...binds, limit)
    .all<{
      callId: string;
      userId: number;
      userEmail: string | null;
      userName: string | null;
      cloneId: number;
      cloneName: string | null;
      cloneUsername: string | null;
      personaSlug: string | null;
      startedAt: number;
      greetedAt: number | null;
      endedAt: number | null;
      durationSec: number | null;
      allowedSec: number | null;
      billedSec: number | null;
      unbilledSec: number | null;
      billedAt: number | null;
    }>();

  return c.json({ items: rows.results });
});

admin.post("/files/gift-image", requireAdmin, async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw new APIError("VALIDATION_FAILED", "multipart/form-data required.");
  }
  const raw = form.get("file");
  if (
    !raw ||
    typeof raw !== "object" ||
    typeof (raw as { arrayBuffer?: unknown }).arrayBuffer !== "function"
  ) {
    throw new APIError("VALIDATION_FAILED", "Missing 'file' field.");
  }
  const file = raw as {
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };

  const GIFT_IMG_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const GIFT_IMG_MAX_STATIC = 2 * 1024 * 1024; 
  const GIFT_IMG_MAX_GIF = 5 * 1024 * 1024; 
  if (!GIFT_IMG_TYPES.has(file.type)) {
    throw new APIError(
      "VALIDATION_FAILED",
      `Unsupported type: ${file.type}. jpeg/png/webp/gif only.`,
    );
  }
  const maxSize = file.type === "image/gif" ? GIFT_IMG_MAX_GIF : GIFT_IMG_MAX_STATIC;
  if (file.size > maxSize) {
    throw new APIError(
      "VALIDATION_FAILED",
      `File too large (${file.size} bytes). Max ${maxSize} bytes.`,
    );
  }
  const ext =
    file.type === "image/jpeg" ? ".jpg"
    : file.type === "image/png" ? ".png"
    : file.type === "image/gif" ? ".gif"
    : ".webp";
  const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  const r2Key = `uploadedfiles/admin/gift/${t}${rand}${ext}`;
  const buf = await file.arrayBuffer();
  await c.env.R2_ARCHIVE.put(r2Key, buf, {
    httpMetadata: { contentType: file.type },
    customMetadata: { purpose: "gift.catalog", uploader: "admin" },
  });
  const inserted = await c.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, ?, ?, NULL, ?)
       RETURNING id`,
    )
    .bind(r2Key, file.type, file.size, "gift.catalog")
    .first<{ id: number }>();
  if (!inserted) {
    await c.env.R2_ARCHIVE.delete(r2Key);
    throw new APIError("INTERNAL_ERROR", "Failed to register file.");
  }
  const origin = new URL(c.req.url).origin;
  return c.json({
    id: inserted.id,
    url: `${origin}/oth-path${inserted.id}`,
    contentType: file.type,
    sizeBytes: file.size,
  }, 201);
});

admin.post("/files/gift-svga", requireAdmin, async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw new APIError("VALIDATION_FAILED", "multipart/form-data required.");
  }
  const raw = form.get("file");
  if (
    !raw ||
    typeof raw !== "object" ||
    typeof (raw as { arrayBuffer?: unknown }).arrayBuffer !== "function"
  ) {
    throw new APIError("VALIDATION_FAILED", "Missing 'file' field.");
  }
  const file = raw as {
    name?: string;
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };
  const SVGA_MAX = 8 * 1024 * 1024; 
  if (file.size > SVGA_MAX) {
    throw new APIError("VALIDATION_FAILED", `File too large (${file.size} bytes). Max ${SVGA_MAX} bytes.`);
  }
  const filename = (file.name ?? "").toLowerCase();
  if (!filename.endsWith(".svga")) {
    throw new APIError("VALIDATION_FAILED", `Unsupported filename: ${file.name ?? "(none)"}. .svga only.`);
  }
  const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  const r2Key = `uploadedfiles/admin/gift-svga/${t}${rand}.svga`;
  const buf = await file.arrayBuffer();
  const contentType = "application/octet-stream";
  await c.env.R2_ARCHIVE.put(r2Key, buf, {
    httpMetadata: { contentType },
    customMetadata: { purpose: "gift.svga", uploader: "admin" },
  });
  const inserted = await c.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, ?, ?, NULL, ?)
       RETURNING id`,
    )
    .bind(r2Key, contentType, file.size, "gift.svga")
    .first<{ id: number }>();
  if (!inserted) {
    await c.env.R2_ARCHIVE.delete(r2Key);
    throw new APIError("INTERNAL_ERROR", "Failed to register file.");
  }
  const origin = new URL(c.req.url).origin;
  return c.json({
    id: inserted.id,
    url: `${origin}/oth-path${inserted.id}`,
    contentType,
    sizeBytes: file.size,
  }, 201);
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
      `SELECT id, name, name_en, name_ja, name_zh_cn, name_id,
              gender, age_range, description, sort_order, is_active, r2_key, se_key
       FROM voice_presets ORDER BY sort_order ASC, id ASC`,
    )
    .all();
  return c.json({ voices: rows.results ?? [] });
});

const voicePostSchema = z.object({
  name: z.string().min(1).max(80),
  name_en: z.string().max(80).optional(),
  name_ja: z.string().max(80).optional(),
  name_zh_cn: z.string().max(80).optional(),
  name_id: z.string().max(80).optional(),
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
  name_en: z.string().max(80).nullable().optional(),
  name_ja: z.string().max(80).nullable().optional(),
  name_zh_cn: z.string().max(80).nullable().optional(),
  name_id: z.string().max(80).nullable().optional(),
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
      `INSERT INTO voice_presets
         (name, name_en, name_ja, name_zh_cn, name_id,
          gender, age_range, description, sort_order, is_active, r2_key, se_key)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
    )
    .bind(
      b.name,
      b.name_en ?? null,
      b.name_ja ?? null,
      b.name_zh_cn ?? null,
      b.name_id ?? null,
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
    ["name_en", "name_en"],
    ["name_ja", "name_ja"],
    ["name_zh_cn", "name_zh_cn"],
    ["name_id", "name_id"],
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

const cloneModerationReasonSchema = z.object({
  reason: z.string().min(10, "사유는 최소 10자 이상 입력해 주세요.").max(500),
});
const cloneRestoreReasonSchema = z.object({
  reason: z.string().min(10).max(500).optional(),
});

admin.delete("/oth-path", requireAdmin, async (c) => {
  const adminUserId = c.get("adminUserId")!;
  const idRaw = c.req.param("id");
  const cloneId = Number(idRaw);
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }

  let reason: string | null = null;
  try {
    const raw = await c.req.json<{ reason?: unknown }>();
    if (raw && typeof raw.reason === 'string' && raw.reason.trim().length > 0) {
      reason = raw.reason.trim().slice(0, 500);
    }
  } catch {  }
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
              soft_deleted_at = CURRENT_TIMESTAMP,
              deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(cloneId)
    .run();
  await writeDecryptionAudit(c.env.DB, c.env.AUDIT_SECRET, {
    actor: { type: "admin", id: adminUserId },
    op: "soft_delete",
    resourceType: "clone",
    resourceId: cloneId,
    reason,
  });
  return c.json({ ok: true, deletedId: cloneId, deletionState: "soft_deleted" });
});

admin.post("/oth-path", requireSuperAdmin, async (c) => {
  const adminUserId = c.get("adminUserId")!;
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const { reason } = await parseJson(c, cloneModerationReasonSchema);
  const existing = await c.env.DB
    .prepare(`SELECT id, deletion_state, admin_suspended_at FROM clones WHERE id = ?`)
    .bind(cloneId)
    .first<{ id: number; deletion_state: string; admin_suspended_at: string | null }>();
  if (!existing) throw new APIError("NOT_FOUND", "Clone not found.");
  if (existing.deletion_state !== "active") {
    throw new APIError(
      "CONFLICT",
      `Cannot suspend a clone in deletion_state '${existing.deletion_state}'.`,
    );
  }
  if (existing.admin_suspended_at) {
    return c.json({ ok: true, alreadySuspended: true, adminSuspendedAt: existing.admin_suspended_at });
  }
  await c.env.DB
    .prepare(
      `UPDATE clones
          SET admin_suspended_at = CURRENT_TIMESTAMP,
              admin_suspend_reason = ?
        WHERE id = ?`,
    )
    .bind(reason, cloneId)
    .run();
  await writeDecryptionAudit(c.env.DB, c.env.AUDIT_SECRET, {
    actor: { type: "admin", id: adminUserId },
    op: "disable",
    resourceType: "clone",
    resourceId: cloneId,
    reason,
  });
  return c.json({ ok: true, cloneId, suspended: true });
});

admin.post("/oth-path", requireSuperAdmin, async (c) => {
  const adminUserId = c.get("adminUserId")!;
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }

  let reason: string | undefined;
  const rawBody = await c.req.text();
  if (rawBody.trim().length > 0) {
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      throw new APIError("VALIDATION_FAILED", "Invalid JSON body.");
    }
    const parsed = cloneRestoreReasonSchema.safeParse(json);
    if (!parsed.success) {
      throw new APIError("VALIDATION_FAILED", "Body validation failed.", parsed.error.issues);
    }
    reason = parsed.data.reason;
  }
  const existing = await c.env.DB
    .prepare(`SELECT id, deletion_state, admin_suspended_at FROM clones WHERE id = ?`)
    .bind(cloneId)
    .first<{ id: number; deletion_state: string; admin_suspended_at: string | null }>();
  if (!existing) throw new APIError("NOT_FOUND", "Clone not found.");
  if (existing.deletion_state === "hard_deleted" || existing.deletion_state === "archived_cold") {
    throw new APIError("CONFLICT", `Cannot activate from state '${existing.deletion_state}'.`);
  }
  const needsRestore = existing.deletion_state !== "active";
  const needsUnsuspend = existing.admin_suspended_at !== null;
  if (!needsRestore && !needsUnsuspend) {
    return c.json({ ok: true, alreadyActive: true, deletionState: "active" });
  }
  await c.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'active',
              soft_deleted_at = NULL,
              deleted_at = NULL,
              admin_suspended_at = NULL,
              admin_suspend_reason = NULL
        WHERE id = ?`,
    )
    .bind(cloneId)
    .run();
  await writeDecryptionAudit(c.env.DB, c.env.AUDIT_SECRET, {
    actor: { type: "admin", id: adminUserId },
    op: "activate",
    resourceType: "clone",
    resourceId: cloneId,
    reason: reason ?? null,
  });
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
      "SELECT id, name, username, l1_profile FROM clones WHERE id = ?",
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
    .prepare("SELECT l1_profile FROM clones WHERE id = ?")
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
      "UPDATE clones SET l1_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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
            c.deleted_at AS deletedAt,
            c.pipeline
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(id)
    .first();
  if (!row) throw new APIError("NOT_FOUND", "Clone not found.");
  return c.json(row);
});

const adminClonePatchSchema = z.object({
  pipeline: z.enum(["musetalk", "echomimic_v3"]).optional(),
});

admin.patch("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const parsed = adminClonePatchSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    throw new APIError("VALIDATION_FAILED", parsed.error.message);
  }
  const body = parsed.data;

  const row = await c.env.DB
    .prepare(`SELECT id FROM clones WHERE id = ?`)
    .bind(id)
    .first<{ id: number }>();
  if (!row) throw new APIError("NOT_FOUND", "Clone not found.");

  const sets: string[] = [];
  const binds: unknown[] = [];
  if (body.pipeline !== undefined) {
    sets.push(`pipeline = ?`);
    binds.push(body.pipeline);
  }
  if (sets.length === 0) {
    return c.json({ ok: true, updated: 0 });
  }
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  binds.push(id);

  await c.env.DB
    .prepare(`UPDATE clones SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();
  return c.json({ ok: true, updated: sets.length - 1 });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1), 100);
  if (!q) return c.json({ users: [] });
  const like = `%${q}%`;
  const idNum = Number(q);
  const rows = await c.env.DB
    .prepare(
      `SELECT id, name, email, credits, credits_free, credits_sub, credits_topup,
              created_at AS createdAt
         FROM users
        WHERE deleted_at IS NULL
          AND (id = ? OR email LIKE ? OR name LIKE ?)
        ORDER BY id DESC
        LIMIT ?`,
    )
    .bind(Number.isFinite(idNum) ? idNum : -1, like, like, limit)
    .all<Record<string, unknown>>();
  return c.json({ users: rows.results ?? [] });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const user = await c.env.DB
    .prepare(
      `SELECT id, name, email, credits, credits_free, credits_sub, credits_topup
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!user) throw new APIError("NOT_FOUND", "User not found.");

  const inv = await c.env.DB
    .prepare(
      `SELECT gift_id, count, total_received, updated_at
         FROM user_gift_inventory
        WHERE user_id = ? AND count > 0
        ORDER BY updated_at DESC`,
    )
    .bind(id)
    .all<{ gift_id: string; count: number; total_received: number; updated_at: number }>();

  return c.json({ user, inventory: inv.results ?? [] });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const body = (await c.req.json().catch(() => ({}))) as {
    giftId?: unknown; count?: unknown; reason?: unknown;
  };
  const giftId = typeof body.giftId === "string" ? body.giftId.trim() : "";
  const delta = Number(body.count);
  if (!giftId || !Number.isInteger(delta) || delta === 0) {
    throw new APIError("VALIDATION_FAILED", "giftId + integer count(≠0) required.");
  }
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : "admin inject";

  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at)
           VALUES (?, ?, MAX(?, 0), MAX(?, 0), strftime('%s','now'))
         ON CONFLICT(user_id, gift_id) DO UPDATE SET
           count = MAX(count + ?, 0),
           total_received = total_received + MAX(?, 0),
           updated_at = strftime('%s','now')`,
      )
      .bind(userId, giftId, delta, delta, delta, delta),
    c.env.DB
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
           VALUES (?, NULL, ?, ?, 0, ?, ?)`,
      )
      .bind(userId, giftId, Math.abs(delta), delta > 0 ? "received" : "swapped", `admin_inject:${reason}`),
  ]);

  const row = await c.env.DB
    .prepare(`SELECT count, total_received FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?`)
    .bind(userId, giftId)
    .first<{ count: number; total_received: number }>();
  return c.json({ ok: true, giftId, delta, current: row });
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

admin.post("/oth-path", requireAdmin, async (c) => {
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const body = (await c.req.json().catch(() => ({}))) as { seconds?: unknown; reason?: unknown };
  const seconds = Number(body.seconds);
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new APIError("VALIDATION_FAILED", "seconds must be a positive integer.");
  }
  const nowMs = Date.now();
  const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
  const idemKey = `admin:${seconds}:${nowMs}`;
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : "admin grant";

  const ledgerRes = await c.env.DB
    .prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
         VALUES (?, ?, 'admin_grant', ?, ?)
         RETURNING id`,
    )
    .bind(userId, seconds, reason, idemKey)
    .first<{ id: number }>();
  if (!ledgerRes) throw new APIError("INTERNAL_ERROR", "ledger insert failed.");

  await c.env.DB
    .prepare(
      `UPDATE users
          SET credits       = credits + ?,
              credits_topup = credits_topup + ?,
              updated_at    = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(seconds, seconds, userId)
    .run();

  await c.env.DB
    .prepare(
      `INSERT INTO credit_lots (user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(userId, seconds, seconds, nowMs, nowMs + fiveYearsMs, ledgerRes.id)
    .run();

  const row = await c.env.DB
    .prepare(`SELECT credits, credits_topup FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ credits: number; credits_topup: number }>();
  return c.json({ ok: true, granted: seconds, balance: row });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const types: Array<{
    type:
      | "intimacy_score"
      | "clone_like"
      | "clone_comment"
      | "clone_follow"
      | "clone_gift"
      | "user_follow"
      | "followee_new_clone"
      | "moderation"
      | "invite_received";
    title: string;
    body: string;
  }> = [
    { type: "intimacy_score", title: "🌡️ +1°C 온도 상승", body: "테스트 페르소나와의 친밀도가 올랐습니다." },
    { type: "clone_like", title: "👍 좋아요 도착", body: "테스트 사용자가 내 페르소나를 좋아합니다." },
    { type: "clone_comment", title: "💬 댓글 도착", body: "테스트 사용자가 내 페르소나에 댓글을 남겼습니다." },
    { type: "clone_follow", title: "➕ 새 구독자", body: "테스트 사용자가 내 페르소나를 구독했습니다." },
    { type: "clone_gift", title: "🎁 선물 도착", body: "테스트 사용자가 내 페르소나에 선물을 보냈습니다." },
    { type: "user_follow", title: "👤 새 팔로워", body: "테스트 사용자가 나를 팔로우했습니다." },
    { type: "followee_new_clone", title: "✨ 새 페르소나", body: "팔로우한 사용자가 새 페르소나를 만들었습니다." },
    { type: "moderation", title: "⚠️ 제재 알림", body: "테스트 제재 안내." },
    { type: "invite_received", title: "📨 초대 도착", body: "테스트 공동관리자 초대." },
  ];
  const results = [];
  for (const t of types) {
    try {
      const r = await notify(c.env, {
        userId,
        type: t.type,
        title: t.title,
        body: t.body,
        skipEmail: true,
      });
      results.push({
        type: t.type,
        inserted: r.inserted,
        pushAttempted: r.pushAttempted,
        pushSent: r.pushSent,
      });
    } catch (err) {
      results.push({
        type: t.type,
        error: (err as Error).message ?? String(err),
      });
    }
  }
  return c.json({ userId, count: types.length, results });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const body = (await c.req.json().catch(() => ({}))) as { title?: unknown; body?: unknown };
  const title = typeof body.title === "string" && body.title ? body.title : "🧪 테스트 알림";
  const bodyText = typeof body.body === "string" && body.body ? body.body : "관리자가 발송한 테스트 알림입니다.";

  const rows = await c.env.DB
    .prepare(
      `SELECT push_token, platform FROM user_devices
        WHERE user_id = ? AND push_token IS NOT NULL AND is_active = 1`,
    )
    .bind(userId)
    .all<{ push_token: string; platform: string }>();
  const devices = (rows.results ?? []).filter(
    (r) => r.push_token.startsWith("ExponentPushToken[") || r.push_token.startsWith("ExpoPushToken["),
  );
  if (devices.length === 0) {
    return c.json({ attempted: 0, tickets: [], error: "활성 토큰 없음" });
  }
  const messages = devices.map((d) => ({
    to: d.push_token,
    title,
    body: bodyText,
    sound: "default" as const,
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
  const respBody = (await res.json().catch(() => null)) as
    | { data?: Array<{ status?: string; message?: string; details?: { error?: string } }> }
    | null;
  const tickets = devices.map((d, i) => {
    const t = respBody?.data?.[i];
    return {
      tokenPrefix: d.push_token.slice(0, 30),
      platform: d.platform,
      status: t?.status ?? "no-response",
      errorCode: t?.details?.error ?? null,
      message: t?.message ?? null,
    };
  });
  return c.json({ attempted: devices.length, httpStatus: res.status, tickets });
});

admin.get("/oth-path", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const rows = await c.env.DB.prepare(
    `SELECT device_id AS deviceId,
            platform,
            SUBSTR(push_token, 1, 24) AS pushTokenPrefix,
            LENGTH(push_token) AS pushTokenLength,
            is_active AS isActive,
            last_active_at AS lastActiveAt,
            created_at AS createdAt
       FROM user_devices
      WHERE user_id = ?
      ORDER BY last_active_at DESC`,
  )
    .bind(id)
    .all();
  return c.json({ userId: id, devices: rows.results });
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
  const body = await c.req
    .json<{ action?: string; reason?: string }>()
    .catch(() => ({}) as { action?: string; reason?: string });
  const VALID = ["clone_create_ban_lift", "account_ban_lift", "clone_restore", "account_restore", "warnings_clear"];
  const action = body.action ?? "";
  if (!VALID.includes(action)) throw new APIError("VALIDATION_FAILED", "Invalid action.");

  let msg = "";
  switch (action) {
    case "clone_create_ban_lift":
      await c.env.DB.prepare(`UPDATE users SET suspended_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
      msg = "페르소나 생성 제한이 해제되었습니다.";
      break;
    case "account_ban_lift":
      await c.env.DB.prepare(`UPDATE users SET banned_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
      msg = "계정 사용 제한이 해제되었습니다.";
      break;
    case "clone_restore":

      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'soft_deleted'`).bind(id).run();
      msg = "페르소나가 복구되었습니다.";
      break;
    case "account_restore":

      await c.env.DB.prepare(`UPDATE users SET deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'soft_deleted'`).bind(id).run();
      msg = "계정과 페르소나가 복구되었습니다.";
      break;
    case "warnings_clear":
      await c.env.DB.prepare(`DELETE FROM user_warnings WHERE user_id = ?`).bind(id).run();
      msg = "경고 이력이 초기화되었습니다.";
      break;
  }

  await notify(c.env, {
    userId: id,
    type: "moderation",
    title: "제재 해제 안내",
    body: body.reason?.trim() || msg,
    url: "afterlife://reports/received",
    data: { action, manual: true, kind: "lift" },
    skipEmail: true,
  }).catch(() => {});

  return c.json({ ok: true, action, message: msg });
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
    .json<{ action?: string; suspendDays?: number | null; reason?: string; reportId?: number | null; reporterMessage?: string }>()
    .catch(() => ({}) as { action?: string; suspendDays?: number | null; reason?: string; reportId?: number | null; reporterMessage?: string });
  const VALID = [
    "warn",
    "clone_deactivate",
    "clone_delete",
    "clone_create_ban",
    "account_ban",
    "account_withdraw",

    "comment_ban",
    "interaction_ban",
    "force_logout",
    "notify_only",
  ];
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

      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = NULL, deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(id).run();
      penaltyMsg = "보유 페르소나가 비활성화되었습니다.";
      break;
    case "clone_delete":
      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(id).run();
      penaltyMsg = "보유 페르소나가 삭제되었습니다.";
      break;
    case "account_withdraw":

      await c.env.DB.prepare(`UPDATE users SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
      await c.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(id).run();
      penaltyMsg = "관리자에 의해 계정이 강제 탈퇴 처리되었습니다.";
      break;

    case "comment_ban":
      await c.env.DB.prepare(`UPDATE users SET comment_ban_until = datetime('now', ?) WHERE id = ?`).bind(`+${days || 30} days`, id).run();
      penaltyMsg = `${days || 30}일간 댓글 작성이 제한됩니다.`;
      break;
    case "interaction_ban":
      await c.env.DB.prepare(`UPDATE users SET interaction_ban_until = datetime('now', ?) WHERE id = ?`).bind(`+${days || 30} days`, id).run();
      penaltyMsg = `${days || 30}일간 좋아요·팔로우가 제한됩니다.`;
      break;
    case "force_logout":

      await c.env.DB.prepare(`UPDATE users SET session_epoch = session_epoch + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
      penaltyMsg = "모든 기기에서 로그아웃되었습니다. 다시 로그인해 주세요.";
      break;
    case "notify_only":

      penaltyMsg = body.reason?.trim() || "관리자로부터 안내가 도착했습니다.";
      break;
  }

  const row = await c.env.DB
    .prepare(`SELECT suspended_until AS suspendedUntil, banned_until AS bannedUntil, comment_ban_until AS commentBanUntil, interaction_ban_until AS interactionBanUntil FROM users WHERE id = ?`)
    .bind(id)
    .first<{ suspendedUntil: string | null; bannedUntil: string | null; commentBanUntil: string | null; interactionBanUntil: string | null }>();

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
  } else if (action === "comment_ban") {
    const until = fmtKstDate(row?.commentBanUntil ?? null);
    if (until) penaltyMsg = `${until}까지 댓글 작성이 제한됩니다. (신고 누적)`;
  } else if (action === "interaction_ban") {
    const until = fmtKstDate(row?.interactionBanUntil ?? null);
    if (until) penaltyMsg = `${until}까지 좋아요·팔로우가 제한됩니다. (신고 누적)`;
  }

  const isDateBased =
    action === "account_ban" || action === "clone_create_ban" || action === "comment_ban" || action === "interaction_ban";
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

  const ACTION_LABEL: Record<string, string> = {
    warn: "경고 발급",
    clone_deactivate: "페르소나 비활성화",
    clone_delete: "페르소나 삭제",
    clone_create_ban: "페르소나 생성 제한",
    account_ban: "계정 사용 정지",
    account_withdraw: "계정 강제 탈퇴",
  };
  const actionLabel = ACTION_LABEL[action] ?? "제재 적용";
  const reporterMsg =
    body.reporterMessage?.trim() ||
    `회원님의 신고가 수락되었습니다. 적용된 조치: ${actionLabel}.`;
  if (body.reportId && Number.isInteger(body.reportId) && (body.reportId as number) > 0) {

    const rep = await c.env.DB
      .prepare(
        `UPDATE user_reports
            SET status = 'actioned',
                reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
                reviewer_admin_id = COALESCE(reviewer_admin_id, ?),
                admin_message = ?
          WHERE id = ? AND status IN ('open','reviewed')
          RETURNING reporter_id AS reporterId`,
      )
      .bind(adminId, reporterMsg, body.reportId)
      .first<{ reporterId: number }>();
    if (rep?.reporterId) {

      await notify(c.env, {
        userId: rep.reporterId,
        type: "moderation",
        title: "신고 처리 완료",
        body: reporterMsg,
        url: "afterlife://reports/made",
        data: { action, reportId: body.reportId, kind: "user_report_actioned" },
        skipEmail: true,
      }).catch(() => {});
    }
  }

  return c.json({ ok: true, action, suspendedUntil: row?.suspendedUntil ?? null, bannedUntil: row?.bannedUntil ?? null, message: penaltyMsg });
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

admin.get("/intimacy-events", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const userIdStr = url.searchParams.get("userId");
  const cloneIdStr = url.searchParams.get("cloneId");
  const action = (url.searchParams.get("action") ?? "").trim();
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));

  const where: string[] = [];
  const binds: (string | number)[] = [];
  if (userIdStr && /^\d+$/.test(userIdStr)) {
    where.push("ie.user_id = ?");
    binds.push(Number(userIdStr));
  }
  if (cloneIdStr && /^\d+$/.test(cloneIdStr)) {
    where.push("ie.clone_id = ?");
    binds.push(Number(cloneIdStr));
  }
  if (action && ["chat", "call", "learn", "feed"].includes(action)) {
    where.push("ie.action = ?");
    binds.push(action);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM intimacy_events ie ${whereSql}`)
    .bind(...binds)
    .first<{ n: number }>();
  const total = totalRow?.n ?? 0;

  const rows = await c.env.DB
    .prepare(
      `SELECT ie.id           AS id,
              ie.created_at   AS createdAt,
              ie.user_id      AS userId,
              u.email         AS userEmail,
              ie.clone_id     AS cloneId,
              c.name          AS cloneName,
              ie.action       AS action,
              ie.score        AS score,
              ie.feed_id      AS feedId
         FROM intimacy_events ie
         LEFT JOIN users u ON u.id = ie.user_id
         LEFT JOIN clones c ON c.id = ie.clone_id
         ${whereSql}
        ORDER BY ie.created_at DESC, ie.id DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all();

  return c.json({ items: rows.results, total, limit, offset });
});

admin.get("/conversations", requireAdmin, async (c) => {
  const userEmail = c.req.query("user_email");
  if (!userEmail) {
    return c.json({ error: "user_email query required" }, 400);
  }

  const userRow = await c.env.DB
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind(userEmail)
    .first<{ id: number }>();
  if (!userRow) {
    return c.json({ user_id: null, clones: [] });
  }
  const userId = userRow.id;

  const cloneRows = await c.env.DB
    .prepare(
      `SELECT id, name, created_at
         FROM clones
        WHERE owner_id = ? AND deleted_at IS NULL
        ORDER BY id DESC`,
    )
    .bind(userId)
    .all<{ id: number; name: string; created_at: string }>();
  const clones = cloneRows.results ?? [];

  const prethirdBase = "https://rtc.example.invalid/prethird";
  const secret = c.env.LEARN_SECRET ?? "";
  const results = await Promise.all(
    clones.map(async (clone) => {
      try {
        const resp = await fetch(`${prethirdBase}/oth-path${clone.id}`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        if (!resp.ok) {
          return { ...clone, items: [], error: `HTTP ${resp.status}` };
        }
        const body = (await resp.json()) as { items?: unknown[]; count?: number };
        return { ...clone, items: body.items ?? [], count: body.count ?? 0 };
      } catch (err) {
        return { ...clone, items: [], error: String(err) };
      }
    }),
  );

  return c.json({ user_id: userId, user_email: userEmail, clones: results });
});

admin.post("/oth-path", requireAdmin, async (c) => {
  const cid = Number(c.req.param("id"));
  if (!Number.isFinite(cid)) {
    return c.json({ error: "invalid clone id" }, 400);
  }
  const body = await c.req.json<{ text?: string }>().catch(() => ({} as { text?: string }));
  const text = (body.text ?? "").trim();
  if (!text) return c.json({ error: "text required" }, 400);
  if (text.length > 500) return c.json({ error: "text too long (max 500)" }, 400);

  const clone = await c.env.DB
    .prepare("SELECT voice_se_url, voice_preset_id FROM clones WHERE id = ?")
    .bind(cid)
    .first<{ voice_se_url: string | null; voice_preset_id: number | null }>();
  if (!clone) return c.json({ error: "clone not found" }, 404);

  let seKey: string | null = null;
  if (clone.voice_preset_id) {
    const preset = await c.env.DB
      .prepare("SELECT se_key FROM voice_presets WHERE id = ? AND is_active = 1")
      .bind(clone.voice_preset_id)
      .first<{ se_key: string | null }>();
    seKey = preset?.se_key ?? null;
  }
  if (!seKey && !clone.voice_se_url) {
    return c.json({ error: "clone has no voice_se available" }, 404);
  }

  const secret = c.env.LEARN_SECRET ?? "";
  if (!secret) return c.json({ error: "LEARN_SECRET not configured" }, 500);
  try {
    const payload: Record<string, unknown> = { text, clone_id: cid };
    if (seKey) payload.se_key = seKey;
    if (clone.voice_se_url) payload.voice_se_url = clone.voice_se_url;
    const resp = await fetch("https://rtc.example.invalid/prethird/admin/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": secret,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      return c.json(
        { error: `prethird ${resp.status}: ${errBody.slice(0, 200)}` },
        resp.status as 400 | 500,
      );
    }
    const wav = await resp.arrayBuffer();
    return new Response(wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return c.json({ error: `upstream: ${String(e)}` }, 502);
  }
});

