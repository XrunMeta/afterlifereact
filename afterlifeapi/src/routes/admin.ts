import { v_b7c41b, type v_437670 } from "zmui";
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
import { v_70b594, v_4db5dd } from "../lib/knowledgeQuestions";
import { v_cba618, v_1809f7 } from "../lib/knowledgeBlacklist";
import { v_038cdc } from "../lib/knowledgeStore";
import { v_c226a5 } from "../lib/notify";
import {
  v_916830,
  v_5d3436,
  v_399bbb,
  v_6e82f0,
  v_0edc13,
  v_9459da,
  v_52acfb,
  v_b61290,
  v_dc0a0b,
  v_88bb3b,
  v_1f7eef,
  v_99e8be,
  v_824b75,
  v_4bc1db,
  v_b7471b,
  type v_83f27d,
  type v_f56907,
  type v_eb1456,
  type v_26435f,
} from "../lib/appConfig";

export const v_b7f2b4 = new v_b7c41b<v_de0a25>();

v_b7f2b4.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "admin" }));

const v_8375f7 = new Set<v_f56907>(["running", "maintenance", "stopped"]);
v_b7f2b4.get("/system/function-config", v_c0a297, async (v_3f4e2e) => {
  const v_01dcf5 = await v_dc0a0b(v_3f4e2e.env);
  return v_3f4e2e.json(v_01dcf5);
});
v_b7f2b4.patch("/system/function-config", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json<{
    serverStatus?: unknown;
    minVersionIos?: unknown;
    minVersionAndroid?: unknown;
  }>().catch(() => ({} as { serverStatus?: unknown; minVersionIos?: unknown; minVersionAndroid?: unknown }));

  const patch: {
    serverStatus?: v_f56907;
    minVersionIos?: string;
    minVersionAndroid?: string;
  } = {};

  if (v_4d33b2.serverStatus !== undefined) {
    if (typeof v_4d33b2.serverStatus !== "string" || !v_8375f7.has(v_4d33b2.serverStatus as v_f56907)) {
      throw new v_3ebe58(
        "VALIDATION_FAILED",
        "serverStatus must be one of running|maintenance|stopped.",
      );
    }
    v_17dc8a.serverStatus = v_4d33b2.serverStatus as v_f56907;
  }
  if (v_4d33b2.minVersionIos !== undefined) {
    if (typeof v_4d33b2.minVersionIos !== "string" || !v_1f7eef(v_4d33b2.minVersionIos)) {
      throw new v_3ebe58("VALIDATION_FAILED", "minVersionIos must be empty or X.Y.Z (digits).");
    }
    v_17dc8a.minVersionIos = v_4d33b2.minVersionIos;
  }
  if (v_4d33b2.minVersionAndroid !== undefined) {
    if (typeof v_4d33b2.minVersionAndroid !== "string" || !v_1f7eef(v_4d33b2.minVersionAndroid)) {
      throw new v_3ebe58("VALIDATION_FAILED", "minVersionAndroid must be empty or X.Y.Z (digits).");
    }
    v_17dc8a.minVersionAndroid = v_4d33b2.minVersionAndroid;
  }
  if (Object.keys(v_17dc8a).length === 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "No fields to update.");
  }
  const v_01dcf5 = await v_88bb3b(v_3f4e2e.env, v_17dc8a);
  return v_3f4e2e.json({ ok: true, ...v_01dcf5 });
});

v_b7f2b4.get("/config/persona-price", v_c0a297, async (v_3f4e2e) => {
  const v_318e8b = await v_916830(v_3f4e2e.env);
  return v_3f4e2e.json({ priceXrun: v_318e8b });
});
v_b7f2b4.patch("/config/persona-price", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json<{ priceXrun?: unknown }>().catch(() => ({} as { priceXrun?: unknown }));
  const v_6bbb57 = Number(v_4d33b2.priceXrun);
  if (!Number.isFinite(v_6bbb57) || v_6bbb57 < 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "priceXrun must be a non-negative number.");
  }
  await v_5d3436(v_3f4e2e.env, v_6bbb57);
  return v_3f4e2e.json({ ok: true, priceXrun: v_6bbb57 });
});

const v_b2c168 = 600000; 
v_b7f2b4.get("/config/signup-free-credits", v_c0a297, async (v_3f4e2e) => {
  const v_e2c945 = await v_52acfb(v_3f4e2e.env);
  return v_3f4e2e.json({ credits: v_e2c945 });
});
v_b7f2b4.patch("/config/signup-free-credits", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json<{ credits?: unknown }>().catch(() => ({} as { credits?: unknown }));
  const v_f4e98d = Number(v_4d33b2.credits);
  if (!Number.isFinite(v_f4e98d) || v_f4e98d < 0 || v_f4e98d > v_b2c168) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `credits must be an integer between 0 and ${v_b2c168}.`,
    );
  }
  const v_e2c945 = Math.floor(v_f4e98d);
  await v_b61290(v_3f4e2e.env, v_e2c945);
  return v_3f4e2e.json({ ok: true, credits: v_e2c945 });
});

const v_46964b = 16000;
v_b7f2b4.get("/config/knowledge-rules", v_c0a297, async (v_3f4e2e) => {
  const v_ddf1dc = await v_399bbb(v_3f4e2e.env);
  return v_3f4e2e.json({ rules: v_ddf1dc });
});

v_b7f2b4.get("/config/ad-messages", v_c0a297, async (v_3f4e2e) => {

  const [v_fa56e0, v_303197] = await Promise.all([v_99e8be(v_3f4e2e.env), v_4bc1db(v_3f4e2e.env)]);
  return v_3f4e2e.json({ messages: v_fa56e0, cadence: v_303197 });
});
v_b7f2b4.patch("/config/ad-messages", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e
    .req.json<{ pre?: unknown; post?: unknown; toast?: unknown; firstRound?: unknown; interval?: unknown }>()
    .catch(() => ({} as { pre?: unknown; post?: unknown; toast?: unknown; firstRound?: unknown; interval?: unknown }));
  const patch: Partial<v_eb1456> = {};
  if (typeof v_4d33b2.pre === "string") v_17dc8a.pre = v_4d33b2.pre;
  if (typeof v_4d33b2.post === "string") v_17dc8a.post = v_4d33b2.post;
  if (typeof v_4d33b2.toast === "string") v_17dc8a.toast = v_4d33b2.toast;

  const cadencePatch: Partial<v_26435f> = {};
  if (v_4d33b2.firstRound !== undefined) v_6563a0.firstRound = Number(v_4d33b2.firstRound);
  if (v_4d33b2.interval !== undefined) v_6563a0.interval = Number(v_4d33b2.interval);
  try {
    const v_fa56e0 = await v_824b75(v_3f4e2e.env, v_17dc8a);
    const v_303197 =
      Object.keys(v_6563a0).length > 0
        ? await v_b7471b(v_3f4e2e.env, v_6563a0)
        : await v_4bc1db(v_3f4e2e.env);
    return v_3f4e2e.json({ ok: true, messages: v_fa56e0, cadence: v_303197 });
  } catch (v_49263d) {
    throw new v_3ebe58("VALIDATION_FAILED", (v_49263d as Error)?.message ?? "invalid");
  }
});

v_b7f2b4.patch("/config/knowledge-rules", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json<{ rules?: unknown }>().catch(() => ({} as { rules?: unknown }));
  const v_ddf1dc = typeof v_4d33b2.rules === "string" ? v_4d33b2.rules : "";
  if (v_ddf1dc.length > v_46964b) {
    throw new v_3ebe58("VALIDATION_FAILED", `rules must be ≤ ${v_46964b} chars.`);
  }
  await v_6e82f0(v_3f4e2e.env, v_ddf1dc);
  return v_3f4e2e.json({ ok: true, rules: v_ddf1dc });
});

const v_8295db = 200;
v_b7f2b4.get("/config/gift-catalog", v_c0a297, async (v_3f4e2e) => {
  const v_4622b9 = await v_0edc13(v_3f4e2e.env);
  return v_3f4e2e.json({ items: v_4622b9 });
});
v_b7f2b4.patch("/config/gift-catalog", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json<{ items?: unknown }>().catch(() => ({} as { items?: unknown }));
  if (!Array.isArray(v_4d33b2.items)) {
    throw new v_3ebe58("VALIDATION_FAILED", "items must be an array.");
  }
  if (v_4d33b2.items.length > v_8295db) {
    throw new v_3ebe58("VALIDATION_FAILED", `too many items (max ${v_8295db}).`);
  }
  const clean: v_83f27d[] = [];
  for (const v_479f05 of v_4d33b2.items) {
    if (!v_479f05 || typeof v_479f05 !== "object") {
      throw new v_3ebe58("VALIDATION_FAILED", "each item must be an object.");
    }
    const v_23805a = v_479f05 as Partial<v_83f27d>;
    if (typeof v_23805a.id !== "string" || !v_23805a.id.trim()) throw new v_3ebe58("VALIDATION_FAILED", "id required.");
    if (typeof v_23805a.name !== "string" || !v_23805a.name.trim()) throw new v_3ebe58("VALIDATION_FAILED", "name required.");
    if (typeof v_23805a.emoji !== "string" || !v_23805a.emoji.trim()) throw new v_3ebe58("VALIDATION_FAILED", "emoji required.");
    if (typeof v_23805a.price !== "number" || !Number.isFinite(v_23805a.price) || v_23805a.price < 0) {
      throw new v_3ebe58("VALIDATION_FAILED", "price must be non-negative number.");
    }
    const clean1: v_83f27d = {
      id: v_23805a.id.trim(),
      name: v_23805a.name.trim(),
      emoji: v_23805a.emoji.trim(),
      price: v_23805a.price,
    };
    if (v_23805a.imageUrl !== undefined && v_23805a.imageUrl !== null) {
      if (typeof v_23805a.imageUrl !== "string") {
        throw new v_3ebe58("VALIDATION_FAILED", "imageUrl must be string.");
      }
      const v_2f361a = v_23805a.imageUrl.trim();
      if (v_2f361a.length > 0) {
        if (v_2f361a.length > 500) {
          throw new v_3ebe58("VALIDATION_FAILED", "imageUrl too long.");
        }
        v_bd030e.imageUrl = v_2f361a;
      }
    }

    if (v_23805a.xrunPrice !== undefined && v_23805a.xrunPrice !== null) {
      if (typeof v_23805a.xrunPrice !== "number" || !Number.isFinite(v_23805a.xrunPrice) || v_23805a.xrunPrice < 0) {
        throw new v_3ebe58("VALIDATION_FAILED", "xrunPrice must be non-negative number.");
      }
      v_bd030e.xrunPrice = v_23805a.xrunPrice;
    }

    if (v_23805a.svgaUrl !== undefined && v_23805a.svgaUrl !== null) {
      if (typeof v_23805a.svgaUrl !== "string") {
        throw new v_3ebe58("VALIDATION_FAILED", "svgaUrl must be string.");
      }
      const v_2f361a = v_23805a.svgaUrl.trim();
      if (v_2f361a.length > 0) {
        if (v_2f361a.length > 500) {
          throw new v_3ebe58("VALIDATION_FAILED", "svgaUrl too long.");
        }
        v_bd030e.svgaUrl = v_2f361a;
      }
    }
    v_76a373.push(v_bd030e);
  }
  await v_9459da(v_3f4e2e.env, v_76a373);
  return v_3f4e2e.json({ ok: true, items: v_76a373 });
});

