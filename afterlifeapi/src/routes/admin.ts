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

