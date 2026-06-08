import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_09b071 } from "../scheduled/cleanup";
import { v_c0a297, v_b09138 } from "../middleware/auth";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_a8614b, v_137694, v_dfbdd9, v_9eaae0, v_85de88, v_8ea38c } from "../lib/ale";
import { v_e44d97 } from "../lib/kekProvider";
import { v_e56fb3 } from "../lib/auditChain";
import { v_b60bdd } from "../lib/systemPersona";
import { v_0b44ec, v_02d529 } from "../lib/personaQuestions";

export const v_b7f2b4 = new v_b7c41b<v_de0a25>();

v_b7f2b4.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "admin" }));

const v_c325e5 = v_1f4ea7.object({
  resourceType: v_1f4ea7.enum(["message.content", "user.phone", "user.age"]),
  resourceId: v_1f4ea7.number().int().positive(),
  reason: v_1f4ea7.string().min(10).max(500), 
  ticketId: v_1f4ea7.string().max(128).optional(),
});

interface ResourceFetch {
  blob: string | null;
  aleContext: string;
}

async function v_93d251(
  v_a1651b,
  resourceType: v_1f4ea7.infer<typeof v_c325e5>["resourceType"],
  v_ca7092,
): Promise<ResourceFetch | null> {
  if (v_623f9b === "message.content") {
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT content, clone_id FROM messages WHERE id = ?`)
      .bind(v_ca7092)
      .first<{ content: string | null; clone_id: number | null }>();
    if (!v_3ac7e7) return null;
    return {
      blob: v_3ac7e7.content,
      aleContext: `msg:${v_3ac7e7.clone_id ?? "unknown"}`,
    };
  }
  if (v_623f9b === "user.phone") {
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT phone FROM users WHERE id = ?`)
      .bind(v_ca7092)
      .first<{ phone: string | null }>();
    if (!v_3ac7e7) return null;
    return { blob: v_3ac7e7.phone, aleContext: "user.phone" };
  }
  if (v_623f9b === "user.age") {
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT age_enc FROM users WHERE id = ?`)
      .bind(v_ca7092)
      .first<{ age_enc: string | null }>();
    if (!v_3ac7e7) return null;
    return { blob: v_3ac7e7.age_enc, aleContext: "user.age" };
  }
  return null;
}

function v_658bbe(
  v_623f9b,
  v_ca7092,
): { key: "users.phone" | "users.age_enc" | "messages.content"; resourceId: number } | undefined {
  if (v_623f9b === "user.phone") return { key: "users.phone", resourceId: v_ca7092 };
  if (v_623f9b === "user.age") return { key: "users.age_enc", resourceId: v_ca7092 };
  if (v_623f9b === "message.content") return { key: "messages.content", resourceId: v_ca7092 };
  return undefined;
}

v_b7f2b4.post("/decryption/open", v_c0a297, async (v_3f4e2e) => {
  const v_db9be1 = v_3f4e2e.get("adminUserId");
  if (!v_db9be1) throw new v_3ebe58("UNAUTHENTICATED", "Admin identity missing.");
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_c325e5);

  const v_cee2c7 = await v_93d251(v_3f4e2e.env.DB, v_4d33b2.resourceType, v_4d33b2.resourceId);
  if (!v_cee2c7) throw new v_3ebe58("NOT_FOUND", "Resource not found.");
  if (!v_cee2c7.blob) {

    return v_3f4e2e.json({ ok: false, reason: "EMPTY_OR_PURGED" }, 410);
  }

  const v_c42fdd = v_3f4e2e.env.LAZY_ROTATION_ENABLED === "1";
  const v_0e1851 = v_cee2c7.blob.split(".")[0];
  let v_9db068;
  try {
    if (v_0e1851 === "v3") {
      const v_e38ca2 = await v_e44d97(v_3f4e2e);
      v_9db068 = await v_dfbdd9(v_3f4e2e.env.DB, v_cee2c7.blob, v_e38ca2, { lazyRotationEnabled: v_c42fdd });
    } else {

      const v_d205b7 = v_a8614b(v_3f4e2e.env.ALE_KEK);
      const v_67b8fb = await v_e44d97(v_3f4e2e);
      const v_9ecdb9 = v_658bbe(v_4d33b2.resourceType, v_4d33b2.resourceId);
      v_9db068 = await v_137694(v_cee2c7.blob, {
        db: v_3f4e2e.env.DB,
        hkdfContext: v_cee2c7.aleContext,
        legacyProvider: v_d205b7,
        v3Provider: v_67b8fb,
        actor: { type: "admin", id: v_db9be1 },
        auditSecret: v_3f4e2e.env.AUDIT_SECRET,
        lazyMigrateEnabled: v_3f4e2e.env.LAZY_V2_MIGRATE_ENABLED === "1",
        hint: v_9ecdb9,
      });
    }
  } catch (v_49263d) {
    if ((v_49263d as { code?: string }).code === "SHREDDED") {
      throw v_49263d;
    }
    throw new v_3ebe58("INTERNAL_ERROR", `Decryption failed: ${(v_49263d as Error).message}`);
  }

  await v_e56fb3(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    actor: { type: "admin", id: v_db9be1 },
    op: "decrypt",
    resourceType: v_4d33b2.resourceType,
    resourceId: v_4d33b2.resourceId,
    reason: v_4d33b2.reason,
    ticketId: v_4d33b2.ticketId ?? null,
  });

  return v_3f4e2e.json({
    ok: true,
    resourceType: v_4d33b2.resourceType,
    resourceId: v_4d33b2.resourceId,
    version: v_0e1851,
    plaintext: v_9db068,
  });
});

v_b7f2b4.get("/decryption/audit", v_c0a297, async (v_3f4e2e) => {
  const v_623f9b = v_3f4e2e.req.query("resourceType");
  const v_ca7092 = v_3f4e2e.req.query("resourceId");
  const v_b80e8b = v_3f4e2e.req.query("actorId");
  const v_02be30 = Math.min(Number(v_3f4e2e.req.query("limit") ?? 50), 200);

  const v_abcc8d = [];
  const v_925171 = [];
  if (v_623f9b) {
    v_abcc8d.push("resource_type = ?");
    v_925171.push(v_623f9b);
  }
  if (v_ca7092) {
    v_abcc8d.push("resource_id = ?");
    v_925171.push(v_ca7092);
  }
  if (v_b80e8b) {
    v_abcc8d.push("actor_id = ?");
    v_925171.push(v_b80e8b);
  }
  const v_8b4d7e = v_abcc8d.length ? `WHERE ${v_abcc8d.join(" AND ")}` : "";

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, actor_type AS actorType, actor_id AS actorId, ticket_id AS ticketId,
                op, resource_type AS resourceType, resource_id AS resourceId,
                reason, ts
           FROM decryption_audit_log
          ${v_8b4d7e}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30)
      .all()
  ).results;

  return v_3f4e2e.json({ entries: v_18b8bf });
});

v_b7f2b4.post("/cleanup/run", async (v_3f4e2e) => {
  const v_21cc31 = v_3f4e2e.req.header("X-Admin-Cron-Token");
  const v_505a6d = (v_3f4e2e.env as unknown as { ADMIN_CRON_TOKEN?: string }).ADMIN_CRON_TOKEN;
  if (!v_505a6d || !v_21cc31 || v_21cc31 !== v_505a6d) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }
  const v_43c42e = await v_09b071(v_3f4e2e.env);
  return v_3f4e2e.json(v_43c42e);
});

v_b7f2b4.post("/_dev/seal-v3", async (v_3f4e2e) => {
  if (!v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN || v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new v_3ebe58("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const v_4d33b2 = await v_3f4e2e.req.json<{
    token: string;
    resourceType: string;
    resourceId: string;
    plaintext: string;
  }>();
  if (v_4d33b2.token !== v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }
  const v_e38ca2 = await v_e44d97(v_3f4e2e);
  const v_3263c7 = await v_9eaae0(
    v_3f4e2e.env.DB,
    v_4d33b2.plaintext,
    v_e38ca2,
    { type: v_4d33b2.resourceType, id: v_4d33b2.resourceId },
  );
  return v_3f4e2e.json({ blob: v_3263c7, dekId: v_8ea38c(v_3263c7) }, 201);
});

v_b7f2b4.post("/_dev/seal-v2", async (v_3f4e2e) => {
  if (!v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN || v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new v_3ebe58("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const v_4d33b2 = await v_3f4e2e.req.json<{
    token: string;
    hkdfContext: string;
    plaintext: string;
  }>();
  if (v_4d33b2.token !== v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }
  const v_e38ca2 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_3263c7 = v_85de88(v_4d33b2.plaintext, v_e38ca2, v_4d33b2.hkdfContext);
  return v_3f4e2e.json({ blob: v_3263c7 }, 201);
});

v_b7f2b4.post("/_dev/open-v3", async (v_3f4e2e) => {
  if (!v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN || v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new v_3ebe58("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const v_4d33b2 = await v_3f4e2e.req.json<{
    token: string;
    blob: string;
    lazyRotationOverride?: boolean;
  }>();
  if (v_4d33b2.token !== v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }
  const v_e38ca2 = await v_e44d97(v_3f4e2e);
  const v_c42fdd =
    v_4d33b2.lazyRotationOverride ?? v_3f4e2e.env.LAZY_ROTATION_ENABLED === "1";
  const v_946ca6 = await v_dfbdd9(v_3f4e2e.env.DB, v_4d33b2.blob, v_e38ca2, { lazyRotationEnabled: v_c42fdd });
  return v_3f4e2e.json({ plain: v_946ca6 });
});

v_b7f2b4.post("/_dev/open-any", async (v_3f4e2e) => {
  if (!v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN || v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN.length === 0) {
    throw new v_3ebe58("FORBIDDEN", "Dev-only endpoint disabled.");
  }
  const v_4d33b2 = await v_3f4e2e.req.json<{
    token: string;
    blob: string;
    hkdfContext: string;
    hint?: { key: "users.phone" | "users.age_enc" | "messages.content"; resourceId: string | number };
    lazyMigrateOverride?: boolean;
  }>();
  if (v_4d33b2.token !== v_3f4e2e.env.ADMIN_BOOTSTRAP_TOKEN) {
    throw new v_3ebe58("NOT_FOUND", "Not found.");
  }
  const v_d205b7 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_67b8fb = await v_e44d97(v_3f4e2e);
  const v_4291aa =
    v_4d33b2.lazyMigrateOverride ?? v_3f4e2e.env.LAZY_V2_MIGRATE_ENABLED === "1";
  const v_946ca6 = await v_137694(v_4d33b2.blob, {
    db: v_3f4e2e.env.DB,
    hkdfContext: v_4d33b2.hkdfContext,
    legacyProvider: v_d205b7,
    v3Provider: v_67b8fb,
    actor: { type: "system", id: "dev-smoke" },
    auditSecret: v_3f4e2e.env.AUDIT_SECRET,
    lazyMigrateEnabled: v_4291aa,
    hint: v_4d33b2.hint,
  });
  return v_3f4e2e.json({ plain: v_946ca6 });
});

v_b7f2b4.get("/system-persona", v_c0a297, async (v_3f4e2e) => {
  const v_b6c480 = await v_b60bdd(v_3f4e2e.env.DB);
  return v_3f4e2e.json(v_b6c480);
});

v_b7f2b4.put("/system-persona", v_b09138, async (v_3f4e2e) => {
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? null;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ rules_text?: unknown; blocklist?: unknown }>()
    .catch(() => ({}) as { rules_text?: unknown; blocklist?: unknown });
  const v_f9ca29 = typeof v_4d33b2.rules_text === "string" ? v_4d33b2.rules_text : "";
  if (v_f9ca29.length > 8000) return v_3f4e2e.json({ error: "rules_text_too_long" }, 400);
  const v_3f91b5 = Array.isArray(v_4d33b2.blocklist)
    ? v_4d33b2.blocklist.filter((v_62c214): v_62c214 is string => typeof v_62c214 === "string").slice(0, 1000)
    : [];
  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO system_persona (id, rules_text, blocklist, updated_by, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       rules_text  = excluded.rules_text,
       blocklist   = excluded.blocklist,
       updated_by  = excluded.updated_by,
       updated_at  = excluded.updated_at`,
  )
    .bind(v_f9ca29, JSON.stringify(v_3f91b5), v_db9be1, Date.now())
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_b7f2b4.get("/persona-questions", v_c0a297, async (v_3f4e2e) => {
  const v_c3519b = await v_0b44ec(v_3f4e2e.env.DB);
  return v_3f4e2e.json({ questions: v_c3519b });
});