v_b7f2b4.get("/call-sessions", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_43e90c = v_f71b56.searchParams.get("userId");
  const v_6e0fd3 = v_f71b56.searchParams.get("cloneId");
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_a13c2e = v_f71b56.searchParams.get("from");
  const v_257132 = v_f71b56.searchParams.get("to");

  const v_abcc8d = [];
  const v_925171 = [];
  if (v_43e90c) { v_abcc8d.push("cs.user_id = ?"); v_925171.push(Number(v_43e90c)); }
  if (v_6e0fd3) { v_abcc8d.push("cs.clone_id = ?"); v_925171.push(Number(v_6e0fd3)); }
  if (v_a13c2e) { v_abcc8d.push("cs.started_at >= ?"); v_925171.push(Number(v_a13c2e)); }
  if (v_257132) { v_abcc8d.push("cs.started_at <= ?"); v_925171.push(Number(v_257132)); }
  if (v_ab6401) {
    v_abcc8d.push("(u.email LIKE ? OR u.name LIKE ? OR c.name LIKE ? OR cs.call_id LIKE ?)");
    const v_2a1d60 = `%${v_ab6401}%`;
    v_925171.push(v_2a1d60, v_2a1d60, v_2a1d60, v_2a1d60);
  }
  const v_8b4d7e = v_abcc8d.length > 0 ? `WHERE ${v_abcc8d.join(" AND ")}` : "";

  const v_18b8bf = await v_3f4e2e.env.DB
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
         ${v_8b4d7e}
         ORDER BY cs.started_at DESC
         LIMIT ?`,
    )
    .bind(...v_925171, v_02be30)
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

  return v_3f4e2e.json({ items: v_18b8bf.results });
});

v_b7f2b4.post("/files/gift-image", v_c0a297, async (v_3f4e2e) => {
  let v_ebd523;
  try {
    v_ebd523 = await v_3f4e2e.req.formData();
  } catch {
    throw new v_3ebe58("VALIDATION_FAILED", "multipart/form-data required.");
  }
  const v_479f05 = v_ebd523.get("file");
  if (
    !v_479f05 ||
    typeof v_479f05 !== "object" ||
    typeof (v_479f05 as { arrayBuffer?: unknown }).arrayBuffer !== "function"
  ) {
    throw new v_3ebe58("VALIDATION_FAILED", "Missing 'file' field.");
  }
  const v_4de33e = v_479f05 as {
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };

  const v_58b649 = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const v_a63882 = 2 * 1024 * 1024; 
  const v_4bcdcb = 5 * 1024 * 1024; 
  if (!v_58b649.has(v_4de33e.type)) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `Unsupported type: ${v_4de33e.type}. jpeg/png/webp/gif only.`,
    );
  }
  const v_efc45d = v_4de33e.type === "image/gif" ? v_4bcdcb : v_a63882;
  if (v_4de33e.size > v_efc45d) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `File too large (${v_4de33e.size} bytes). Max ${v_efc45d} bytes.`,
    );
  }
  const v_40a923 =
    v_4de33e.type === "image/jpeg" ? ".jpg"
    : v_4de33e.type === "image/png" ? ".png"
    : v_4de33e.type === "image/gif" ? ".gif"
    : ".webp";
  const v_fc3f08 = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const v_8d41d7 = Date.now().toString(36);
  const v_0037e3 = `uploadedfiles/admin/gift/${v_8d41d7}${v_fc3f08}${v_40a923}`;
  const v_83ee53 = await v_4de33e.arrayBuffer();
  await v_3f4e2e.env.R2_ARCHIVE.put(v_0037e3, v_83ee53, {
    httpMetadata: { contentType: v_4de33e.type },
    customMetadata: { purpose: "gift.catalog", uploader: "admin" },
  });
  const v_81161e = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, ?, ?, NULL, ?)
       RETURNING id`,
    )
    .bind(v_0037e3, v_4de33e.type, v_4de33e.size, "gift.catalog")
    .first<{ id: number }>();
  if (!v_81161e) {
    await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3);
    throw new v_3ebe58("INTERNAL_ERROR", "Failed to register file.");
  }
  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  return v_3f4e2e.json({
    id: v_81161e.id,
    url: `${v_f17108}/oth-path${v_81161e.id}`,
    contentType: v_4de33e.type,
    sizeBytes: v_4de33e.size,
  }, 201);
});

v_b7f2b4.post("/files/gift-svga", v_c0a297, async (v_3f4e2e) => {
  let v_ebd523;
  try {
    v_ebd523 = await v_3f4e2e.req.formData();
  } catch {
    throw new v_3ebe58("VALIDATION_FAILED", "multipart/form-data required.");
  }
  const v_479f05 = v_ebd523.get("file");
  if (
    !v_479f05 ||
    typeof v_479f05 !== "object" ||
    typeof (v_479f05 as { arrayBuffer?: unknown }).arrayBuffer !== "function"
  ) {
    throw new v_3ebe58("VALIDATION_FAILED", "Missing 'file' field.");
  }
  const v_4de33e = v_479f05 as {
    name?: string;
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };
  const v_f34f6d = 8 * 1024 * 1024; 
  if (v_4de33e.size > v_f34f6d) {
    throw new v_3ebe58("VALIDATION_FAILED", `File too large (${v_4de33e.size} bytes). Max ${v_f34f6d} bytes.`);
  }
  const v_c424ac = (v_4de33e.name ?? "").toLowerCase();
  if (!v_c424ac.endsWith(".svga")) {
    throw new v_3ebe58("VALIDATION_FAILED", `Unsupported filename: ${v_4de33e.name ?? "(none)"}. .svga only.`);
  }
  const v_fc3f08 = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const v_8d41d7 = Date.now().toString(36);
  const v_0037e3 = `uploadedfiles/admin/gift-svga/${v_8d41d7}${v_fc3f08}.svga`;
  const v_83ee53 = await v_4de33e.arrayBuffer();
  const v_c0c2d5 = "application/octet-stream";
  await v_3f4e2e.env.R2_ARCHIVE.put(v_0037e3, v_83ee53, {
    httpMetadata: { contentType: v_c0c2d5 },
    customMetadata: { purpose: "gift.svga", uploader: "admin" },
  });
  const v_81161e = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, ?, ?, NULL, ?)
       RETURNING id`,
    )
    .bind(v_0037e3, v_c0c2d5, v_4de33e.size, "gift.svga")
    .first<{ id: number }>();
  if (!v_81161e) {
    await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3);
    throw new v_3ebe58("INTERNAL_ERROR", "Failed to register file.");
  }
  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  return v_3f4e2e.json({
    id: v_81161e.id,
    url: `${v_f17108}/oth-path${v_81161e.id}`,
    contentType: v_c0c2d5,
    sizeBytes: v_4de33e.size,
  }, 201);
});

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

v_b7f2b4.get("/knowledge-questions", v_c0a297, async (v_3f4e2e) => {
  const v_c3519b = await v_70b594(v_3f4e2e.env.DB);
  return v_3f4e2e.json({ questions: v_c3519b });
});

v_b7f2b4.put("/knowledge-questions", v_b09138, async (v_3f4e2e) => {
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? null;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ questions?: unknown }>()
    .catch(() => ({}) as { questions?: unknown });
  const v_43c42e = v_4db5dd(v_4d33b2.questions);
  if (!v_43c42e.ok) return v_3f4e2e.json({ error: v_43c42e.error }, 400);
  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO knowloth-secrethema (id, schema_json, updated_by, updated_at)
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

v_b7f2b4.get("/knowledge-blacklist", v_c0a297, async (v_3f4e2e) => {
  const v_1468d5 = await v_cba618(v_3f4e2e.env.DB);
  return v_3f4e2e.json({ words: v_1468d5 });
});

v_b7f2b4.put("/knowledge-blacklist", v_c0a297, async (v_3f4e2e) => {
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? null;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ words?: unknown }>()
    .catch(() => ({}) as { words?: unknown });
  const v_43c42e = v_1809f7(v_4d33b2.words);
  if (!v_43c42e.ok) return v_3f4e2e.json({ error: v_43c42e.error }, 400);
  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO knowledge_blacklist (id, blacklist_json, updated_by, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       blacklist_json = excluded.blacklist_json,
       updated_by     = excluded.updated_by,
       updated_at     = excluded.updated_at`,
  )
    .bind(JSON.stringify(v_43c42e.words), v_db9be1, Date.now())
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_b7f2b4.get("/voices", v_c0a297, async (v_3f4e2e) => {
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, name_en, name_ja, name_zh_cn, name_id,
              gender, age_range, description, sort_order, is_active, r2_key, se_key
       FROM voice_presets ORDER BY sort_order ASC, id ASC`,
    )
    .all();
  return v_3f4e2e.json({ voices: v_18b8bf.results ?? [] });
});

const v_49b1e6 = v_1f4ea7.object({
  name: v_1f4ea7.string().min(1).max(80),
  name_en: v_1f4ea7.string().max(80).optional(),
  name_ja: v_1f4ea7.string().max(80).optional(),
  name_zh_cn: v_1f4ea7.string().max(80).optional(),
  name_id: v_1f4ea7.string().max(80).optional(),
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
  name_en: v_1f4ea7.string().max(80).nullable().optional(),
  name_ja: v_1f4ea7.string().max(80).nullable().optional(),
  name_zh_cn: v_1f4ea7.string().max(80).nullable().optional(),
  name_id: v_1f4ea7.string().max(80).nullable().optional(),
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
      `INSERT INTO voice_presets
         (name, name_en, name_ja, name_zh_cn, name_id,
          gender, age_range, description, sort_order, is_active, r2_key, se_key)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
    )
    .bind(
      v_148ff6.name,
      v_148ff6.name_en ?? null,
      v_148ff6.name_ja ?? null,
      v_148ff6.name_zh_cn ?? null,
      v_148ff6.name_id ?? null,
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

const v_0a4de4 = v_1f4ea7.object({
  reason: v_1f4ea7.string().min(10, "사유는 최소 10자 이상 입력해 주세요.").max(500),
});
const v_6a2a1e = v_1f4ea7.object({
  reason: v_1f4ea7.string().min(10).max(500).optional(),
});

v_b7f2b4.delete("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_105fc4 = v_3f4e2e.get("adminUserId")!;
  const v_2c44c0 = v_3f4e2e.req.param("id");
  const v_6e0fd3 = Number(v_2c44c0);
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }

  let v_58ca36 = null;
  try {
    const v_479f05 = await v_3f4e2e.req.json<{ reason?: unknown }>();
    if (v_479f05 && typeof v_479f05.reason === 'string' && v_479f05.reason.trim().length > 0) {
      v_58ca36 = v_479f05.reason.trim().slice(0, 500);
    }
  } catch {  }
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
              soft_deleted_at = CURRENT_TIMESTAMP,
              deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .run();
  await v_e56fb3(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    actor: { type: "admin", id: v_105fc4 },
    op: "soft_delete",
    resourceType: "clone",
    resourceId: v_6e0fd3,
    reason: v_58ca36,
  });
  return v_3f4e2e.json({ ok: true, deletedId: v_6e0fd3, deletionState: "soft_deleted" });
});

