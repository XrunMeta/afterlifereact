

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_c0a297 } from "../middleware/auth";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";

export const v_0197eb = new v_b7c41b<v_de0a25>();
export const v_29738c = new v_b7c41b<v_de0a25>();

interface EmergencyNoticeRow {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  severity_level: number;
  is_active: number;
  start_time: number | null;
  end_time: number | null;
  created_at: number;
  updated_at: number;
}

const v_722b6d = v_1f4ea7.object({
  title: v_1f4ea7.string().min(1).max(200),
  description: v_1f4ea7.string().max(2000).nullable().optional(),
  link: v_1f4ea7.string().max(2000).nullable().optional(),
  severity_level: v_1f4ea7.number().int().min(1).max(4).optional(),
  is_active: v_1f4ea7.union([v_1f4ea7.literal(0), v_1f4ea7.literal(1)]).optional(),
  start_time: v_1f4ea7.number().int().nullable().optional(),
  end_time: v_1f4ea7.number().int().nullable().optional(),
});

const v_90be18 = v_1f4ea7.object({
  title: v_1f4ea7.string().min(1).max(200).optional(),
  description: v_1f4ea7.string().max(2000).nullable().optional(),
  link: v_1f4ea7.string().max(2000).nullable().optional(),
  severity_level: v_1f4ea7.number().int().min(1).max(4).optional(),
  is_active: v_1f4ea7.union([v_1f4ea7.literal(0), v_1f4ea7.literal(1)]).optional(),
  start_time: v_1f4ea7.number().int().nullable().optional(),
  end_time: v_1f4ea7.number().int().nullable().optional(),
});

v_0197eb.get("/", v_c0a297, async (v_3f4e2e) => {
  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, title, description, link, severity_level, is_active,
              start_time, end_time, created_at, updated_at
         FROM emergency_notices
        ORDER BY created_at DESC
        LIMIT 500`,
    )
    .all<EmergencyNoticeRow>();
  return v_3f4e2e.json({ items: v_8f00b9.results ?? [] });
});

v_0197eb.post("/", v_c0a297, async (v_3f4e2e) => {
  const v_148ff6 = await v_4c95c2(v_3f4e2e, v_722b6d);
  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO emergency_notices
         (title, description, link, severity_level, is_active, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, title, description, link, severity_level, is_active,
                 start_time, end_time, created_at, updated_at`,
    )
    .bind(
      v_148ff6.title,
      v_148ff6.description ?? null,
      v_148ff6.link ?? null,
      v_148ff6.severity_level ?? 2,
      v_148ff6.is_active ?? 1,
      v_148ff6.start_time ?? null,
      v_148ff6.end_time ?? null,
    )
    .first<EmergencyNoticeRow>();
  return v_3f4e2e.json({ item: v_43af15 }, 201);
});

v_0197eb.patch("/:id", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  }
  const v_148ff6 = await v_4c95c2(v_3f4e2e, v_90be18);
  const v_712957 = [];
  const v_925171 = [];
  const mapping: Array<[keyof typeof v_148ff6, string]> = [
    ["title", "title"],
    ["description", "description"],
    ["link", "link"],
    ["severity_level", "severity_level"],
    ["is_active", "is_active"],
    ["start_time", "start_time"],
    ["end_time", "end_time"],
  ];
  for (const [v_0eb677, v_c8b83f] of v_b3439a) {
    if (v_148ff6[v_0eb677] !== undefined) {
      v_712957.push(`${v_c8b83f} = ?`);
      v_925171.push(v_148ff6[v_0eb677]);
    }
  }
  if (v_712957.length === 0) throw new v_3ebe58("VALIDATION_FAILED", "No fields to update.");
  v_712957.push(`updated_at = (unixepoch() * 1000)`);
  v_925171.push(v_389afb);
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`UPDATE emergency_notices SET ${v_712957.join(", ")} WHERE id = ?`)
    .bind(...v_925171)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Emergency notice not found.");
  return v_3f4e2e.json({ ok: true });
});

v_0197eb.delete("/:id", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  }
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`DELETE FROM emergency_notices WHERE id = ?`)
    .bind(v_389afb)
    .run();
  if (!v_cb35cb.meta.changes) throw new v_3ebe58("NOT_FOUND", "Emergency notice not found.");
  return v_3f4e2e.json({ ok: true });
});

v_29738c.get("/active", async (v_3f4e2e) => {
  const v_5c2f9f = Date.now();
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, title, description, link, severity_level
         FROM emergency_notices
        WHERE is_active = 1
          AND (start_time IS NULL OR start_time <= ?)
          AND (end_time IS NULL OR end_time > ?)
        ORDER BY severity_level DESC, id DESC
        LIMIT 1`,
    )
    .bind(v_5c2f9f, v_5c2f9f)
    .first<{
      id: number;
      title: string;
      description: string | null;
      link: string | null;
      severity_level: number;
    }>();

  v_3f4e2e.header("Cache-Control", "public, max-age=60");
  return v_3f4e2e.json({ notice: v_3ac7e7 ?? null });
});