v_b7f2b4.put("/persona-questions", v_b09138, async (v_3f4e2e) => {
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? null;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ questions?: unknown }>()
    .catch(() => ({}) as { questions?: unknown });
  const v_43c42e = v_02d529(v_4d33b2.questions);
  if (!v_43c42e.ok) return v_3f4e2e.json({ error: v_43c42e.error }, 400);
  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO persoth-secretema (id, schema_json, updated_by, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       schema_json = excluded.schema_json,
       updated_by  = excluded.updated_by,
       updated_at  = excluded.updated_at`,
  )
    .bind(JSON.stringify(v_43c42e.questions), v_db9be1, Date.now())
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_b7f2b4.get("/voices", v_c0a297, async (v_3f4e2e) => {
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, gender, age_range, description, sort_order, is_active, r2_key, se_key
       FROM voice_presets ORDER BY sort_order ASC, id ASC`,
    )
    .all();
  return v_3f4e2e.json({ voices: v_18b8bf.results ?? [] });
});

const v_49b1e6 = v_1f4ea7.object({
  name: v_1f4ea7.string().min(1).max(80),
  gender: v_1f4ea7.string().max(40).optional(),
  age_range: v_1f4ea7.string().max(40).optional(),
  description: v_1f4ea7.string().max(500).optional(),
  sort_order: v_1f4ea7.number().int().optional(),
  is_active: v_1f4ea7.union([v_1f4ea7.literal(0), v_1f4ea7.literal(1)]).optional(),
  r2_key: v_1f4ea7.string().max(500).optional(),
  se_key: v_1f4ea7.string().max(500).optional(),
});

