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
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_d308b5 = v_f71b56.searchParams.get("status");

  const v_abcc8d = ["1=1"];
  const v_925171 = [];
  if (v_d308b5 && ["open", "reviewed", "dismissed"].includes(v_d308b5)) {
    v_abcc8d.push("r.status = ?");
    v_925171.push(v_d308b5);
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
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
          WHERE c.owner_id = ? AND c.deletion_state = 'active'
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

v_b7f2b4.get("/reports", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_3b27d9 = v_f71b56.searchParams.get("type") ?? "all"; 
  const v_d308b5 = v_f71b56.searchParams.get("status") ?? ""; 
  const v_ca4710 = Number(v_f71b56.searchParams.get("minCount") ?? 0);
  const v_9c552d = Number(v_f71b56.searchParams.get("maxCount") ?? 0);
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_b1de41 = Number(v_f71b56.searchParams.get("targetId") ?? 0); 
  const v_3bbadf = Math.max(0, Number(v_f71b56.searchParams.get("offset") ?? 0));
  const v_02be30 = Math.max(1, Math.min(200, Number(v_f71b56.searchParams.get("limit") ?? 20)));

  const v_8a304f = `
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
           cr.created_at AS createdAt,
           cr.reviewed_at AS reviewedAt,
           (SELECT COUNT(*) FROM clone_reports x WHERE x.clone_id = cr.clone_id AND x.status = 'reviewed') AS targetReportCount
      FROM clone_reports cr
      JOIN users ru ON ru.id = cr.user_id
      JOIN clones c ON c.id = cr.clone_id
      LEFT JOIN users co ON co.id = c.owner_id
  `;
  const v_3ef660 = `
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
           ur.created_at AS createdAt,
           ur.reviewed_at AS reviewedAt,
           (SELECT COUNT(*) FROM user_reports x WHERE x.target_id = ur.target_id AND x.status = 'reviewed') AS targetReportCount
      FROM user_reports ur
      JOIN users ru ON ru.id = ur.reporter_id
      JOIN users tu ON tu.id = ur.target_id
  `;

  const v_7ec40d = `
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
           cmr.created_at AS createdAt,
           cmr.reviewed_at AS reviewedAt,
           (SELECT COUNT(*) FROM comment_reports x WHERE x.comment_id = cmr.comment_id AND x.status = 'reviewed') AS targetReportCount
      FROM comment_reports cmr
      JOIN users ru ON ru.id = cmr.user_id
      LEFT JOIN feed_comments fcc ON fcc.id = cmr.comment_id
      LEFT JOIN users cu ON cu.id = fcc.user_id
      LEFT JOIN clones cc ON cc.id = cmr.clone_id
  `;

  const v_694b25 =
    v_3b27d9 === "clone" ? `(${v_8a304f}) AS r`
    : v_3b27d9 === "user" ? `(${v_3ef660}) AS r`
    : v_3b27d9 === "comment" ? `(${v_7ec40d}) AS r`
    : `(${v_8a304f} UNION ALL ${v_3ef660} UNION ALL ${v_7ec40d}) AS r`;

  const v_abcc8d = ["1=1"];
  const v_925171 = [];
  if (v_d308b5 && ["open", "reviewed", "dismissed", "actioned"].includes(v_d308b5)) {
    v_abcc8d.push("r.status = ?");
    v_925171.push(v_d308b5);
  }
  if (v_ab6401) {
    v_abcc8d.push(`(
      r.reporterName LIKE ? OR r.reporterEmail LIKE ? OR
      COALESCE(r.targetName,'') LIKE ? OR COALESCE(r.targetSub,'') LIKE ? OR
      COALESCE(r.reason,'') LIKE ?
    )`);
    const v_07022a = `%${v_ab6401}%`;
    v_925171.push(v_07022a, v_07022a, v_07022a, v_07022a, v_07022a);
  }
  if (v_b1de41 > 0) {
    v_abcc8d.push("r.targetId = ?");
    v_925171.push(v_b1de41);
  }
  if (v_ca4710 > 0) {
    v_abcc8d.push("r.targetReportCount >= ?");
    v_925171.push(v_ca4710);
  }
  if (v_9c552d > 0) {
    v_abcc8d.push("r.targetReportCount <= ?");
    v_925171.push(v_9c552d);
  }
  const v_8b4d7e = v_abcc8d.join(" AND ");

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM ${v_694b25} WHERE ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ cnt: number }>();

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(`SELECT r.* FROM ${v_694b25} WHERE ${v_8b4d7e} ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`)
      .bind(...v_925171, v_02be30, v_3bbadf)
      .all()
  ).results;

  return v_3f4e2e.json({ items: v_18b8bf, total: v_0dab8e?.cnt ?? 0, offset: v_3bbadf, limit: v_02be30 });
});

