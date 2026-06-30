

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import { z } from "zod";

export const adminAgreements = new Hono<AppEnv>();

const VALID_TYPES = [1, 2] as const;
const KO_FALLBACK = "ko";

function parseType(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || !VALID_TYPES.includes(n as 1 | 2)) {
    throw new APIError("VALIDATION_FAILED", `invalid type: ${raw}`);
  }
  return n;
}

function resolveUpdatedBy(c: { get: (k: string) => unknown }): string {
  const adminId = c.get("adminUserId");

  if (adminId === 0 || adminId == null) return "xrun-admin-bridge";
  return `admin#${adminId}`;
}

adminAgreements.get("/agreements", requireAdmin, async (c) => {
  const rows = (
    await c.env.DB.prepare(
      `SELECT type, language, content, updated_at, updated_by
         FROM agreements
        ORDER BY type ASC, language ASC`,
    ).all()
  ).results;
  return c.json({ data: rows });
});

const patchSchema = z.object({ content: z.string().max(200_000) });

adminAgreements.patch("/agreements/:type/:lang", requireAdmin, async (c) => {
  const type = parseType(c.req.param("type"));
  const lang = c.req.param("lang");

  const body = await c.req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    throw new APIError("VALIDATION_FAILED", "content is required (string)");
  }
  const updatedBy = resolveUpdatedBy(c);

  await c.env.DB
    .prepare(
      `INSERT INTO agreements (type, language, content, updated_at, updated_by)
       VALUES (?, ?, ?, datetime('now'), ?)
       ON CONFLICT(type, language) DO UPDATE SET
         content    = excluded.content,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(type, lang, parsed.data.content, updatedBy)
    .run();

  return c.json({ ok: true });
});

adminAgreements.delete("/agreements/:type/:lang", requireAdmin, async (c) => {
  const type = parseType(c.req.param("type"));
  const lang = c.req.param("lang");

  if (lang === KO_FALLBACK) {
    throw new APIError("VALIDATION_FAILED", "ko is protected (fallback language)");
  }

  await c.env.DB
    .prepare(`DELETE FROM agreements WHERE type = ? AND language = ?`)
    .bind(type, lang)
    .run();

  return c.json({ ok: true });
});
