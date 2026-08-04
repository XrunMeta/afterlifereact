

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_c0a297 } from "../middleware/auth";
import { v_efcb2d } from "../lib/cloneAccess";

export const v_8d1314 = new v_b7c41b<v_de0a25>();
export const v_bf54ef = new v_b7c41b<v_de0a25>();

const v_c6ee49 = v_1f4ea7
  .object({
    category: v_1f4ea7.string().max(80),
    message: v_1f4ea7.string().max(500),
    ts: v_1f4ea7.number().int().optional(),
    data: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
  })
  .passthrough();

const v_4a3250 = v_1f4ea7.object({
  ts: v_1f4ea7.number().int(),
  isFatal: v_1f4ea7.boolean().optional(),
  message: v_1f4ea7.string().min(1).max(4000),
  name: v_1f4ea7.string().max(200).optional(),
  stack: v_1f4ea7.string().max(20000).optional(),
  screen: v_1f4ea7.string().max(200).optional(),
  breadcrumbs: v_1f4ea7.array(v_c6ee49).max(80).optional(),
  extra: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
  appVersion: v_1f4ea7.string().max(80).optional(),
  runtimeVersion: v_1f4ea7.string().max(80).optional(),
  updateId: v_1f4ea7.string().max(80).optional(),
  channel: v_1f4ea7.string().max(40).optional(),
  platform: v_1f4ea7.enum(["ios", "android", "web", "unknown"]).optional(),
  osVersion: v_1f4ea7.string().max(80).optional(),
  deviceModel: v_1f4ea7.string().max(120).optional(),
  locale: v_1f4ea7.string().max(20).optional(),
});

v_8d1314.post("/", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_4a3250);
  const v_43e90c = await v_efcb2d(v_3f4e2e);

  const v_f31ede = v_4d33b2.breadcrumbs?.length
    ? JSON.stringify(v_4d33b2.breadcrumbs)
    : null;
  const v_03a1d6 =
    v_4d33b2.extra && Object.keys(v_4d33b2.extra).length > 0 ? JSON.stringify(v_4d33b2.extra) : null;

  const v_7bad1a = 512 * 1024;
  const v_c5dc62 =
    v_f31ede && v_f31ede.length > v_7bad1a
      ? v_f31ede.slice(0, v_7bad1a)
      : v_f31ede;
  const v_2849cf =
    v_03a1d6 && v_03a1d6.length > v_7bad1a
      ? v_03a1d6.slice(0, v_7bad1a)
      : v_03a1d6;

  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO crash_reports
         (user_id, ts, is_fatal, error_name, message, stack, screen,
          breadcrumbs_json, extra_json, app_version, runtime_version, update_id,
          channel, platform, os_version, device_model, locale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      v_43e90c,
      v_4d33b2.ts,
      v_4d33b2.isFatal ? 1 : 0,
      v_4d33b2.name ?? null,
      v_4d33b2.message,
      v_4d33b2.stack ?? null,
      v_4d33b2.screen ?? null,
      v_c5dc62,
      v_2849cf,
      v_4d33b2.appVersion ?? null,
      v_4d33b2.runtimeVersion ?? null,
      v_4d33b2.updateId ?? null,
      v_4d33b2.channel ?? null,
      v_4d33b2.platform ?? null,
      v_4d33b2.osVersion ?? null,
      v_4d33b2.deviceModel ?? null,
      v_4d33b2.locale ?? null,
    )
    .first<{ id: number }>();
  if (!v_43af15) throw new v_3ebe58("INTERNAL_ERROR", "crash insert failed.");
  return v_3f4e2e.json({ id: v_43af15.id }, 201);
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

function v_47d74c(v_cb35cb) {
  return {
    id: v_cb35cb.id,
    userId: v_cb35cb.user_id,
    userEmail: v_cb35cb.user_email,
    ts: v_cb35cb.ts,
    receivedAt: v_cb35cb.received_at,
    isFatal: !!v_cb35cb.is_fatal,
    errorName: v_cb35cb.error_name,
    message: v_cb35cb.message,
    screen: v_cb35cb.screen,
    appVersion: v_cb35cb.app_version,
    runtimeVersion: v_cb35cb.runtime_version,
    updateId: v_cb35cb.update_id,
    channel: v_cb35cb.channel,
    platform: v_cb35cb.platform,
    osVersion: v_cb35cb.os_version,
    deviceModel: v_cb35cb.device_model,
    locale: v_cb35cb.locale,
  };
}