const v_37dc27 = ["open", "reviewed", "dismissed"] as const;
v_b7f2b4.patch("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_4d33b2 = await v_3f4e2e.req.json<{ status?: string }>().catch(() => ({}) as { status?: string });
  const v_d308b5 = v_4d33b2.status ?? "";
  if (!(v_37dc27 as readonly string[]).includes(v_d308b5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid status.");
  }
  const v_901936 = v_d308b5 === "open" ? "reviewed_at = NULL" : "reviewed_at = CURRENT_TIMESTAMP";
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE clone_reports SET status = ?, ${v_901936} WHERE id = ?`)
    .bind(v_d308b5, v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb, status: v_d308b5 });
});
v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM clone_reports WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
});

const v_28cef1 = ["open", "reviewed", "dismissed", "actioned"] as const;
v_b7f2b4.patch("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_4d33b2 = await v_3f4e2e.req.json<{ status?: string }>().catch(() => ({}) as { status?: string });
  const v_d308b5 = v_4d33b2.status ?? "";
  if (!(v_28cef1 as readonly string[]).includes(v_d308b5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid status.");
  }
  const v_901936 = v_d308b5 === "open" ? "reviewed_at = NULL" : "reviewed_at = CURRENT_TIMESTAMP";
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE user_reports SET status = ?, ${v_901936} WHERE id = ?`)
    .bind(v_d308b5, v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb, status: v_d308b5 });
});
v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM user_reports WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
});

