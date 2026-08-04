

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAdmin } from "../middleware/auth";
import { resolveOptionalUser } from "../lib/cloneAccess";

export const crashes = new Hono<AppEnv>();
export const crashesAdmin = new Hono<AppEnv>();

const breadcrumbSchema = z
  .object({
    category: z.string().max(80),
    message: z.string().max(500),
    ts: z.number().int().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const reportSchema = z.object({
  ts: z.number().int(),
  isFatal: z.boolean().optional(),
  message: z.string().min(1).max(4000),
  name: z.string().max(200).optional(),
  stack: z.string().max(20000).optional(),
  screen: z.string().max(200).optional(),
  breadcrumbs: z.array(breadcrumbSchema).max(80).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
  appVersion: z.string().max(80).optional(),
  runtimeVersion: z.string().max(80).optional(),
  updateId: z.string().max(80).optional(),
  channel: z.string().max(40).optional(),
  platform: z.enum(["ios", "android", "web", "unknown"]).optional(),
  osVersion: z.string().max(80).optional(),
  deviceModel: z.string().max(120).optional(),
  locale: z.string().max(20).optional(),
});

crashes.post("/", async (c) => {
  const body = await parseJson(c, reportSchema);
  const userId = await resolveOptionalUser(c);

  const breadcrumbsJson = body.breadcrumbs?.length
    ? JSON.stringify(body.breadcrumbs)
    : null;
  const extraJson =
    body.extra && Object.keys(body.extra).length > 0 ? JSON.stringify(body.extra) : null;

  const MAX_JSON_BYTES = 512 * 1024;
  const bcTrim =
    breadcrumbsJson && breadcrumbsJson.length > MAX_JSON_BYTES
      ? breadcrumbsJson.slice(0, MAX_JSON_BYTES)
      : breadcrumbsJson;
  const exTrim =
    extraJson && extraJson.length > MAX_JSON_BYTES
      ? extraJson.slice(0, MAX_JSON_BYTES)
      : extraJson;

  const ins = await c.env.DB
    .prepare(
      `INSERT INTO crash_reports
         (user_id, ts, is_fatal, error_name, message, stack, screen,
          breadcrumbs_json, extra_json, app_version, runtime_version, update_id,
          channel, platform, os_version, device_model, locale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      userId,
      body.ts,
      body.isFatal ? 1 : 0,
      body.name ?? null,
      body.message,
      body.stack ?? null,
      body.screen ?? null,
      bcTrim,
      exTrim,
      body.appVersion ?? null,
      body.runtimeVersion ?? null,
      body.updateId ?? null,
      body.channel ?? null,
      body.platform ?? null,
      body.osVersion ?? null,
      body.deviceModel ?? null,
      body.locale ?? null,
    )
    .first<{ id: number }>();
  if (!ins) throw new APIError("INTERNAL_ERROR", "crash insert failed.");
  return c.json({ id: ins.id }, 201);
});

interface CrashRow {
  id: number;
  user_id: number | null;
  ts: number;
  received_at: number;
  is_fatal: number;
  error_name: string | null;
  message: string;
  stack: string | null;
  screen: string | null;
  breadcrumbs_json: string | null;
  extra_json: string | null;
  app_version: string | null;
  runtime_version: string | null;
  update_id: string | null;
  channel: string | null;
  platform: string | null;
  os_version: string | null;
  device_model: string | null;
  locale: string | null;
}

interface CrashListRow extends Omit<CrashRow, "breadcrumbs_json" | "extra_json" | "stack"> {
  user_email: string | null;
}

function serializeListRow(r: CrashListRow) {
  return {
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    ts: r.ts,
    receivedAt: r.received_at,
    isFatal: !!r.is_fatal,
    errorName: r.error_name,
    message: r.message,
    screen: r.screen,
    appVersion: r.app_version,
    runtimeVersion: r.runtime_version,
    updateId: r.update_id,
    channel: r.channel,
    platform: r.platform,
    osVersion: r.os_version,
    deviceModel: r.device_model,
    locale: r.locale,
  };
}

function serializeDetailRow(r: CrashRow, userEmail: string | null) {
  return {
    ...serializeListRow({ ...r, user_email: userEmail } as CrashListRow),
    stack: r.stack,
    breadcrumbs: r.breadcrumbs_json ? safeParseArray(r.breadcrumbs_json) : [],
    extra: r.extra_json ? safeParseObj(r.extra_json) : null,
  };
}

function safeParseArray(s: string): unknown[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function safeParseObj(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

crashesAdmin.get("/", requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const fatalStr = url.searchParams.get("fatal");
  const userIdStr = url.searchParams.get("userId");
  const screen = (url.searchParams.get("screen") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "100")));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0"));

  const where: string[] = [];
  const args: unknown[] = [];
  if (fatalStr === "1" || fatalStr === "0") {
    where.push(`cr.is_fatal = ?`);
    args.push(Number(fatalStr));
  }
  if (userIdStr && /^\d+$/.test(userIdStr)) {
    where.push(`cr.user_id = ?`);
    args.push(Number(userIdStr));
  }
  if (screen) {
    where.push(`cr.screen = ?`);
    args.push(screen);
  }
  if (q) {
    where.push(`cr.message LIKE ?`);
    args.push(`%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM crash_reports cr ${whereSql}`)
    .bind(...args)
    .first<{ n: number }>();
  const total = totalRow?.n ?? 0;

  const rows = await c.env.DB
    .prepare(
      `SELECT cr.id, cr.user_id, u.email AS user_email, cr.ts, cr.received_at, cr.is_fatal,
              cr.error_name, cr.message, cr.screen, cr.app_version, cr.runtime_version,
              cr.update_id, cr.channel, cr.platform, cr.os_version, cr.device_model, cr.locale
         FROM crash_reports cr
         LEFT JOIN users u ON u.id = cr.user_id
         ${whereSql}
        ORDER BY cr.received_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...args, limit, offset)
    .all<CrashListRow>();

  return c.json({
    items: (rows.results ?? []).map(serializeListRow),
    total,
    limit,
    offset,
  });
});

crashesAdmin.get("/:id", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid id.");
  }
  const row = await c.env.DB
    .prepare(
      `SELECT id, user_id, ts, received_at, is_fatal, error_name, message, stack, screen,
              breadcrumbs_json, extra_json, app_version, runtime_version, update_id,
              channel, platform, os_version, device_model, locale
         FROM crash_reports WHERE id = ?`,
    )
    .bind(id)
    .first<CrashRow>();
  if (!row) throw new APIError("NOT_FOUND", "Crash report not found.");
  const emailRow = row.user_id
    ? await c.env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(row.user_id).first<{ email: string | null }>()
    : null;
  return c.json({ item: serializeDetailRow(row, emailRow?.email ?? null) });
});

crashesAdmin.delete("/:id", requireAdmin, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid id.");
  }
  await c.env.DB.prepare(`DELETE FROM crash_reports WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});