function v_3c29f8(v_cb35cb, v_f4fb5e) {
  return {
    ...v_47d74c({ ...v_cb35cb, user_email: v_f4fb5e } as CrashListRow),
    stack: v_cb35cb.stack,
    breadcrumbs: v_cb35cb.breadcrumbs_json ? v_6fad6b(v_cb35cb.breadcrumbs_json) : [],
    extra: v_cb35cb.extra_json ? v_991acb(v_cb35cb.extra_json) : null,
  };
}

function v_6fad6b(v_fd5f43): unknown[] {
  try {
    const v_81e2ef = JSON.parse(v_fd5f43);
    return Array.isArray(v_81e2ef) ? v_81e2ef : [];
  } catch {
    return [];
  }
}
function v_991acb(v_fd5f43): Record<string, unknown> | null {
  try {
    const v_81e2ef = JSON.parse(v_fd5f43);
    return v_81e2ef && typeof v_81e2ef === "object" && !Array.isArray(v_81e2ef) ? (v_81e2ef as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

v_bf54ef.get("/", v_c0a297, async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_487181 = v_f71b56.searchParams.get("fatal");
  const v_2257df = v_f71b56.searchParams.get("userId");
  const v_53746a = (v_f71b56.searchParams.get("screen") ?? "").trim();
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_02be30 = Math.min(200, Math.max(1, Number(v_f71b56.searchParams.get("limit") ?? "100")));
  const v_3bbadf = Math.max(0, Number(v_f71b56.searchParams.get("offset") ?? "0"));

  const v_abcc8d = [];
  const v_4317d1 = [];
  if (v_487181 === "1" || v_487181 === "0") {
    v_abcc8d.push(`cr.is_fatal = ?`);
    v_4317d1.push(Number(v_487181));
  }
  if (v_2257df && /^\d+$/.test(v_2257df)) {
    v_abcc8d.push(`cr.user_id = ?`);
    v_4317d1.push(Number(v_2257df));
  }
  if (v_53746a) {
    v_abcc8d.push(`cr.screen = ?`);
    v_4317d1.push(v_53746a);
  }
  if (v_ab6401) {
    v_abcc8d.push(`cr.message LIKE ?`);
    v_4317d1.push(`%${v_ab6401}%`);
  }
  const v_8b4d7e = v_abcc8d.length ? `WHERE ${v_abcc8d.join(" AND ")}` : "";

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM crash_reports cr ${v_8b4d7e}`)
    .bind(...v_4317d1)
    .first<{ n: number }>();
  const v_c83285 = v_0dab8e?.n ?? 0;

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT cr.id, cr.user_id, u.email AS user_email, cr.ts, cr.received_at, cr.is_fatal,
              cr.error_name, cr.message, cr.screen, cr.app_version, cr.runtime_version,
              cr.update_id, cr.channel, cr.platform, cr.os_version, cr.device_model, cr.locale
         FROM crash_reports cr
         LEFT JOIN users u ON u.id = cr.user_id
         ${v_8b4d7e}
        ORDER BY cr.received_at DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(...v_4317d1, v_02be30, v_3bbadf)
    .all<CrashListRow>();

  return v_3f4e2e.json({
    items: (v_18b8bf.results ?? []).map(v_47d74c),
    total: v_c83285,
    limit: v_02be30,
    offset: v_3bbadf,
  });
});

v_bf54ef.get("/:id", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  }
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, user_id, ts, received_at, is_fatal, error_name, message, stack, screen,
              breadcrumbs_json, extra_json, app_version, runtime_version, update_id,
              channel, platform, os_version, device_model, locale
         FROM crash_reports WHERE id = ?`,
    )
    .bind(v_389afb)
    .first<CrashRow>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Crash report not found.");
  const v_bfebce = v_3ac7e7.user_id
    ? await v_3f4e2e.env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(v_3ac7e7.user_id).first<{ email: string | null }>()
    : null;
  return v_3f4e2e.json({ item: v_3c29f8(v_3ac7e7, v_bfebce?.email ?? null) });
});

v_bf54ef.delete("/:id", v_c0a297, async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");
  }
  await v_3f4e2e.env.DB.prepare(`DELETE FROM crash_reports WHERE id = ?`).bind(v_389afb).run();
  return v_3f4e2e.json({ ok: true });
});