const v_a12944 = v_1f4ea7.object({
  name: v_1f4ea7.string().min(1).max(80).optional(),
  gender: v_1f4ea7.string().max(40).optional(),
  age_range: v_1f4ea7.string().max(40).optional(),
  description: v_1f4ea7.string().max(500).optional(),
  sort_order: v_1f4ea7.number().int().optional(),
  is_active: v_1f4ea7.union([v_1f4ea7.literal(0), v_1f4ea7.literal(1)]).optional(),
  r2_key: v_1f4ea7.string().max(500).optional(),
  se_key: v_1f4ea7.string().max(500).optional(),
});

function v_5e92ec(v_e6b88d): void {
  if (v_e6b88d !== undefined && !v_e6b88d.startsWith("voice/")) {
    throw new v_3ebe58("VALIDATION_FAILED", "r2_key must start with 'voice/'.");
  }
}

v_b7f2b4.post("/voices", v_b09138, async (v_3f4e2e) => {
  const v_148ff6 = await v_4c95c2(v_3f4e2e, v_49b1e6);
  v_5e92ec(v_148ff6.r2_key);
  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO voice_presets (name, gender, age_range, description, sort_order, is_active, r2_key, se_key)
       VALUES (?,?,?,?,?,?,?,?) RETURNING id`,
    )
    .bind(
      v_148ff6.name,
      v_148ff6.gender ?? null,
      v_148ff6.age_range ?? null,
      v_148ff6.description ?? null,
      v_148ff6.sort_order ?? 100,
      v_148ff6.is_active ?? 1,
      v_148ff6.r2_key ?? null,
      v_148ff6.se_key ?? null,
    )
    .first<{ id: number }>();
  return v_3f4e2e.json({ id: v_43af15!.id }, 201);
});

v_b7f2b4.put("/voices/:id", v_b09138, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_148ff6 = await v_4c95c2(v_3f4e2e, v_a12944);
  v_5e92ec(v_148ff6.r2_key);
  const v_712957 = [];
  const v_925171 = [];
  const mapping: Array<[keyof typeof v_148ff6, string]> = [
    ["name", "name"],
    ["gender", "gender"],
    ["age_range", "age_range"],
    ["description", "description"],
    ["sort_order", "sort_order"],
    ["is_active", "is_active"],
    ["r2_key", "r2_key"],
    ["se_key", "se_key"],
  ];
  for (const [v_0eb677, v_c8b83f] of v_b3439a) {
    if (v_148ff6[v_0eb677] !== undefined) {
      v_712957.push(`${v_c8b83f} = ?`);
      v_925171.push(v_148ff6[v_0eb677]);
    }
  }
  if (!v_712957.length) throw new v_3ebe58("VALIDATION_FAILED", "No fields to update.");
  v_925171.push(v_389afb);
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE voice_presets SET ${v_712957.join(", ")} WHERE id = ?`)
    .bind(...v_925171)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Voice not found.");
  return v_3f4e2e.json({ ok: true });
});

