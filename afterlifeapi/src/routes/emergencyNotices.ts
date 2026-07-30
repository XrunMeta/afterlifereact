

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import { parseJson, z } from "../lib/validate";

export const emergencyNoticesAdmin = new Hono<AppEnv>();
export const emergencyNoticesPublic = new Hono<AppEnv>();

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

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  link: z.string().max(2000).nullable().optional(),
  severity_level: z.number().int().min(1).max(4).optional(),
  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
  start_time: z.number().int().nullable().optional(),
  end_time: z.number().int().nullable().optional(),
});

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  link: z.string().max(2000).nullable().optional(),
  severity_level: z.number().int().min(1).max(4).optional(),
  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
  start_time: z.number().int().nullable().optional(),
  end_time: z.number().int().nullable().optional(),
});

emergencyNoticesAdmin.get("/", requireAdmin, async (c) => {
  const res = await c.env.DB
    .prepare(
      `SELECT id, title, description, link, severity_level, is_active,
              start_time, end_time, created_at, updated_at
         FROM emergency_notices
        ORDER BY created_at DESC
        LIMIT 500`,
    )
    .all<EmergencyNoticeRow>();
  return c.json({ items: res.results ?? [] });
});

emergencyNoticesAdmin.post("/", requireAdmin, async (c) => {
  const b = await parseJson(c, createSchema);
  const ins = await c.env.DB
    .prepare(
      `INSERT INTO emergency_notices
         (title, description, link, severity_level, is_active, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, title, description, link, severity_level, is_active,
                 start_time, end_time, created_at, updated_at`,
    )
    .bind(
      b.title,
      b.description ?? null,
      b.link ?? null,
      b.severity_level ?? 2,
      b.is_active ?? 1,
      b.start_time ?? null,
      b.end_time ?? null,
    )
    .first<EmergencyNoticeRow>();
  return c.json({ item: ins }, 201);
});

emergencyNoticesAdmin.patch("/:id", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid id.");
  }
  const b = await parseJson(c, patchSchema);
  const fields: string[] = [];
  const binds: unknown[] = [];
  const mapping: Array<[keyof typeof b, string]> = [
    ["title", "title"],
    ["description", "description"],
    ["link", "link"],
    ["severity_level", "severity_level"],
    ["is_active", "is_active"],
    ["start_time", "start_time"],
    ["end_time", "end_time"],
  ];
  for (const [k, col] of mapping) {
    if (b[k] !== undefined) {
      fields.push(`${col} = ?`);
      binds.push(b[k]);
    }
  }
  if (fields.length === 0) throw new APIError("VALIDATION_FAILED", "No fields to update.");
  fields.push(`updated_at = (unixepoch() * 1000)`);
  binds.push(id);
  const r = await c.env.DB
    .prepare(`UPDATE emergency_notices SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Emergency notice not found.");
  return c.json({ ok: true });
});

emergencyNoticesAdmin.delete("/:id", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid id.");
  }
  const r = await c.env.DB
    .prepare(`DELETE FROM emergency_notices WHERE id = ?`)
    .bind(id)
    .run();
  if (!r.meta.changes) throw new APIError("NOT_FOUND", "Emergency notice not found.");
  return c.json({ ok: true });
});

emergencyNoticesPublic.get("/active", async (c) => {
  const now = Date.now();
  const row = await c.env.DB
    .prepare(
      `SELECT id, title, description, link, severity_level
         FROM emergency_notices
        WHERE is_active = 1
          AND (start_time IS NULL OR start_time <= ?)
          AND (end_time IS NULL OR end_time > ?)
        ORDER BY severity_level DESC, id DESC
        LIMIT 1`,
    )
    .bind(now, now)
    .first<{
      id: number;
      title: string;
      description: string | null;
      link: string | null;
      severity_level: number;
    }>();

  c.header("Cache-Control", "public, max-age=60");
  return c.json({ notice: row ?? null });
});