v_b7f2b4.post("/oth-path", v_b09138, async (v_3f4e2e) => {
  const v_105fc4 = v_3f4e2e.get("adminUserId")!;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const { reason: v_58ca36 } = await v_4c95c2(v_3f4e2e, v_0a4de4);
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state, admin_suspended_at FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ id: number; deletion_state: string; admin_suspended_at: string | null }>();
  if (!v_3c8572) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_3c8572.deletion_state !== "active") {
    throw new v_3ebe58(
      "CONFLICT",
      `Cannot suspend a clone in deletion_state '${v_3c8572.deletion_state}'.`,
    );
  }
  if (v_3c8572.admin_suspended_at) {
    return v_3f4e2e.json({ ok: true, alreadySuspended: true, adminSuspendedAt: v_3c8572.admin_suspended_at });
  }
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE clones
          SET admin_suspended_at = CURRENT_TIMESTAMP,
              admin_suspend_reason = ?
        WHERE id = ?`,
    )
    .bind(v_58ca36, v_6e0fd3)
    .run();
  await v_e56fb3(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    actor: { type: "admin", id: v_105fc4 },
    op: "disable",
    resourceType: "clone",
    resourceId: v_6e0fd3,
    reason: v_58ca36,
  });
  return v_3f4e2e.json({ ok: true, cloneId: v_6e0fd3, suspended: true });
});

v_b7f2b4.post("/oth-path", v_b09138, async (v_3f4e2e) => {
  const v_105fc4 = v_3f4e2e.get("adminUserId")!;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }

  let v_58ca36;
  const v_525ffe = await v_3f4e2e.req.text();
  if (v_525ffe.trim().length > 0) {
    let v_7ecfd1;
    try {
      v_7ecfd1 = JSON.parse(v_525ffe);
    } catch {
      throw new v_3ebe58("VALIDATION_FAILED", "Invalid JSON body.");
    }
    const v_8decf8 = v_6a2a1e.safeParse(v_7ecfd1);
    if (!v_8decf8.success) {
      throw new v_3ebe58("VALIDATION_FAILED", "Body validation failed.", v_8decf8.error.issues);
    }
    v_58ca36 = v_8decf8.data.reason;
  }
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, deletion_state, admin_suspended_at FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ id: number; deletion_state: string; admin_suspended_at: string | null }>();
  if (!v_3c8572) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_3c8572.deletion_state === "hard_deleted" || v_3c8572.deletion_state === "archived_cold") {
    throw new v_3ebe58("CONFLICT", `Cannot activate from state '${v_3c8572.deletion_state}'.`);
  }
  const v_80b6a0 = v_3c8572.deletion_state !== "active";
  const v_22c815 = v_3c8572.admin_suspended_at !== null;
  if (!v_80b6a0 && !v_22c815) {
    return v_3f4e2e.json({ ok: true, alreadyActive: true, deletionState: "active" });
  }
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE clones
          SET deletion_state = 'active',
              soft_deleted_at = NULL,
              deleted_at = NULL,
              admin_suspended_at = NULL,
              admin_suspend_reason = NULL
        WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .run();
  await v_e56fb3(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    actor: { type: "admin", id: v_105fc4 },
    op: "activate",
    resourceType: "clone",
    resourceId: v_6e0fd3,
    reason: v_58ca36 ?? null,
  });
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
  if (!Number.isInteger(v_389afb) || v_389afb <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      "SELECT id, name, username, l1_profile FROM clones WHERE id = ?",
    )
    .bind(v_389afb)
    .first<{ id: number; name: string; username: string; l1_profile: string | null }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  let v_020b4b = null;
  if (v_3ac7e7.l1_profile) {
    try {
      v_020b4b = JSON.parse(v_3ac7e7.l1_profile);
    } catch {

    }
  }
  return v_3f4e2e.json({ id: v_3ac7e7.id, name: v_3ac7e7.name, username: v_3ac7e7.username, l1_profile: v_020b4b });
});

const v_d03300 = v_1f4ea7.object({
  l1_profile: v_1f4ea7.object({
    attrs: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.string()).optional(),
    notes: v_1f4ea7.string().max(4000).optional(),
    personality_core: v_1f4ea7.string().max(500).optional(),
    tone: v_1f4ea7.string().max(500).optional(),
    knowledge: v_1f4ea7
      .array(
        v_1f4ea7.object({
          key: v_1f4ea7.string().max(50).nullish(),
          q: v_1f4ea7.string().max(200).nullish(),
          a: v_1f4ea7.string().max(3000),
        }),
      )
      .max(60) 
      .optional(),
  }),
});

v_b7f2b4.put("/oth-path", v_b09138, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_d03300);
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare("SELECT l1_profile FROM clones WHERE id = ?")
    .bind(v_389afb)
    .first<{ l1_profile: string | null }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  let v_ba2215 = {};
  if (v_3ac7e7.l1_profile) {
    try {
      const v_e2a85c = JSON.parse(v_3ac7e7.l1_profile);
      if (v_e2a85c && typeof v_e2a85c === "object") v_ba2215 = v_e2a85c as Record<string, unknown>;
    } catch {

    }
  }

  const v_a448ad = { ...v_ba2215 };
  const v_b1eff4 = v_4d33b2.l1_profile;
  if (v_b1eff4.attrs !== undefined) v_a448ad.attrs = v_b1eff4.attrs;
  if (v_b1eff4.notes !== undefined) v_a448ad.notes = v_b1eff4.notes;
  if (v_b1eff4.personality_core !== undefined) v_a448ad.personality_core = v_b1eff4.personality_core;
  if (v_b1eff4.tone !== undefined) v_a448ad.tone = v_b1eff4.tone;
  if (v_b1eff4.knowledge !== undefined) {
    const v_825625 = v_038cdc(v_b1eff4.knowledge as never, Date.now());
    if (!v_825625.ok) throw new v_3ebe58("VALIDATION_FAILED", v_825625.error);
    v_a448ad.knowledge = v_825625.items;
  }

  await v_3f4e2e.env.DB
    .prepare(
      "UPDATE clones SET l1_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(JSON.stringify(v_a448ad), v_389afb)
    .run();
  return v_3f4e2e.json({ ok: true, l1_profile: v_a448ad });
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
            c.deleted_at AS deletedAt,
            c.pipeline,
            c.viseme_prefix AS visemePrefix,
            c.viseme_generated_at AS visemeGeneratedAt,
            c.viseme_version AS visemeVersion,
            c.avatar_sdk_glb_url AS avatarSdkGlbUrl,
            c.avatar_sdk_id AS avatarSdkId,
            c.tts_output AS ttsOutput
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(v_389afb)
    .first();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  return v_3f4e2e.json(v_3ac7e7);
});

const v_dcf9cd = v_1f4ea7.object({
  pipeline: v_1f4ea7.enum(["musetalk", "echomimic_v3", "viseme_playback", "threed"]).optional(),

  visemePrefix: v_1f4ea7.string().max(500).nullable().optional(),
  visemeVersion: v_1f4ea7.string().max(50).nullable().optional(),

  avatarSdkGlbUrl: v_1f4ea7.string().url().max(1000).nullable().optional(),
  avatarSdkId: v_1f4ea7.string().max(200).nullable().optional(),

  ttsOutput: v_1f4ea7.enum(["server_stream", "local_play", "server_upload"]).optional(),
});

v_b7f2b4.patch("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_8decf8 = v_dcf9cd.safeParse(await v_3f4e2e.req.json().catch(() => ({})));
  if (!v_8decf8.success) {
    throw new v_3ebe58("VALIDATION_FAILED", v_8decf8.error.message);
  }
  const v_4d33b2 = v_8decf8.data;

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT id FROM clones WHERE id = ?`)
    .bind(v_389afb)
    .first<{ id: number }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  const v_75ae3e = [];
  const v_925171 = [];
  if (v_4d33b2.pipeline !== undefined) {
    v_75ae3e.push(`pipeline = ?`);
    v_925171.push(v_4d33b2.pipeline);
  }

  if (v_4d33b2.visemePrefix !== undefined) {
    v_75ae3e.push(`viseme_prefix = ?`);
    v_925171.push(v_4d33b2.visemePrefix);
    if (v_4d33b2.visemePrefix) {
      v_75ae3e.push(`viseme_generated_at = ?`);
      v_925171.push(Date.now());
    }
  }
  if (v_4d33b2.visemeVersion !== undefined) {
    v_75ae3e.push(`viseme_version = ?`);
    v_925171.push(v_4d33b2.visemeVersion);
  }

  if (v_4d33b2.avatarSdkGlbUrl !== undefined) {
    v_75ae3e.push(`avatar_sdk_glb_url = ?`);
    v_925171.push(v_4d33b2.avatarSdkGlbUrl);
  }
  if (v_4d33b2.avatarSdkId !== undefined) {
    v_75ae3e.push(`avatar_sdk_id = ?`);
    v_925171.push(v_4d33b2.avatarSdkId);
  }

  if (v_4d33b2.ttsOutput !== undefined) {
    v_75ae3e.push(`tts_output = ?`);
    v_925171.push(v_4d33b2.ttsOutput);
  }
  if (v_75ae3e.length === 0) {
    return v_3f4e2e.json({ ok: true, updated: 0 });
  }
  v_75ae3e.push(`updated_at = CURRENT_TIMESTAMP`);
  v_925171.push(v_389afb);

  await v_3f4e2e.env.DB
    .prepare(`UPDATE clones SET ${v_75ae3e.join(", ")} WHERE id = ?`)
    .bind(...v_925171)
    .run();
  return v_3f4e2e.json({ ok: true, updated: v_75ae3e.length - 1 });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare(`SELECT id, name FROM clones WHERE id = ?`)
    .bind(v_389afb)
    .first<{ id: number; name: string }>();
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  const v_555aed = v_3f4e2e.env.VISEME_RENDER_URL;
  if (!v_555aed) {
    return v_3f4e2e.json(
      {
        ok: false,
        code: "NOT_CONFIGURED",
        message: "VISEME_RENDER_URL is not set. 가비아 GPU 렌더 서버 배선 대기 중.",
      },
      501,
    );
  }

  const v_4d33b2 = await v_3f4e2e.req.json().catch(() => ({} as { photoUrl?: string }));
  const v_0838a4 = typeof (v_4d33b2 as { photoUrl?: unknown }).photoUrl === "string"
    ? (v_4d33b2 as { photoUrl: string }).photoUrl
    : undefined;

  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_3f4e2e.env.VISEME_RENDER_SECRET) {
    v_3f4675["Authorization"] = `Bearer ${v_3f4e2e.env.VISEME_RENDER_SECRET}`;
  }
  const v_0a6a65 = await fetch(v_555aed, {
    method: "POST",
    headers: v_3f4675,
    body: JSON.stringify({ cloneId: v_389afb, photoUrl: v_0838a4 }),
  });
  const v_9b6134 = await v_0a6a65.text();
  let v_931bf0;
  try {
    v_931bf0 = JSON.parse(v_9b6134);
  } catch {
    v_931bf0 = { raw: v_9b6134 };
  }
  return v_3f4e2e.json({ ok: v_0a6a65.ok, status: v_0a6a65.status, payload: v_931bf0 });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_02be30 = Math.min(Math.max(Number(v_f71b56.searchParams.get("limit") ?? 20) || 20, 1), 100);
  if (!v_ab6401) return v_3f4e2e.json({ users: [] });
  const v_2a1d60 = `%${v_ab6401}%`;
  const v_214b0d = Number(v_ab6401);
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, email, credits, credits_free, credits_sub, credits_topup,
              created_at AS createdAt
         FROM users
        WHERE deleted_at IS NULL
          AND (id = ? OR email LIKE ? OR name LIKE ?)
        ORDER BY id DESC
        LIMIT ?`,
    )
    .bind(Number.isFinite(v_214b0d) ? v_214b0d : -1, v_2a1d60, v_2a1d60, v_02be30)
    .all<Record<string, unknown>>();
  return v_3f4e2e.json({ users: v_18b8bf.results ?? [] });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_625c74 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, email, credits, credits_free, credits_sub, credits_topup
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_389afb)
    .first<Record<string, unknown>>();
  if (!v_625c74) throw new v_3ebe58("NOT_FOUND", "User not found.");

  const v_f0104f = await v_3f4e2e.env.DB
    .prepare(
      `SELECT gift_id, count, total_received, updated_at
         FROM user_gift_inventory
        WHERE user_id = ? AND count > 0
        ORDER BY updated_at DESC`,
    )
    .bind(v_389afb)
    .all<{ gift_id: string; count: number; total_received: number; updated_at: number }>();

  return v_3f4e2e.json({ user: v_625c74, inventory: v_f0104f.results ?? [] });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_43e90c = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_43e90c) || v_43e90c <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_4d33b2 = (await v_3f4e2e.req.json().catch(() => ({}))) as {
    giftId?: unknown; count?: unknown; reason?: unknown;
  };
  const v_96f93d = typeof v_4d33b2.giftId === "string" ? v_4d33b2.giftId.trim() : "";
  const v_e9396c = Number(v_4d33b2.count);
  if (!v_96f93d || !Number.isInteger(v_e9396c) || v_e9396c === 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "giftId + integer count(≠0) required.");
  }
  const v_58ca36 = typeof v_4d33b2.reason === "string" ? v_4d33b2.reason.slice(0, 200) : "admin inject";

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at)
           VALUES (?, ?, MAX(?, 0), MAX(?, 0), strftime('%s','now'))
         ON CONFLICT(user_id, gift_id) DO UPDATE SET
           count = MAX(count + ?, 0),
           total_received = total_received + MAX(?, 0),
           updated_at = strftime('%s','now')`,
      )
      .bind(v_43e90c, v_96f93d, v_e9396c, v_e9396c, v_e9396c, v_e9396c),
    v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
           VALUES (?, NULL, ?, ?, 0, ?, ?)`,
      )
      .bind(v_43e90c, v_96f93d, Math.abs(v_e9396c), v_e9396c > 0 ? "received" : "swapped", `admin_inject:${v_58ca36}`),
  ]);

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT count, total_received FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?`)
    .bind(v_43e90c, v_96f93d)
    .first<{ count: number; total_received: number }>();
  return v_3f4e2e.json({ ok: true, giftId: v_96f93d, delta: v_e9396c, current: v_3ac7e7 });
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

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_43e90c = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_43e90c) || v_43e90c <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_4d33b2 = (await v_3f4e2e.req.json().catch(() => ({}))) as { seconds?: unknown; reason?: unknown };
  const v_ec1a55 = Number(v_4d33b2.seconds);
  if (!Number.isInteger(v_ec1a55) || v_ec1a55 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "seconds must be a positive integer.");
  }
  const v_67e77e = Date.now();
  const v_fca18b = 5 * 365 * 24 * 60 * 60 * 1000;
  const v_62c866 = `admin:${v_ec1a55}:${v_67e77e}`;
  const v_58ca36 = typeof v_4d33b2.reason === "string" ? v_4d33b2.reason.slice(0, 200) : "admin grant";

  const v_b92ed2 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
         VALUES (?, ?, 'admin_grant', ?, ?)
         RETURNING id`,
    )
    .bind(v_43e90c, v_ec1a55, v_58ca36, v_62c866)
    .first<{ id: number }>();
  if (!v_b92ed2) throw new v_3ebe58("INTERNAL_ERROR", "ledger insert failed.");

  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE users
          SET credits       = credits + ?,
              credits_topup = credits_topup + ?,
              updated_at    = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_ec1a55, v_ec1a55, v_43e90c)
    .run();

  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO credit_lots (user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(v_43e90c, v_ec1a55, v_ec1a55, v_67e77e, v_67e77e + v_fca18b, v_b92ed2.id)
    .run();

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT credits, credits_topup FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ credits: number; credits_topup: number }>();
  return v_3f4e2e.json({ ok: true, granted: v_ec1a55, balance: v_3ac7e7 });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_43e90c = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_43e90c) || v_43e90c <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_db0487 = [
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
  const v_a7f568 = [];
  for (const v_8d41d7 of v_db0487) {
    try {
      const v_cb35cb = await v_c226a5(v_3f4e2e.env, {
        userId: v_43e90c,
        type: v_8d41d7.type,
        title: v_8d41d7.title,
        body: v_8d41d7.body,
        skipEmail: true,
      });
      v_a7f568.push({
        type: v_8d41d7.type,
        inserted: v_cb35cb.inserted,
        pushAttempted: v_cb35cb.pushAttempted,
        pushSent: v_cb35cb.pushSent,
      });
    } catch (v_49263d) {
      v_a7f568.push({
        type: v_8d41d7.type,
        error: (v_49263d as Error).message ?? String(v_49263d),
      });
    }
  }
  return v_3f4e2e.json({ userId: v_43e90c, count: v_db0487.length, results: v_a7f568 });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_43e90c = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_43e90c) || v_43e90c <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_4d33b2 = (await v_3f4e2e.req.json().catch(() => ({}))) as { title?: unknown; body?: unknown };
  const v_9f1622 = typeof v_4d33b2.title === "string" && v_4d33b2.title ? v_4d33b2.title : "🧪 테스트 알림";
  const v_7ef175 = typeof v_4d33b2.body === "string" && v_4d33b2.body ? v_4d33b2.body : "관리자가 발송한 테스트 알림입니다.";

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT push_token, platform FROM user_devices
        WHERE user_id = ? AND push_token IS NOT NULL AND is_active = 1`,
    )
    .bind(v_43e90c)
    .all<{ push_token: string; platform: string }>();
  const v_1ba7e1 = (v_18b8bf.results ?? []).filter(
    (v_cb35cb) => v_cb35cb.push_token.startsWith("ExponentPushToken[") || v_cb35cb.push_token.startsWith("ExpoPushToken["),
  );
  if (v_1ba7e1.length === 0) {
    return v_3f4e2e.json({ attempted: 0, tickets: [], error: "활성 토큰 없음" });
  }
  const v_fa56e0 = v_1ba7e1.map((v_d5dda0) => ({
    to: v_d5dda0.push_token,
    title: v_9f1622,
    body: v_7ef175,
    sound: "default" as const,
  }));

  const v_8f00b9 = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(v_fa56e0),
  });
  const v_0b04f0 = (await v_8f00b9.json().catch(() => null)) as
    | { data?: Array<{ status?: string; message?: string; details?: { error?: string } }> }
    | null;
  const v_30338f = v_1ba7e1.map((v_d5dda0, v_ebec57) => {
    const v_8d41d7 = v_0b04f0?.data?.[v_ebec57];
    return {
      tokenPrefix: v_d5dda0.push_token.slice(0, 30),
      platform: v_d5dda0.platform,
      status: v_8d41d7?.status ?? "no-response",
      errorCode: v_8d41d7?.details?.error ?? null,
      message: v_8d41d7?.message ?? null,
    };
  });
  return v_3f4e2e.json({ attempted: v_1ba7e1.length, httpStatus: v_8f00b9.status, tickets: v_30338f });
});