v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_2c44c0 = v_3f4e2e.req.param("id");
  const v_6e0fd3 = Number(v_2c44c0);
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ id: number; deletion_state: string }>();
  if (!v_3c8572) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_3c8572.deletion_state !== "active") {
    return v_3f4e2e.json({ ok: true, alreadyDeleted: true, deletionState: v_3c8572.deletion_state });
  }
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true, deletedId: v_6e0fd3, deletionState: "soft_deleted" });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ id: number; deletion_state: string }>();
  if (!v_3c8572) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_3c8572.deletion_state !== "active") {
    return v_3f4e2e.json({ ok: true, alreadyDisabled: true, deletionState: v_3c8572.deletion_state });
  }
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true, cloneId: v_6e0fd3, deletionState: "soft_deleted" });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ id: number; deletion_state: string }>();
  if (!v_3c8572) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_3c8572.deletion_state === "active") {
    return v_3f4e2e.json({ ok: true, alreadyActive: true, deletionState: "active" });
  }
  if (v_3c8572.deletion_state === "hard_deleted" || v_3c8572.deletion_state === "archived_cold") {
    throw new v_3ebe58("CONFLICT", `Cannot activate from state '${v_3c8572.deletion_state}'.`);
  }
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'active',
              soft_deleted_at = NULL,
              deleted_at = NULL
        WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true, cloneId: v_6e0fd3, deletionState: "active" });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_d308b5 = v_f71b56.searchParams.get("status");

  const v_abcc8d = ["1=1"];
  const v_925171 = [];
  if (v_d308b5 && ["open", "reviewed", "dismissed", "actioned"].includes(v_d308b5)) {
    v_abcc8d.push("r.status = ?");
    v_925171.push(v_d308b5);
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
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
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30)
      .all()
  ).results;
  return v_3f4e2e.json({ items: v_18b8bf });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
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
    .bind(v_389afb)
    .first();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  return v_3f4e2e.json(v_3ac7e7);
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT id, name, email, gender, age, credits,
            funnel_stage AS funnelStage,
            deletion_state AS deletionState,
            created_at AS createdAt
       FROM users WHERE id = ?`,
  )
    .bind(v_389afb)
    .first();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "User not found.");
  return v_3f4e2e.json(v_3ac7e7);
});

v_b7f2b4.get("/by-xrun/:xrunMemberId/summary", v_c0a297, async (v_3f4e2e) => {
  const v_9b82b4 = Number(v_3f4e2e.req.param("xrunMemberId"));
  if (!Number.isInteger(v_9b82b4) || v_9b82b4 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid xrun member id.");
  }
  const v_625c74 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, email,
              deletion_state AS deletionState,
              created_at AS createdAt
         FROM users
        WHERE xrun_member_id = ?
        LIMIT 1`,
    )
    .bind(v_9b82b4)
    .first<{
      id: number;
      name: string | null;
      email: string;
      deletionState: string;
      createdAt: string | null;
    }>();

  if (!v_625c74) {
    return v_3f4e2e.json({
      user: null,
      clones: [],
      cloneReportsCount: 0,
      userReportsCount: 0,
    });
  }

  const v_f891e6 = (
    await v_3f4e2e.env.DB
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
      .bind(v_625c74.id)
      .all()
  ).results;

  const v_cf098c = await v_3f4e2e.env.DB
    .prepare(
      `SELECT COUNT(*) AS cnt
         FROM clone_reports cr
         JOIN clones c ON c.id = cr.clone_id
        WHERE c.owner_id = ?`,
    )
    .bind(v_625c74.id)
    .first<{ cnt: number }>();

  const v_59cd44 = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM user_reports WHERE target_id = ?`)
    .bind(v_625c74.id)
    .first<{ cnt: number }>();

  return v_3f4e2e.json({
    user: v_625c74,
    clones: v_f891e6,
    cloneReportsCount: v_cf098c?.cnt ?? 0,
    userReportsCount: v_59cd44?.cnt ?? 0,
  });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_18b8bf = await v_3f4e2e.env.DB
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
    .bind(v_6e0fd3)
    .all();
  return v_3f4e2e.json({ items: v_18b8bf.results });
});