const v_f0881e = ["open", "reviewed", "dismissed"] as const;
v_b7f2b4.patch("/comments/reports/:id", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_4d33b2 = await v_3f4e2e.req.json<{ status?: string }>().catch(() => ({}) as { status?: string });
  const v_d308b5 = v_4d33b2.status ?? "";
  if (!(v_f0881e as readonly string[]).includes(v_d308b5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid status.");
  }
  const v_901936 = v_d308b5 === "open" ? "reviewed_at = NULL" : "reviewed_at = CURRENT_TIMESTAMP";
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE comment_reports SET status = ?, ${v_901936} WHERE id = ?`)
    .bind(v_d308b5, v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb, status: v_d308b5 });
});
v_b7f2b4.delete("/comments/reports/:id", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM comment_reports WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
});

function v_18f7ef(v_3f4e2e) {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_3bbadf = Math.max(0, Number(v_f71b56.searchParams.get("offset") ?? 0));
  const v_02be30 = Math.max(1, Math.min(200, Number(v_f71b56.searchParams.get("limit") ?? 20)));
  return { q: v_ab6401, offset: v_3bbadf, limit: v_02be30 };
}

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  const { q: v_ab6401, offset: v_3bbadf, limit: v_02be30 } = v_18f7ef(v_3f4e2e);

  const v_abcc8d = ["f.clone_id = ?", "fcc.parent_comment_id IS NULL"];
  const v_925171 = [v_6e0fd3];
  if (v_ab6401) {
    v_abcc8d.push(`(u.name LIKE ? OR u.email LIKE ? OR fcc.content LIKE ?)`);
    const v_07022a = `%${v_ab6401}%`;
    v_925171.push(v_07022a, v_07022a, v_07022a);
  }
  const v_8b4d7e = v_abcc8d.join(" AND ");

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM feed_comments fcc JOIN feeds f ON f.id = fcc.feed_id JOIN users u ON u.id = fcc.user_id WHERE ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ cnt: number }>();

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT fcc.id, fcc.feed_id AS feedId, fcc.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              fcc.content, fcc.created_at AS createdAt,
              fcc.likes_count AS likeCount,
              (SELECT COUNT(*) FROM feed_comments r WHERE r.parent_comment_id = fcc.id) AS replyCount
         FROM feed_comments fcc
         JOIN feeds f ON f.id = fcc.feed_id
         JOIN users u ON u.id = fcc.user_id
        WHERE ${v_8b4d7e}
        ORDER BY fcc.created_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...v_925171, v_02be30, v_3bbadf)
    .all();
  return v_3f4e2e.json({ items: v_18b8bf.results, total: v_0dab8e?.cnt ?? 0, offset: v_3bbadf, limit: v_02be30 });
});
v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM feed_comments WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Comment not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  const { q: v_ab6401, offset: v_3bbadf, limit: v_02be30 } = v_18f7ef(v_3f4e2e);

  const v_abcc8d = ["f.clone_id = ?"];
  const v_925171 = [v_6e0fd3];
  if (v_ab6401) {
    v_abcc8d.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    const v_07022a = `%${v_ab6401}%`;
    v_925171.push(v_07022a, v_07022a);
  }
  const v_8b4d7e = v_abcc8d.join(" AND ");

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM feed_likes fl JOIN feeds f ON f.id = fl.feed_id JOIN users u ON u.id = fl.user_id WHERE ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ cnt: number }>();

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT fl.id, fl.feed_id AS feedId, fl.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              fl.created_at AS createdAt
         FROM feed_likes fl
         JOIN feeds f ON f.id = fl.feed_id
         JOIN users u ON u.id = fl.user_id
        WHERE ${v_8b4d7e}
        ORDER BY fl.created_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...v_925171, v_02be30, v_3bbadf)
    .all();
  return v_3f4e2e.json({ items: v_18b8bf.results, total: v_0dab8e?.cnt ?? 0, offset: v_3bbadf, limit: v_02be30 });
});
v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM feed_likes WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Like not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  const { q: v_ab6401, offset: v_3bbadf, limit: v_02be30 } = v_18f7ef(v_3f4e2e);

  const v_abcc8d = ["cf.clone_id = ?"];
  const v_925171 = [v_6e0fd3];
  if (v_ab6401) {
    v_abcc8d.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    const v_07022a = `%${v_ab6401}%`;
    v_925171.push(v_07022a, v_07022a);
  }
  const v_8b4d7e = v_abcc8d.join(" AND ");

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM clone_follows cf JOIN users u ON u.id = cf.user_id WHERE ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ cnt: number }>();

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT cf.id, cf.user_id AS userId,
              u.name AS userName, u.email AS userEmail,
              u.xrun_member_id AS userXrunMemberId,
              cf.created_at AS createdAt
         FROM clone_follows cf
         JOIN users u ON u.id = cf.user_id
        WHERE ${v_8b4d7e}
        ORDER BY cf.created_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...v_925171, v_02be30, v_3bbadf)
    .all();
  return v_3f4e2e.json({ items: v_18b8bf.results, total: v_0dab8e?.cnt ?? 0, offset: v_3bbadf, limit: v_02be30 });
});
v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM clone_follows WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Follow not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  const { q: v_ab6401, offset: v_3bbadf, limit: v_02be30 } = v_18f7ef(v_3f4e2e);

  const v_abcc8d = ["uci.clone_id = ?"];
  const v_925171 = [v_6e0fd3];
  if (v_ab6401) {
    v_abcc8d.push(`(u.name LIKE ? OR u.email LIKE ?)`);
    const v_07022a = `%${v_ab6401}%`;
    v_925171.push(v_07022a, v_07022a);
  }
  const v_8b4d7e = v_abcc8d.join(" AND ");

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS cnt FROM user_clone_interactions uci JOIN users u ON u.id = uci.user_id WHERE ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ cnt: number }>();

  const v_18b8bf = await v_3f4e2e.env.DB
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
        WHERE ${v_8b4d7e}
        ORDER BY uci.last_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...v_925171, v_02be30, v_3bbadf)
    .all();
  return v_3f4e2e.json({ items: v_18b8bf.results, total: v_0dab8e?.cnt ?? 0, offset: v_3bbadf, limit: v_02be30 });
});
v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB.prepare(`DELETE FROM user_clone_interactions WHERE id = ?`).bind(v_389afb).run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Interaction not found.");
  return v_3f4e2e.json({ ok: true, id: v_389afb });
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