v_b7f2b4.get("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_18b8bf = await v_3f4e2e.env.DB.prepare(
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
    .bind(v_389afb)
    .all();
  return v_3f4e2e.json({ userId: v_389afb, devices: v_18b8bf.results });
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
              created_at AS createdAt,
              soft_deleted_at AS softDeletedAt,
              suspended_until AS suspendedUntil,
              banned_until AS bannedUntil,
              face_biometric_consent AS faceBiometricConsent,
              face_biometric_consent_at AS faceBiometricConsentAt,
              call_learning_consent AS callLearningConsent,
              call_learning_consent_at AS callLearningConsentAt,
              marketing_consent AS marketingConsent,
              sso_consent_version AS ssoConsentVersion,
              sso_consent_at AS ssoConsentAt
         FROM users
        WHERE xrun_member_id = ?
        ORDER BY (deletion_state = 'active' AND deleted_at IS NULL) DESC, id DESC
        LIMIT 1`,
    )
    .bind(v_9b82b4)
    .first<{
      id: number;
      name: string | null;
      email: string;
      deletionState: string;
      createdAt: string | null;
      softDeletedAt: string | null;
      suspendedUntil: string | null;
      bannedUntil: string | null;
      faceBiometricConsent: number | null;
      faceBiometricConsentAt: number | null;
      callLearningConsent: number | null;
      callLearningConsentAt: number | null;
      marketingConsent: number | null;
      ssoConsentVersion: string | null;
      ssoConsentAt: string | null;
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

  const v_63754b = await v_3f4e2e.env.DB
    .prepare(
      `SELECT COUNT(*) AS cnt
         FROM comment_reports cmr
         JOIN feed_comments fc ON fc.id = cmr.comment_id
        WHERE fc.user_id = ?`,
    )
    .bind(v_625c74.id)
    .first<{ cnt: number }>();

  const v_4615a9 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT (
         (SELECT COUNT(*) FROM user_reports    WHERE reporter_id = ?) +
         (SELECT COUNT(*) FROM clone_reports   WHERE user_id     = ?) +
         (SELECT COUNT(*) FROM comment_reports WHERE user_id     = ?)
       ) AS cnt`,
    )
    .bind(v_625c74.id, v_625c74.id, v_625c74.id)
    .first<{ cnt: number }>();

  const v_eb7cab = await v_3f4e2e.env.DB
    .prepare(`SELECT reason FROM user_warnings WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`)
    .bind(v_625c74.id)
    .first<{ reason: string | null }>();

  return v_3f4e2e.json({
    user: { ...v_625c74, suspensionReason: v_eb7cab?.reason ?? null },
    clones: v_f891e6,
    cloneReportsCount: v_cf098c?.cnt ?? 0,
    userReportsCount: v_59cd44?.cnt ?? 0,
    commentReportsCount: v_63754b?.cnt ?? 0,

    reportsReceivedCount: (v_cf098c?.cnt ?? 0) + (v_59cd44?.cnt ?? 0) + (v_63754b?.cnt ?? 0),
    reportsMadeCount: v_4615a9?.cnt ?? 0,
  });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ action?: string; reason?: string }>()
    .catch(() => ({}) as { action?: string; reason?: string });
  const v_da0605 = ["clone_create_ban_lift", "account_ban_lift", "clone_restore", "account_restore", "warnings_clear"];
  const v_9b064f = v_4d33b2.action ?? "";
  if (!v_da0605.includes(v_9b064f)) throw new v_3ebe58("VALIDATION_FAILED", "Invalid action.");

  let v_badeaf = "";
  switch (v_9b064f) {
    case "clone_create_ban_lift":
      await v_3f4e2e.env.DB.prepare(`UPDATE users SET suspended_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_389afb).run();
      v_badeaf = "페르소나 생성 제한이 해제되었습니다.";
      break;
    case "account_ban_lift":
      await v_3f4e2e.env.DB.prepare(`UPDATE users SET banned_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_389afb).run();
      v_badeaf = "계정 사용 제한이 해제되었습니다.";
      break;
    case "clone_restore":

      await v_3f4e2e.env.DB.prepare(`UPDATE clones SET deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'soft_deleted'`).bind(v_389afb).run();
      v_badeaf = "페르소나가 복구되었습니다.";
      break;
    case "account_restore":

      await v_3f4e2e.env.DB.prepare(`UPDATE users SET deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_389afb).run();
      await v_3f4e2e.env.DB.prepare(`UPDATE clones SET deletion_state = 'active', soft_deleted_at = NULL, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'soft_deleted'`).bind(v_389afb).run();
      v_badeaf = "계정과 페르소나가 복구되었습니다.";
      break;
    case "warnings_clear":
      await v_3f4e2e.env.DB.prepare(`DELETE FROM user_warnings WHERE user_id = ?`).bind(v_389afb).run();
      v_badeaf = "경고 이력이 초기화되었습니다.";
      break;
  }

  await v_c226a5(v_3f4e2e.env, {
    userId: v_389afb,
    type: "moderation",
    title: "제재 해제 안내",
    body: v_4d33b2.reason?.trim() || v_badeaf,
    url: "afterlife://reports/received",
    data: { action: v_9b064f, manual: true, kind: "lift" },
    skipEmail: true,
  }).catch(() => {});

  return v_3f4e2e.json({ ok: true, action: v_9b064f, message: v_badeaf });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE users SET suspended_until = NULL, banned_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "User not found.");
  return v_3f4e2e.json({ ok: true });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ action?: string; suspendDays?: number | null; reason?: string; reportId?: number | null; reporterMessage?: string }>()
    .catch(() => ({}) as { action?: string; suspendDays?: number | null; reason?: string; reportId?: number | null; reporterMessage?: string });
  const v_da0605 = [
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

    "device_ban",
  ];
  const v_9b064f = v_4d33b2.action === "suspend" ? "clone_create_ban" : v_4d33b2.action ?? "";
  if (!v_da0605.includes(v_9b064f)) throw new v_3ebe58("VALIDATION_FAILED", "Invalid action.");

  const v_625c74 = await v_3f4e2e.env.DB
    .prepare(`SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_389afb)
    .first<{ id: number }>();
  if (!v_625c74) throw new v_3ebe58("NOT_FOUND", "User not found.");

  const v_6a53fd = Number.isInteger(v_4d33b2.suspendDays) && (v_4d33b2.suspendDays as number) > 0 ? (v_4d33b2.suspendDays as number) : 0;
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? 0;
  let v_c8eee3 = "";

  switch (v_9b064f) {
    case "warn":
      await v_3f4e2e.env.DB
        .prepare(`INSERT INTO user_warnings (user_id, admin_id, report_id, report_type, reason) VALUES (?, ?, NULL, 'manual', ?)`)
        .bind(v_389afb, v_db9be1, v_4d33b2.reason ?? "관리자 직접 경고")
        .run();
      v_c8eee3 = "관리자에 의해 경고가 발급되었습니다.";
      break;
    case "clone_create_ban":
      await v_3f4e2e.env.DB.prepare(`UPDATE users SET suspended_until = datetime('now', ?) WHERE id = ?`).bind(`+${v_6a53fd || 30} days`, v_389afb).run();
      v_c8eee3 = `${v_6a53fd || 30}일간 페르소나 생성이 제한됩니다.`;
      break;
    case "account_ban":
      await v_3f4e2e.env.DB.prepare(`UPDATE users SET banned_until = datetime('now', ?) WHERE id = ?`).bind(`+${v_6a53fd || 30} days`, v_389afb).run();
      v_c8eee3 = `${v_6a53fd || 30}일간 계정 사용이 정지됩니다.`;
      break;
    case "clone_deactivate":

      await v_3f4e2e.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = NULL, deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(v_389afb).run();
      v_c8eee3 = "보유 페르소나가 비활성화되었습니다.";
      break;
    case "clone_delete":
      await v_3f4e2e.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(v_389afb).run();
      v_c8eee3 = "보유 페르소나가 삭제되었습니다.";
      break;
    case "account_withdraw":

      await v_3f4e2e.env.DB.prepare(`UPDATE users SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_389afb).run();
      await v_3f4e2e.env.DB.prepare(`UPDATE clones SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND deletion_state = 'active'`).bind(v_389afb).run();
      v_c8eee3 = "관리자에 의해 계정이 강제 탈퇴 처리되었습니다.";
      break;

    case "comment_ban":
      await v_3f4e2e.env.DB.prepare(`UPDATE users SET comment_ban_until = datetime('now', ?) WHERE id = ?`).bind(`+${v_6a53fd || 30} days`, v_389afb).run();
      v_c8eee3 = `${v_6a53fd || 30}일간 댓글 작성이 제한됩니다.`;
      break;
    case "interaction_ban":
      await v_3f4e2e.env.DB.prepare(`UPDATE users SET interaction_ban_until = datetime('now', ?) WHERE id = ?`).bind(`+${v_6a53fd || 30} days`, v_389afb).run();
      v_c8eee3 = `${v_6a53fd || 30}일간 좋아요·팔로우가 제한됩니다.`;
      break;
    case "force_logout":

      await v_3f4e2e.env.DB.prepare(`UPDATE users SET session_epoch = session_epoch + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_389afb).run();
      v_c8eee3 = "모든 기기에서 로그아웃되었습니다. 다시 로그인해 주세요.";
      break;
    case "notify_only":

      v_c8eee3 = v_4d33b2.reason?.trim() || "관리자로부터 안내가 도착했습니다.";
      break;
    case "device_ban": {

      const v_085844 = await v_3f4e2e.env.DB
        .prepare(`SELECT DISTINCT device_id AS deviceId FROM user_devices WHERE user_id = ?`)
        .bind(v_389afb)
        .all<{ deviceId: string }>();
      const v_18b8bf = v_085844.results ?? [];
      const v_58ca36 = v_4d33b2.reason?.trim() || "관리자에 의한 디바이스 차단";
      for (const v_cb35cb of v_18b8bf) {
        await v_3f4e2e.env.DB
          .prepare(
            `INSERT INTO device_bans (device_id, banned_user_id, admin_id, reason)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(device_id) DO UPDATE SET
               reason = excluded.reason, admin_id = excluded.admin_id, created_at = CURRENT_TIMESTAMP`,
          )
          .bind(v_cb35cb.deviceId, v_389afb, v_db9be1, v_58ca36)
          .run();
      }
      v_c8eee3 = v_18b8bf.length
        ? `등록된 디바이스 ${v_18b8bf.length}대 재가입 차단이 적용되었습니다.`
        : "등록된 디바이스가 없어 device_ban 이 적용되지 않았습니다. (계정 강제 탈퇴만 진행 권장)";
      break;
    }
  }

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT suspended_until AS suspendedUntil, banned_until AS bannedUntil, comment_ban_until AS commentBanUntil, interaction_ban_until AS interactionBanUntil FROM users WHERE id = ?`)
    .bind(v_389afb)
    .first<{ suspendedUntil: string | null; bannedUntil: string | null; commentBanUntil: string | null; interactionBanUntil: string | null }>();

  const v_fc6e45 = (v_3a5fef): string | null => {
    if (!v_3a5fef) return null;
    const v_d799e2 = new Date(v_3a5fef.replace(" ", "T") + "Z").getTime() + 9 * 3600000;
    if (Number.isNaN(v_d799e2)) return null;
    const v_d5dda0 = new Date(v_d799e2);
    return `${v_d5dda0.getUTCFullYear()}년 ${v_d5dda0.getUTCMonth() + 1}월 ${v_d5dda0.getUTCDate()}일`;
  };

  if (v_9b064f === "account_ban") {
    const v_604a0d = v_fc6e45(v_3ac7e7?.bannedUntil ?? null);
    if (v_604a0d) v_c8eee3 = `${v_604a0d}까지 계정 사용이 정지됩니다. (신고 누적)`;
  } else if (v_9b064f === "clone_create_ban") {
    const v_604a0d = v_fc6e45(v_3ac7e7?.suspendedUntil ?? null);
    if (v_604a0d) v_c8eee3 = `${v_604a0d}까지 페르소나 생성이 제한됩니다. (신고 누적)`;
  } else if (v_9b064f === "comment_ban") {
    const v_604a0d = v_fc6e45(v_3ac7e7?.commentBanUntil ?? null);
    if (v_604a0d) v_c8eee3 = `${v_604a0d}까지 댓글 작성이 제한됩니다. (신고 누적)`;
  } else if (v_9b064f === "interaction_ban") {
    const v_604a0d = v_fc6e45(v_3ac7e7?.interactionBanUntil ?? null);
    if (v_604a0d) v_c8eee3 = `${v_604a0d}까지 좋아요·팔로우가 제한됩니다. (신고 누적)`;
  }

  const v_b6b0b7 =
    v_9b064f === "account_ban" || v_9b064f === "clone_create_ban" || v_9b064f === "comment_ban" || v_9b064f === "interaction_ban";
  const v_cc755a = v_b6b0b7
    ? v_c8eee3 || v_4d33b2.reason || "회원님에 대한 제재가 적용되었습니다."
    : v_4d33b2.reason || v_c8eee3 || "회원님에 대한 제재가 적용되었습니다.";

  await v_c226a5(v_3f4e2e.env, {
    userId: v_389afb,
    type: "moderation",
    title: v_9b064f === "warn" ? "신고 처리 안내" : "활동 제재 안내",
    body: v_cc755a,
    url: "afterlife://reports/received",
    data: { action: v_9b064f, manual: true, bannedUntil: v_3ac7e7?.bannedUntil ?? null, suspendedUntil: v_3ac7e7?.suspendedUntil ?? null },
    skipEmail: true,
  }).catch(() => {});

  const v_b0b8c8 = {
    warn: "경고 발급",
    clone_deactivate: "페르소나 비활성화",
    clone_delete: "페르소나 삭제",
    clone_create_ban: "페르소나 생성 제한",
    account_ban: "계정 사용 정지",
    account_withdraw: "계정 강제 탈퇴",
  };
  const v_5ea0fe = v_b0b8c8[v_9b064f] ?? "제재 적용";
  const v_3a9783 =
    v_4d33b2.reporterMessage?.trim() ||
    `회원님의 신고가 수락되었습니다. 적용된 조치: ${v_5ea0fe}.`;
  if (v_4d33b2.reportId && Number.isInteger(v_4d33b2.reportId) && (v_4d33b2.reportId as number) > 0) {

    const v_f10744 = await v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_reports
            SET status = 'actioned',
                reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
                reviewer_admin_id = COALESCE(reviewer_admin_id, ?),
                admin_message = ?
          WHERE id = ? AND status IN ('open','reviewed')
          RETURNING reporter_id AS reporterId`,
      )
      .bind(v_db9be1, v_3a9783, v_4d33b2.reportId)
      .first<{ reporterId: number }>();
    if (v_f10744?.reporterId) {

      await v_c226a5(v_3f4e2e.env, {
        userId: v_f10744.reporterId,
        type: "moderation",
        title: "신고 처리 완료",
        body: v_3a9783,
        url: "afterlife://reports/made",
        data: { action: v_9b064f, reportId: v_4d33b2.reportId, kind: "user_report_actioned" },
        skipEmail: true,
      }).catch(() => {});
    }
  }

  return v_3f4e2e.json({ ok: true, action: v_9b064f, suspendedUntil: v_3ac7e7?.suspendedUntil ?? null, bannedUntil: v_3ac7e7?.bannedUntil ?? null, message: v_c8eee3 });
});

