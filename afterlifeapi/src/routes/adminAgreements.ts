

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_c0a297 } from "../middleware/auth";
import { v_1f4ea7 } from "qcu";

export const v_e0a537 = new v_b7c41b<v_de0a25>();

const v_8ae0bc = [1, 2] as const;
const v_8c9f4c = "ko";

function v_ad6a33(v_479f05): number {
  const v_f4e98d = Number(v_479f05);
  if (!Number.isInteger(v_f4e98d) || !v_8ae0bc.includes(v_f4e98d as 1 | 2)) {
    throw new v_3ebe58("VALIDATION_FAILED", `invalid type: ${v_479f05}`);
  }
  return v_f4e98d;
}

function v_121355(v_3f4e2e): string {
  const v_db9be1 = v_3f4e2e.get("adminUserId");

  if (v_db9be1 === 0 || v_db9be1 == null) return "xrun-admin-bridge";
  return `admin#${v_db9be1}`;
}

v_e0a537.get("/agreements", v_c0a297, async (v_3f4e2e) => {
  const v_18b8bf = (
    await v_3f4e2e.env.DB.prepare(
      `SELECT type, language, content, updated_at, updated_by
         FROM agreements
        ORDER BY type ASC, language ASC`,
    ).all()
  ).results;
  return v_3f4e2e.json({ data: v_18b8bf });
});

const v_90be18 = v_1f4ea7.object({ content: v_1f4ea7.string().max(200_000) });

v_e0a537.patch("/agreements/:type/:lang", v_c0a297, async (v_3f4e2e) => {
  const v_3b27d9 = v_ad6a33(v_3f4e2e.req.param("type"));
  const v_5254bf = v_3f4e2e.req.param("lang");

  const v_4d33b2 = await v_3f4e2e.req.json().catch(() => ({}));
  const v_8decf8 = v_90be18.safeParse(v_4d33b2);
  if (!v_8decf8.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "content is required (string)");
  }
  const v_054b09 = v_121355(v_3f4e2e);

  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO agreements (type, language, content, updated_at, updated_by)
       VALUES (?, ?, ?, datetime('now'), ?)
       ON CONFLICT(type, language) DO UPDATE SET
         content    = excluded.content,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(v_3b27d9, v_5254bf, v_8decf8.data.content, v_054b09)
    .run();

  return v_3f4e2e.json({ ok: true });
});

v_e0a537.delete("/agreements/:type/:lang", v_c0a297, async (v_3f4e2e) => {
  const v_3b27d9 = v_ad6a33(v_3f4e2e.req.param("type"));
  const v_5254bf = v_3f4e2e.req.param("lang");

  if (v_5254bf === v_8c9f4c) {
    throw new v_3ebe58("VALIDATION_FAILED", "ko is protected (fallback language)");
  }

  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM agreements WHERE type = ? AND language = ?`)
    .bind(v_3b27d9, v_5254bf)
    .run();

  return v_3f4e2e.json({ ok: true });
});
