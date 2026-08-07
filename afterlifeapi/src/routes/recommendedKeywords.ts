

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_c0a297 } from "../middleware/auth";
import { v_3ebe58 } from "../lib/errors";

export const v_f31e9b = new v_b7c41b<v_de0a25>();

interface KeywordRow {
  id: number;
  keyword: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

function v_27a7c2(v_cb35cb) {
  return {
    id: v_cb35cb.id,
    keyword: v_cb35cb.keyword,
    sortOrder: v_cb35cb.sort_order,
    createdAt: v_cb35cb.created_at,
    updatedAt: v_cb35cb.updated_at,
  };
}

v_f31e9b.get("/recommended", async (v_3f4e2e) => {
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, keyword, sort_order, created_at, updated_at
         FROM recommended_keywords
        ORDER BY sort_order ASC, id ASC`,
    )
    .all<KeywordRow>();
  return v_3f4e2e.json({ items: (v_18b8bf.results ?? []).map(v_27a7c2) });
});

export const v_a63db8 = new v_b7c41b<v_de0a25>();

v_a63db8.use("*", requireAuth, v_c0a297);

v_a63db8.get("/", async (v_3f4e2e) => {
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, keyword, sort_order, created_at, updated_at
         FROM recommended_keywords
        ORDER BY sort_order ASC, id ASC`,
    )
    .all<KeywordRow>();
  return v_3f4e2e.json({ items: (v_18b8bf.results ?? []).map(v_27a7c2) });
});

const v_722b6d = v_1f4ea7.object({
  keyword: v_1f4ea7.string().trim().min(1).max(40),
  sortOrder: v_1f4ea7.number().int().min(0).max(999999).optional(),
});
v_a63db8.post("/", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);

  let v_5e4f30 = v_4d33b2.sortOrder;
  if (v_5e4f30 === undefined) {
    const v_3ac7e7 = await v_3f4e2e.env.DB
      .prepare(`SELECT COALESCE(MAX(sort_order), 0) AS mx FROM recommended_keywords`)
      .first<{ mx: number }>();
    v_5e4f30 = (v_3ac7e7?.mx ?? 0) + 10;
  }
  try {
    const v_8f00b9 = await v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO recommended_keywords (keyword, sort_order) VALUES (?, ?)`,
      )
      .bind(v_4d33b2.keyword, v_5e4f30)
      .run();
    const v_389afb = v_8f00b9.meta?.last_row_id;
    if (!v_389afb) throw new v_3ebe58("INTERNAL", "insert failed");
    return v_3f4e2e.json({ ok: true, id: v_389afb });
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed/.test(v_badeaf)) {
      throw new v_3ebe58("VALIDATION_FAILED", `이미 등록된 키워드예요: ${v_4d33b2.keyword}`);
    }
    throw v_49263d;
  }
});

const v_90be18 = v_1f4ea7.object({
  keyword: v_1f4ea7.string().trim().min(1).max(40).optional(),
  sortOrder: v_1f4ea7.number().int().min(0).max(999999).optional(),
});
v_a63db8.patch("/:id", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "invalid id");
  }
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_90be18);
  const v_75ae3e = [];
  const v_925171 = [];
  if (v_4d33b2.keyword !== undefined) {
    v_75ae3e.push(`keyword = ?`);
    v_925171.push(v_4d33b2.keyword);
  }
  if (v_4d33b2.sortOrder !== undefined) {
    v_75ae3e.push(`sort_order = ?`);
    v_925171.push(v_4d33b2.sortOrder);
  }
  if (v_75ae3e.length === 0) throw new v_3ebe58("VALIDATION_FAILED", "no fields to update");
  v_75ae3e.push(`updated_at = strftime('%s', 'now')`);
  v_925171.push(v_389afb);
  try {
    const v_8f00b9 = await v_3f4e2e.env.DB
      .prepare(`UPDATE recommended_keywords SET ${v_75ae3e.join(", ")} WHERE id = ?`)
      .bind(...v_925171)
      .run();
    if ((v_8f00b9.meta?.changes ?? 0) === 0) {
      throw new v_3ebe58("NOT_FOUND", `keyword ${v_389afb} not found`);
    }
    return v_3f4e2e.json({ ok: true });
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed/.test(v_badeaf)) {
      throw new v_3ebe58("VALIDATION_FAILED", `이미 등록된 키워드예요.`);
    }
    throw v_49263d;
  }
});

v_a63db8.delete("/:id", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "invalid id");
  }
  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(`DELETE FROM recommended_keywords WHERE id = ?`)
    .bind(v_389afb)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) {
    throw new v_3ebe58("NOT_FOUND", `keyword ${v_389afb} not found`);
  }
  return v_3f4e2e.json({ ok: true });
});