v_b7f2b4.get("/reports", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_3b27d9 = v_f71b56.searchParams.get("type") ?? "all"; 
  const v_d308b5 = v_f71b56.searchParams.get("status") ?? ""; 
  const v_ca4710 = Number(v_f71b56.searchParams.get("minCount") ?? 0);
  const v_9c552d = Number(v_f71b56.searchParams.get("maxCount") ?? 0);
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_b1de41 = Number(v_f71b56.searchParams.get("targetId") ?? 0); 
  const v_3ab22a = Number(v_f71b56.searchParams.get("responsibleUserId") ?? 0); 
  const v_ae5cec = Number(v_f71b56.searchParams.get("reporterId") ?? 0); 
  const v_a13c2e = (v_f71b56.searchParams.get("from") ?? "").trim(); 
  const v_257132 = (v_f71b56.searchParams.get("to") ?? "").trim(); 
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

  if (v_3ab22a > 0) {
    v_abcc8d.push("r.responsibleUserId = ?");
    v_925171.push(v_3ab22a);
  }

  if (v_ae5cec > 0) {
    v_abcc8d.push("r.reporterId = ?");
    v_925171.push(v_ae5cec);
  }
  if (v_ca4710 > 0) {
    v_abcc8d.push("r.targetReportCount >= ?");
    v_925171.push(v_ca4710);
  }
  if (v_9c552d > 0) {
    v_abcc8d.push("r.targetReportCount <= ?");
    v_925171.push(v_9c552d);
  }
  if (v_a13c2e) {
    v_abcc8d.push("r.createdAt >= ?");
    v_925171.push(`${v_a13c2e} 00:00:00`);
  }
  if (v_257132) {
    v_abcc8d.push("r.createdAt <= ?");
    v_925171.push(`${v_257132} 23:59:59`);
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

async function v_d1a2ff(
  c: v_437670<v_de0a25>,
  v_7bef43,
  v_11eadf,
  v_d308b5,
  v_2bd5e3,
): Promise<void> {
  if (!v_11eadf) return;
  const v_2869c1 =
    v_d308b5 === "reviewed" ? "수락되었어요"
    : v_d308b5 === "dismissed" ? "반려되었어요"
    : v_d308b5 === "actioned" ? "조치되었어요"
    : "처리되었어요";
  const v_4d33b2 = v_2bd5e3?.trim() || `내가 접수한 신고가 ${v_2869c1}.`;
  await v_c226a5(v_3f4e2e.env, {
    userId: v_11eadf,
    type: "moderation",
    title: "내 신고 처리 안내",
    body: v_4d33b2,

    url: "afterlife://reports/made",
    data: { reportType: v_7bef43, status: v_d308b5 },
    skipEmail: true,
  }).catch(() => {});
}

async function v_19a475(
  c: v_437670<v_de0a25>,
  v_7bef43,
  v_99000e,
  v_489382,
  v_6e0fd3,
  v_7e89c9,
): Promise<number | undefined> {
  if (!v_489382) return undefined;
  const v_5b4e12 = await v_3f4e2e.env.DB
    .prepare(`SELECT 1 AS x FROM user_warnings WHERE report_id = ? AND report_type = ? LIMIT 1`)
    .bind(v_99000e, v_7bef43)
    .first();
  if (!v_5b4e12) {
    const v_db9be1 = v_3f4e2e.get("adminUserId") ?? 0;
    await v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO user_warnings (user_id, admin_id, report_id, report_type, reason) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(v_489382, v_db9be1, v_99000e, v_7bef43, v_7e89c9)
      .run();
  }
  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`)
    .bind(v_489382)
    .first<{ n: number }>();
  const v_e87618 = v_7b3f91?.n ?? 0;
  if (v_5b4e12) return v_e87618; 

  void v_6e0fd3;
  await v_c226a5(v_3f4e2e.env, {
    userId: v_489382,
    type: "moderation",
    title: "신고 처리 안내",
    body: v_7e89c9 || "회원님에 대한 신고가 처리되었습니다.",
    url: "afterlife://reports/received",
    data: { warningCount: v_e87618 },
    skipEmail: true,
  }).catch(() => {});

  return v_e87618;
}

const v_37dc27 = ["open", "reviewed", "dismissed"] as const;
v_b7f2b4.patch("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string }>()
    .catch(() => ({}) as { status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string });
  const v_d308b5 = v_4d33b2.status ?? "";
  if (!(v_37dc27 as readonly string[]).includes(v_d308b5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid status.");
  }
  const v_c403c7 = v_d308b5 === "open";

  const v_2bd5e3 = v_c403c7 ? null : (v_4d33b2.reporterMessage ?? v_4d33b2.adminMessage ?? null);
  const v_94b0c4 = v_c403c7 ? null : (v_4d33b2.targetMessage ?? v_4d33b2.adminMessage ?? null);

  const v_7e89c9 = v_94b0c4;

  const v_901936 = v_c403c7 ? "reviewed_at = NULL" : "reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)";
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE clone_reports SET status = ?, ${v_901936}, admin_message = ?, reporter_message = ?, target_message = ? WHERE id = ?`)
    .bind(v_d308b5, v_7e89c9, v_2bd5e3, v_94b0c4, v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");

  let v_e87618;
  if (v_d308b5 === "reviewed") {
    const v_257b90 = await v_3f4e2e.env.DB
      .prepare(
        `SELECT cl.owner_id AS ownerId, cr.clone_id AS cloneId FROM clone_reports cr JOIN clones cl ON cl.id = cr.clone_id WHERE cr.id = ?`,
      )
      .bind(v_389afb)
      .first<{ ownerId: number; cloneId: number }>();
    v_e87618 = await v_19a475(v_3f4e2e, "clone", v_389afb, v_257b90?.ownerId, v_257b90?.cloneId, v_7e89c9);
  }

  if (!v_c403c7) {
    const v_f10744 = await v_3f4e2e.env.DB
      .prepare(`SELECT user_id AS reporterId FROM clone_reports WHERE id = ?`)
      .bind(v_389afb)
      .first<{ reporterId: number | null }>();
    await v_d1a2ff(v_3f4e2e, "clone", v_f10744?.reporterId, v_d308b5, v_2bd5e3);
  }
  return v_3f4e2e.json({ ok: true, id: v_389afb, status: v_d308b5, adminMessage: v_7e89c9, warningCount: v_e87618 });
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
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string }>()
    .catch(() => ({}) as { status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string });
  const v_d308b5 = v_4d33b2.status ?? "";
  if (!(v_28cef1 as readonly string[]).includes(v_d308b5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid status.");
  }
  const v_c403c7 = v_d308b5 === "open";

  const v_2bd5e3 = v_c403c7 ? null : (v_4d33b2.reporterMessage ?? v_4d33b2.adminMessage ?? null);
  const v_94b0c4 = v_c403c7 ? null : (v_4d33b2.targetMessage ?? v_4d33b2.adminMessage ?? null);

  const v_7e89c9 = v_94b0c4;

  const v_901936 = v_c403c7 ? "reviewed_at = NULL" : "reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)";
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE user_reports SET status = ?, ${v_901936}, admin_message = ?, reporter_message = ?, target_message = ? WHERE id = ?`)
    .bind(v_d308b5, v_7e89c9, v_2bd5e3, v_94b0c4, v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");

  let v_e87618;
  if (v_d308b5 === "reviewed") {
    const v_f10744 = await v_3f4e2e.env.DB
      .prepare(`SELECT target_id AS targetId FROM user_reports WHERE id = ?`)
      .bind(v_389afb)
      .first<{ targetId: number }>();
    v_e87618 = await v_19a475(v_3f4e2e, "user", v_389afb, v_f10744?.targetId, null, v_7e89c9);
  }

  if (!v_c403c7) {
    const v_f10744 = await v_3f4e2e.env.DB
      .prepare(`SELECT reporter_id AS reporterId FROM user_reports WHERE id = ?`)
      .bind(v_389afb)
      .first<{ reporterId: number | null }>();
    await v_d1a2ff(v_3f4e2e, "user", v_f10744?.reporterId, v_d308b5, v_2bd5e3);
  }
  return v_3f4e2e.json({ ok: true, id: v_389afb, status: v_d308b5, adminMessage: v_7e89c9, warningCount: v_e87618 });
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
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string }>()
    .catch(() => ({}) as { status?: string; adminMessage?: string; reporterMessage?: string; targetMessage?: string });
  const v_d308b5 = v_4d33b2.status ?? "";
  if (!(v_f0881e as readonly string[]).includes(v_d308b5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid status.");
  }
  const v_c403c7 = v_d308b5 === "open";

  const v_2bd5e3 = v_c403c7 ? null : (v_4d33b2.reporterMessage ?? v_4d33b2.adminMessage ?? null);
  const v_94b0c4 = v_c403c7 ? null : (v_4d33b2.targetMessage ?? v_4d33b2.adminMessage ?? null);

  const v_7e89c9 = v_94b0c4;

  const v_901936 = v_c403c7 ? "reviewed_at = NULL" : "reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)";
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE comment_reports SET status = ?, ${v_901936}, admin_message = ?, reporter_message = ?, target_message = ? WHERE id = ?`)
    .bind(v_d308b5, v_7e89c9, v_2bd5e3, v_94b0c4, v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Report not found.");

  let v_e87618;
  if (v_d308b5 === "reviewed") {
    const v_abe745 = await v_3f4e2e.env.DB
      .prepare(`SELECT user_id AS authorId FROM feed_comments WHERE id = (SELECT comment_id FROM comment_reports WHERE id = ?)`)
      .bind(v_389afb)
      .first<{ authorId: number }>();
    const v_cb05c2 = await v_3f4e2e.env.DB
      .prepare(`SELECT clone_id AS cloneId FROM comment_reports WHERE id = ?`)
      .bind(v_389afb)
      .first<{ cloneId: number }>();
    v_e87618 = await v_19a475(v_3f4e2e, "comment", v_389afb, v_abe745?.authorId, v_cb05c2?.cloneId, v_7e89c9);
  }

  if (!v_c403c7) {
    const v_f10744 = await v_3f4e2e.env.DB
      .prepare(`SELECT user_id AS reporterId FROM comment_reports WHERE id = ?`)
      .bind(v_389afb)
      .first<{ reporterId: number | null }>();
    await v_d1a2ff(v_3f4e2e, "comment", v_f10744?.reporterId, v_d308b5, v_2bd5e3);
  }
  return v_3f4e2e.json({ ok: true, id: v_389afb, status: v_d308b5, adminMessage: v_7e89c9, warningCount: v_e87618 });
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

  const v_33d725 = new URL(v_3f4e2e.req.url).searchParams.get("commentType") ?? "all";

  const v_abcc8d = ["f.clone_id = ?"];
  const v_925171 = [v_6e0fd3];
  if (v_33d725 === "parent") v_abcc8d.push("fcc.parent_comment_id IS NULL");
  else if (v_33d725 === "reply") v_abcc8d.push("fcc.parent_comment_id IS NOT NULL");
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

v_b7f2b4.get("/intimacy-events", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_2257df = v_f71b56.searchParams.get("userId");
  const v_6c2092 = v_f71b56.searchParams.get("cloneId");
  const v_9b064f = (v_f71b56.searchParams.get("action") ?? "").trim();
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_3bbadf = Math.max(0, Number(v_f71b56.searchParams.get("offset") ?? 0));

  const v_abcc8d = [];
  const v_925171 = [];
  if (v_2257df && /^\d+$/.test(v_2257df)) {
    v_abcc8d.push("ie.user_id = ?");
    v_925171.push(Number(v_2257df));
  }
  if (v_6c2092 && /^\d+$/.test(v_6c2092)) {
    v_abcc8d.push("ie.clone_id = ?");
    v_925171.push(Number(v_6c2092));
  }
  if (v_9b064f && ["chat", "call", "learn", "feed"].includes(v_9b064f)) {
    v_abcc8d.push("ie.action = ?");
    v_925171.push(v_9b064f);
  }
  const v_8b4d7e = v_abcc8d.length ? `WHERE ${v_abcc8d.join(" AND ")}` : "";

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM intimacy_events ie ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ n: number }>();
  const v_c83285 = v_0dab8e?.n ?? 0;

  const v_18b8bf = await v_3f4e2e.env.DB
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
         ${v_8b4d7e}
        ORDER BY ie.created_at DESC, ie.id DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...v_925171, v_02be30, v_3bbadf)
    .all();

  return v_3f4e2e.json({ items: v_18b8bf.results, total: v_c83285, limit: v_02be30, offset: v_3bbadf });
});

