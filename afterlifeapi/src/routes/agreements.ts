

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import { parseJson, z } from "../lib/validate";

interface AgreementRow {
  type: number;
  language: string;
  content: string;
  updated_at: number;
  updated_by: string | null;
}

const VALID_TYPES = new Set([1, 2, 3, 4, 5]);

function normalizeLang(raw: string | undefined | null): string {
  const v = (raw ?? "ko").toLowerCase();
  if (v.startsWith("zh")) return "zh";
  return v.split("-")[0] || "ko";
}

export const agreements = new Hono<AppEnv>();

agreements.get("/", async (c) => {
  const typeQ = c.req.query("type");
  const langQ = c.req.query("lang") ?? c.req.query("language");

  const typeNum = typeQ ? Number(typeQ) : null;
  if (typeNum !== null && !VALID_TYPES.has(typeNum)) {
    throw new APIError("VALIDATION_FAILED", "invalid_type");
  }
  const lang = langQ ? normalizeLang(langQ) : null;

  if (typeNum !== null && lang !== null) {

    let row = await c.env.DB.prepare(
      "SELECT type, language, content, updated_at, updated_by FROM Agreements WHERE type = ? AND language = ?",
    )
      .bind(typeNum, lang)
      .first<AgreementRow>();
    if (!row && lang !== "ko") {
      row = await c.env.DB.prepare(
        "SELECT type, language, content, updated_at, updated_by FROM Agreements WHERE type = ? AND language = 'ko'",
      )
        .bind(typeNum)
        .first<AgreementRow>();
    }
    return c.json({ data: row ?? null });
  }

  const where: string[] = [];
  const args: (string | number)[] = [];
  if (typeNum !== null) {
    where.push("type = ?");
    args.push(typeNum);
  }
  if (lang !== null) {
    where.push("language = ?");
    args.push(lang);
  }
  const sql =
    "SELECT type, language, content, updated_at, updated_by FROM Agreements" +
    (where.length ? " WHERE " + where.join(" AND ") : "") +
    " ORDER BY type, language";
  const { results } = await c.env.DB.prepare(sql)
    .bind(...args)
    .all<AgreementRow>();
  return c.json({ data: results ?? [] });
});

export const adminAgreements = new Hono<AppEnv>();

adminAgreements.use("*", requireAdmin);

adminAgreements.get("/agreements", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT type, language, content, updated_at, updated_by FROM Agreements ORDER BY type, language",
  ).all<AgreementRow>();
  return c.json({ data: results ?? [] });
});

const patchSchema = z.object({
  content: z.string().min(1).max(100_000),
});

adminAgreements.patch("/agreements/:type/:lang", async (c) => {
  const typeNum = Number(c.req.param("type"));
  const lang = normalizeLang(c.req.param("lang"));
  if (!VALID_TYPES.has(typeNum)) throw new APIError("VALIDATION_FAILED", "invalid_type");

  const body = await parseJson(c, patchSchema);
  const now = Math.floor(Date.now() / 1000);
  const adminUid = c.get("adminUserId") as number | undefined;
  const updatedBy = adminUid ? `admin:${adminUid}` : "bridge";

  await c.env.DB.prepare(
    `INSERT INTO Agreements (type, language, content, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(type, language) DO UPDATE SET
       content = excluded.content,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  )
    .bind(typeNum, lang, body.content, now, updatedBy)
    .run();

  return c.json({ ok: true });
});

adminAgreements.delete("/agreements/:type/:lang", async (c) => {
  const typeNum = Number(c.req.param("type"));
  const lang = normalizeLang(c.req.param("lang"));
  if (!VALID_TYPES.has(typeNum)) throw new APIError("VALIDATION_FAILED", "invalid_type");
  if (lang === "ko") throw new APIError("VALIDATION_FAILED", "ko_protected");

  await c.env.DB.prepare(
    "DELETE FROM Agreements WHERE type = ? AND language = ?",
  )
    .bind(typeNum, lang)
    .run();

  return c.json({ ok: true });
});
