

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { parseJson, z } from "../lib/validate";
import { requireAdmin } from "../middleware/auth";
import { APIError } from "../lib/errors";

export const recommendedKeywords = new Hono<AppEnv>();

interface KeywordRow {
  id: number;
  keyword: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

function toItem(r: KeywordRow) {
  return {
    id: r.id,
    keyword: r.keyword,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

recommendedKeywords.get("/recommended", async (c) => {
  const rows = await c.env.DB
    .prepare(
      `SELECT id, keyword, sort_order, created_at, updated_at
         FROM recommended_keywords
        ORDER BY sort_order ASC, id ASC`,
    )
    .all<KeywordRow>();
  return c.json({ items: (rows.results ?? []).map(toItem) });
});

export const recommendedKeywordsAdmin = new Hono<AppEnv>();

recommendedKeywordsAdmin.use("*", requireAdmin);

recommendedKeywordsAdmin.get("/", async (c) => {
  const rows = await c.env.DB
    .prepare(
      `SELECT id, keyword, sort_order, created_at, updated_at
         FROM recommended_keywords
        ORDER BY sort_order ASC, id ASC`,
    )
    .all<KeywordRow>();
  return c.json({ items: (rows.results ?? []).map(toItem) });
});

const createSchema = z.object({
  keyword: z.string().trim().min(1).max(40),
  sortOrder: z.number().int().min(0).max(999999).optional(),
});
recommendedKeywordsAdmin.post("/", async (c) => {
  const body = await parseJson(c, createSchema);

  let order = body.sortOrder;
  if (order === undefined) {
    const row = await c.env.DB
      .prepare(`SELECT COALESCE(MAX(sort_order), 0) AS mx FROM recommended_keywords`)
      .first<{ mx: number }>();
    order = (row?.mx ?? 0) + 10;
  }
  try {
    const res = await c.env.DB
      .prepare(
        `INSERT INTO recommended_keywords (keyword, sort_order) VALUES (?, ?)`,
      )
      .bind(body.keyword, order)
      .run();
    const id = res.meta?.last_row_id;
    if (!id) throw new APIError("INTERNAL_ERROR", "insert failed");
    return c.json({ ok: true, id });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/UNIQUE constraint failed/.test(msg)) {
      throw new APIError("VALIDATION_FAILED", `이미 등록된 키워드예요: ${body.keyword}`);
    }
    throw err;
  }
});

const patchSchema = z.object({
  keyword: z.string().trim().min(1).max(40).optional(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
});
recommendedKeywordsAdmin.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "invalid id");
  }
  const body = await parseJson(c, patchSchema);
  const sets: string[] = [];
  const binds: (string | number)[] = [];
  if (body.keyword !== undefined) {
    sets.push(`keyword = ?`);
    binds.push(body.keyword);
  }
  if (body.sortOrder !== undefined) {
    sets.push(`sort_order = ?`);
    binds.push(body.sortOrder);
  }
  if (sets.length === 0) throw new APIError("VALIDATION_FAILED", "no fields to update");
  sets.push(`updated_at = strftime('%s', 'now')`);
  binds.push(id);
  try {
    const res = await c.env.DB
      .prepare(`UPDATE recommended_keywords SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...binds)
      .run();
    if ((res.meta?.changes ?? 0) === 0) {
      throw new APIError("NOT_FOUND", `keyword ${id} not found`);
    }
    return c.json({ ok: true });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/UNIQUE constraint failed/.test(msg)) {
      throw new APIError("VALIDATION_FAILED", `이미 등록된 키워드예요.`);
    }
    throw err;
  }
});

recommendedKeywordsAdmin.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "invalid id");
  }
  const res = await c.env.DB
    .prepare(`DELETE FROM recommended_keywords WHERE id = ?`)
    .bind(id)
    .run();
  if ((res.meta?.changes ?? 0) === 0) {
    throw new APIError("NOT_FOUND", `keyword ${id} not found`);
  }
  return c.json({ ok: true });
});