v_b7f2b4.get("/conversations", v_c0a297, async (v_3f4e2e) => {
  const v_f4fb5e = v_3f4e2e.req.query("user_email");
  if (!v_f4fb5e) {
    return v_3f4e2e.json({ error: "user_email query required" }, 400);
  }

  const v_d1b635 = await v_3f4e2e.env.DB
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind(v_f4fb5e)
    .first<{ id: number }>();
  if (!v_d1b635) {
    return v_3f4e2e.json({ user_id: null, clones: [] });
  }
  const v_43e90c = v_d1b635.id;

  const v_c2273d = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, created_at
         FROM clones
        WHERE owner_id = ? AND deleted_at IS NULL
        ORDER BY id DESC`,
    )
    .bind(v_43e90c)
    .all<{ id: number; name: string; created_at: string }>();
  const v_f891e6 = v_c2273d.results ?? [];

  const v_d2cdb4 = "https://rtc.example.invalid/prethird";
  const v_43fd42 = v_3f4e2e.env.LEARN_SECRET ?? "";
  const v_a7f568 = await Promise.all(
    v_f891e6.map(async (v_eb25ce) => {
      try {
        const v_eb792a = await fetch(`${v_d2cdb4}/oth-path${v_eb25ce.id}`, {
          headers: { Authorization: `Bearer ${v_43fd42}` },
        });
        if (!v_eb792a.ok) {
          return { ...v_eb25ce, items: [], error: `HTTP ${v_eb792a.status}` };
        }
        const v_4d33b2 = (await v_eb792a.json()) as { items?: unknown[]; count?: number };
        return { ...v_eb25ce, items: v_4d33b2.items ?? [], count: v_4d33b2.count ?? 0 };
      } catch (v_49263d) {
        return { ...v_eb25ce, items: [], error: String(v_49263d) };
      }
    }),
  );

  return v_3f4e2e.json({ user_id: v_43e90c, user_email: v_f4fb5e, clones: v_a7f568 });
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_062ae9 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_062ae9)) {
    return v_3f4e2e.json({ error: "invalid clone id" }, 400);
  }
  const v_4d33b2 = await v_3f4e2e.req.json<{ text?: string }>().catch(() => ({} as { text?: string }));
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  if (!v_9b6134) return v_3f4e2e.json({ error: "text required" }, 400);
  if (v_9b6134.length > 500) return v_3f4e2e.json({ error: "text too long (max 500)" }, 400);

  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare("SELECT voice_se_url, voice_preset_id FROM clones WHERE id = ?")
    .bind(v_062ae9)
    .first<{ voice_se_url: string | null; voice_preset_id: number | null }>();
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone not found" }, 404);

  let v_2f693a = null;
  if (v_eb25ce.voice_preset_id) {
    const v_324e3c = await v_3f4e2e.env.DB
      .prepare("SELECT se_key FROM voice_presets WHERE id = ? AND is_active = 1")
      .bind(v_eb25ce.voice_preset_id)
      .first<{ se_key: string | null }>();
    v_2f693a = v_324e3c?.se_key ?? null;
  }
  if (!v_2f693a && !v_eb25ce.voice_se_url) {
    return v_3f4e2e.json({ error: "clone has no voice_se available" }, 404);
  }

  const v_43fd42 = v_3f4e2e.env.LEARN_SECRET ?? "";
  if (!v_43fd42) return v_3f4e2e.json({ error: "LEARN_SECRET not configured" }, 500);
  try {
    const v_931bf0 = { text: v_9b6134, clone_id: v_062ae9 };
    if (v_2f693a) v_931bf0.se_key = v_2f693a;
    if (v_eb25ce.voice_se_url) v_931bf0.voice_se_url = v_eb25ce.voice_se_url;
    const v_eb792a = await fetch("https://rtc.example.invalid/prethird/admin/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": v_43fd42,
      },
      body: JSON.stringify(v_931bf0),
    });
    if (!v_eb792a.ok) {
      const v_9be017 = await v_eb792a.text().catch(() => "");
      return v_3f4e2e.json(
        { error: `prethird ${v_eb792a.status}: ${v_9be017.slice(0, 200)}` },
        v_eb792a.status as 400 | 500,
      );
    }
    const v_7ab8bd = await v_eb792a.arrayBuffer();
    return new Response(v_7ab8bd, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `upstream: ${String(v_9e86fd)}` }, 502);
  }
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_062ae9 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_062ae9)) return v_3f4e2e.json({ error: "invalid clone id" }, 400);

  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare("SELECT image_url FROM clones WHERE id = ? AND deleted_at IS NULL")
    .bind(v_062ae9)
    .first<{ image_url: string | null }>();
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone not found" }, 404);
  if (!v_eb25ce.image_url) return v_3f4e2e.json({ error: "clone has no image_url" }, 400);

  const v_43fd42 = v_3f4e2e.env.LEARN_SECRET ?? "";
  if (!v_43fd42) return v_3f4e2e.json({ error: "LEARN_SECRET not configured" }, 500);

  const v_694b25 = v_3f4e2e.env.CALL_PRETHIRD_BASE || "https://rtc.example.invalid/prethird";
  const v_0a6a65 = `${v_694b25.replace(/\/$/, "")}/oth-path`;
  try {
    const v_eb792a = await fetch(v_0a6a65, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": v_43fd42,
      },
      body: JSON.stringify({ face_image_url: v_eb25ce.image_url, clone_id: v_062ae9 }),
    });
    if (!v_eb792a.ok) {
      const v_9b6134 = await v_eb792a.text().catch(() => "");
      return v_3f4e2e.json({ error: `upstream ${v_eb792a.status}: ${v_9b6134.slice(0, 200)}` }, 502);
    }
    const v_9390e8 = await v_eb792a.json().catch(() => null);
    if (!v_9390e8) return v_3f4e2e.json({ error: "upstream non-JSON" }, 502);
    return v_3f4e2e.json(v_9390e8);
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `upstream: ${String(v_9e86fd)}` }, 502);
  }
});

v_b7f2b4.post("/oth-path", v_c0a297, async (v_3f4e2e) => {
  const v_062ae9 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_062ae9)) return v_3f4e2e.json({ error: "invalid clone id" }, 400);

  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare("SELECT id FROM clones WHERE id = ? AND deleted_at IS NULL")
    .bind(v_062ae9)
    .first<{ id: number }>();
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone not found" }, 404);

  let v_4d33b2;
  try {
    v_4d33b2 = await v_3f4e2e.req.json();
  } catch {
    return v_3f4e2e.json({ error: "invalid json" }, 400);
  }
  const v_4622b9 = Array.isArray(v_4d33b2.visemes) ? v_4d33b2.visemes : [];
  if (v_4622b9.length !== 10) return v_3f4e2e.json({ error: "10 visemes required" }, 400);

  const v_da110c = ["REST", "A", "E", "I", "O", "U", "EO", "EU", "BILAB", "DENT"];
  const v_110a8b = new Set<string>();
  const v_5bfece = [];
  for (const v_8c0b26 of v_4622b9) {
    const v_81e2ef = (v_8c0b26?.v ?? "").toString().toUpperCase();
    if (!v_da110c.includes(v_81e2ef)) return v_3f4e2e.json({ error: `unknown viseme: ${v_81e2ef}` }, 400);
    if (v_110a8b.has(v_81e2ef)) return v_3f4e2e.json({ error: `duplicate viseme: ${v_81e2ef}` }, 400);
    v_110a8b.add(v_81e2ef);
    const v_8a9589 = v_8c0b26?.png_b64 ?? "";
    if (typeof v_8a9589 !== "string" || v_8a9589.length === 0) return v_3f4e2e.json({ error: `empty png for ${v_81e2ef}` }, 400);

    let v_d8cac9;
    try { v_d8cac9 = atob(v_8a9589); } catch { return v_3f4e2e.json({ error: `invalid base64 for ${v_81e2ef}` }, 400); }
    if (v_d8cac9.length > 5 * 1024 * 1024) return v_3f4e2e.json({ error: `png too large for ${v_81e2ef}` }, 400);
    const v_83ee53 = new Uint8Array(v_d8cac9.length);
    for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_83ee53[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
    v_5bfece.push({
      key: `visemes/${v_062ae9}/oth-path_${v_81e2ef.toLowerCase()}.png`,
      buf: v_83ee53,
    });
  }
  if (v_110a8b.size !== 10) return v_3f4e2e.json({ error: "missing viseme(s)" }, 400);

  try {
    await Promise.all(
      v_5bfece.map((v_ceb55a) =>
        v_3f4e2e.env.R2_ARCHIVE.put(v_ceb55a.key, v_ceb55a.buf, {
          httpMetadata: { contentType: "image/png" },
          customMetadata: { purpose: "viseme", cloneId: String(v_062ae9) },
        }),
      ),
    );
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `R2 put failed: ${String(v_9e86fd)}` }, 502);
  }

  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_cd931c = `${v_f17108}/oth-path${v_062ae9}/`;
  const v_5c2f9f = Date.now();
  try {
    await v_3f4e2e.env.DB
      .prepare("UPDATE clones SET viseme_prefix = ?, viseme_version = ?, viseme_generated_at = ? WHERE id = ?")
      .bind(v_cd931c, "v1-pil", v_5c2f9f, v_062ae9)
      .run();
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `D1 update failed: ${String(v_9e86fd)}` }, 500);
  }

  return v_3f4e2e.json({
    ok: true,
    visemePrefix: v_cd931c,
    visemeVersion: "v1-pil",
    visemeGeneratedAt: v_5c2f9f,
    uploaded: v_5bfece.length,
  });
});

v_b7f2b4.post("/face-test/match", v_c0a297, async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json<{
    vector?: number[];
    userId?: number;
    cloneId?: number;
    topK?: number;
  }>().catch(() => ({} as { vector?: number[]; userId?: number; cloneId?: number; topK?: number }));

  const v_81e2ef = v_4d33b2.vector;
  if (!Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || v_81e2ef.some((v_62c214) => typeof v_62c214 !== "number" || !Number.isFinite(v_62c214))) {
    throw new v_3ebe58("VALIDATION_FAILED", "vector: 512차원 수치 배열이어야 합니다");
  }
  const v_43e90c = v_4d33b2.userId;
  if (typeof v_43e90c !== "number" || !Number.isInteger(v_43e90c) || v_43e90c <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "userId: 양의 정수여야 합니다");
  }
  const v_6e0fd3 = v_4d33b2.cloneId;
  if (typeof v_6e0fd3 !== "number" || !Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");
  }
  const v_171a8a = Math.max(1, Math.min(10, v_4d33b2.topK ?? 5));

  const { queryCloneScope: v_97be02 } = await import("../lib/cloneFaceScope");
  const v_495447 = await v_97be02(v_3f4e2e.env, { userId: v_43e90c, cloneId: v_6e0fd3, vector: v_81e2ef, topK: v_171a8a });

  const v_52e08b = v_495447.map((v_35f85c) => v_35f85c.personId);
  const v_77b1ac = new Map<number, string | null>();
  if (v_52e08b.length) {
    const v_315151 = await v_3f4e2e.env.DB.prepare(
      `SELECT p.id, p.display_name FROM persons p WHERE p.user_id = ? AND p.clone_id = ? AND p.id IN (${v_52e08b.map(() => "?").join(",")})`,
    ).bind(v_43e90c, v_6e0fd3, ...v_52e08b).all<{ id: number; display_name: string | null }>();
    for (const v_3ac7e7 of v_315151.results) v_77b1ac.set(v_3ac7e7.id, v_3ac7e7.display_name);
  }
  const v_a49907 = v_495447.map((v_35f85c) => ({
    personId: v_35f85c.personId,
    displayName: v_77b1ac.get(v_35f85c.personId) ?? null,
    score: v_35f85c.score,
  }));

  const v_01dcf5 = await v_3f4e2e.env.DB.prepare(
    "SELECT value FROM app_config WHERE key = 'face.match_threshold'",
  ).first<{ value: string }>();
  const v_8a58fa = v_01dcf5?.value != null && Number.isFinite(Number(v_01dcf5.value)) ? Number(v_01dcf5.value) : 0.55;

  return v_3f4e2e.json({
    matches: v_a49907,
    matchThreshold: v_8a58fa,
    autoEnrollThreshold: 0.75, 
  });
});

v_b7f2b4.get("/gifts/events", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_40e259 = Number(v_f71b56.searchParams.get("offset") ?? 0);
  const v_3bbadf = Math.max(0, Number.isFinite(v_40e259) ? v_40e259 : 0);
  const v_f7e120 = v_f71b56.searchParams.get("senderId");
  const v_43d534 = v_f71b56.searchParams.get("receiverId");
  const v_96f93d = v_f71b56.searchParams.get("giftId");
  const v_a13c2e = v_f71b56.searchParams.get("from");
  const v_257132 = v_f71b56.searchParams.get("to");
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();

  const v_abcc8d = ["e.kind = 'sent'"];
  const v_925171 = [];
  if (v_f7e120) { v_abcc8d.push("e.user_id = ?"); v_925171.push(Number(v_f7e120)); }
  if (v_43d534) { v_abcc8d.push("e.counterpart_user_id = ?"); v_925171.push(Number(v_43d534)); }
  if (v_96f93d) { v_abcc8d.push("e.gift_id = ?"); v_925171.push(v_96f93d); }
  if (v_a13c2e) { v_abcc8d.push("e.created_at >= ?"); v_925171.push(Number(v_a13c2e)); }
  if (v_257132) { v_abcc8d.push("e.created_at <= ?"); v_925171.push(Number(v_257132)); }
  if (v_ab6401) {
    v_abcc8d.push("(us.email LIKE ? OR us.name LIKE ? OR ur.email LIKE ? OR ur.name LIKE ?)");
    const v_2a1d60 = `%${v_ab6401}%`;
    v_925171.push(v_2a1d60, v_2a1d60, v_2a1d60, v_2a1d60);
  }
  const v_8b4d7e = `WHERE ${v_abcc8d.join(" AND ")}`;

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT e.id                      AS id,
              e.user_id                 AS senderId,
              us.email                  AS senderEmail,
              us.name                   AS senderName,
              e.counterpart_user_id     AS receiverId,
              ur.email                  AS receiverEmail,
              ur.name                   AS receiverName,
              e.gift_id                 AS giftId,
              e.gift_name_snapshot      AS giftNameSnap,
              e.gift_emoji_snapshot     AS giftEmojiSnap,
              e.gift_image_url_snapshot AS giftImageUrlSnap,
              e.count                   AS count,
              e.xrun_amount             AS xrunAmount,
              e.created_at              AS createdAt
         FROM gift_inventory_events e
         LEFT JOIN users us ON us.id = e.user_id
         LEFT JOIN users ur ON ur.id = e.counterpart_user_id
         ${v_8b4d7e}
         ORDER BY e.created_at DESC
         LIMIT ? OFFSET ?`,
    )
    .bind(...v_925171, v_02be30, v_3bbadf)
    .all<{
      id: number;
      senderId: number;
      senderEmail: string | null;
      senderName: string | null;
      receiverId: number | null;
      receiverEmail: string | null;
      receiverName: string | null;
      giftId: string;
      giftNameSnap: string | null;
      giftEmojiSnap: string | null;
      giftImageUrlSnap: string | null;
      count: number;
      xrunAmount: number;
      createdAt: number;
    }>();

  const v_679404 = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM gift_inventory_events e LEFT JOIN users us ON us.id = e.user_id LEFT JOIN users ur ON ur.id = e.counterpart_user_id ${v_8b4d7e}`)
    .bind(...v_925171)
    .first<{ n: number }>();

  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const v_6413c7 = new Map(v_dbebe7.map((v_206b88) => [v_206b88.id, v_206b88]));

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    const v_ab4c96 = v_6413c7.get(v_cb35cb.giftId);
    return {
      id: v_cb35cb.id,
      senderId: v_cb35cb.senderId,
      senderEmail: v_cb35cb.senderEmail,
      senderName: v_cb35cb.senderName,
      receiverId: v_cb35cb.receiverId,
      receiverEmail: v_cb35cb.receiverEmail,
      receiverName: v_cb35cb.receiverName,
      giftId: v_cb35cb.giftId,
      count: v_cb35cb.count,
      xrunAmount: v_cb35cb.xrunAmount,
      createdAt: v_cb35cb.createdAt,
      giftName: v_cb35cb.giftNameSnap ?? v_ab4c96?.name ?? v_cb35cb.giftId,
      giftEmoji: v_cb35cb.giftEmojiSnap ?? v_ab4c96?.emoji ?? "🎁",
      giftImageUrl: v_cb35cb.giftImageUrlSnap ?? v_ab4c96?.imageUrl ?? null,
    };
  });

  return v_3f4e2e.json({ items: v_4622b9, total: v_679404?.n ?? 0, limit: v_02be30, offset: v_3bbadf });
});

