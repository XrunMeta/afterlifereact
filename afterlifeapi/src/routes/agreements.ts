

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_c0a297 } from "../middleware/auth";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_733425 } from "../lib/xrun";

const v_ceda34 = {
  1: 1, 
  2: 3, 
  3: 2, 
  4: 6, 
  5: 4, 
  6: 8, 
};

interface AgreementRow {
  type: number;
  language: string;
  content: string;
  updated_at: number;
  updated_by: string | null;
}

const v_8ae0bc = new Set([1, 2, 3, 4, 5, 6]);

function v_97036c(v_479f05): string {
  const v_81e2ef = (v_479f05 ?? "ko").toLowerCase();
  if (v_81e2ef.startsWith("zh")) return "zh";
  return v_81e2ef.split("-")[0] || "ko";
}

export const v_cbf5ec = new v_b7c41b<v_de0a25>();

v_cbf5ec.get("/", async (v_3f4e2e) => {
  const v_2da26a = v_3f4e2e.req.query("type");
  const v_2a3537 = v_3f4e2e.req.query("lang") ?? v_3f4e2e.req.query("language");

  const v_653390 = v_2da26a ? Number(v_2da26a) : null;
  if (v_653390 !== null && !v_8ae0bc.has(v_653390)) {
    throw new v_3ebe58("VALIDATION_FAILED", "invalid_type");
  }
  const v_5254bf = v_2a3537 ? v_97036c(v_2a3537) : null;

  if (v_653390 !== null && v_5254bf !== null) {

    if (v_653390 in v_ceda34) {
      const v_794648 = v_ceda34[v_653390]!;
      const v_43c42e = await v_733425(v_3f4e2e.env, v_794648, v_5254bf);
      if (v_43c42e.ok) {
        const v_cb35cb = v_43c42e.row;
        return v_3f4e2e.json({
          data: {
            type: v_653390, 
            language: v_cb35cb.language,
            content: v_cb35cb.content,
            updated_at: v_cb35cb.updated_at ?? 0,
            updated_by: null,
          } satisfies AgreementRow,
        });
      }
      console.warn(`[agreements] xrun proxy failed type=${v_653390} lang=${v_5254bf}: ${v_43c42e.reason} — falling back to afterlife D1`);

    }

    let v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
      "SELECT type, language, content, updated_at, updated_by FROM Agreements WHERE type = ? AND language = ?",
    )
      .bind(v_653390, v_5254bf)
      .first<AgreementRow>();
    if (!v_3ac7e7 && v_5254bf !== "ko") {
      v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
        "SELECT type, language, content, updated_at, updated_by FROM Agreements WHERE type = ? AND language = 'ko'",
      )
        .bind(v_653390)
        .first<AgreementRow>();
    }
    return v_3f4e2e.json({ data: v_3ac7e7 ?? null });
  }

  const v_abcc8d = [];
  const v_4317d1 = [];
  if (v_653390 !== null) {
    v_abcc8d.push("type = ?");
    v_4317d1.push(v_653390);
  }
  if (v_5254bf !== null) {
    v_abcc8d.push("language = ?");
    v_4317d1.push(v_5254bf);
  }
  const v_f8df46 =
    "SELECT type, language, content, updated_at, updated_by FROM Agreements" +
    (v_abcc8d.length ? " WHERE " + v_abcc8d.join(" AND ") : "") +
    " ORDER BY type, language";
  const { results: v_a7f568 } = await v_3f4e2e.env.DB.prepare(v_f8df46)
    .bind(...v_4317d1)
    .all<AgreementRow>();
  return v_3f4e2e.json({ data: v_a7f568 ?? [] });
});

export const v_e0a537 = new v_b7c41b<v_de0a25>();

v_e0a537.use("*", v_c0a297);

v_e0a537.get("/agreements", async (v_3f4e2e) => {
  const { results: v_a7f568 } = await v_3f4e2e.env.DB.prepare(
    "SELECT type, language, content, updated_at, updated_by FROM Agreements ORDER BY type, language",
  ).all<AgreementRow>();
  return v_3f4e2e.json({ data: v_a7f568 ?? [] });
});

const v_90be18 = v_1f4ea7.object({
  content: v_1f4ea7.string().min(1).max(100_000),
});

v_e0a537.patch("/agreements/:type/:lang", async (v_3f4e2e) => {
  const v_653390 = Number(v_3f4e2e.req.param("type"));
  const v_5254bf = v_97036c(v_3f4e2e.req.param("lang"));
  if (!v_8ae0bc.has(v_653390)) throw new v_3ebe58("VALIDATION_FAILED", "invalid_type");

  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_90be18);
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_3d1875 = v_3f4e2e.get("adminUserId") as number | undefined;
  const v_054b09 = v_3d1875 ? `admin:${v_3d1875}` : "bridge";

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO Agreements (type, language, content, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(type, language) DO UPDATE SET
       content = excluded.content,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  )
    .bind(v_653390, v_5254bf, v_4d33b2.content, v_5c2f9f, v_054b09)
    .run();

  return v_3f4e2e.json({ ok: true });
});

v_e0a537.delete("/agreements/:type/:lang", async (v_3f4e2e) => {
  const v_653390 = Number(v_3f4e2e.req.param("type"));
  const v_5254bf = v_97036c(v_3f4e2e.req.param("lang"));
  if (!v_8ae0bc.has(v_653390)) throw new v_3ebe58("VALIDATION_FAILED", "invalid_type");
  if (v_5254bf === "ko") throw new v_3ebe58("VALIDATION_FAILED", "ko_protected");

  await v_3f4e2e.env.DB.prepare(
    "DELETE FROM Agreements WHERE type = ? AND language = ?",
  )
    .bind(v_653390, v_5254bf)
    .run();

  return v_3f4e2e.json({ ok: true });
});
