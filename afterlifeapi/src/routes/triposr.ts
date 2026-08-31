

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const triposr = new Hono<AppEnv>();

const WHITELIST_EMAILS = new Set([
  "oth-staff@example.invalid",
  "oth-user@example.invalid",
]);

const DEFAULT_TRIPOSR_BASE = "https://rtc.example.invalid/triposr";

triposr.post("/generate", requireAuth, async (c) => {
  const userId = c.get("userId")!;

  const row = await c.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ email: string | null }>();
  const email = (row?.email ?? "").toLowerCase();
  if (!WHITELIST_EMAILS.has(email)) {
    throw new APIError("FORBIDDEN", "3D generate is not enabled for this account.");
  }

  const base = c.env.CALL_TRIPOSR_BASE || DEFAULT_TRIPOSR_BASE;
  const upstream = `${base.replace(/\/$/, "")}/generate`;

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new APIError("VALIDATION_FAILED", "multipart/form-data required (field: image).");
  }

  let resp: Response;
  try {
    resp = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: c.req.raw.body,

      duplex: "half",
    });
  } catch (e) {
    return c.json({ error: `upstream: ${(e as Error).message}` }, 502);
  }
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return c.json({ error: `upstream ${resp.status}: ${txt.slice(0, 200)}` }, 502);
  }
  const data = await resp.json<{ [k: string]: unknown }>().catch(() => null);
  if (!data) return c.json({ error: "upstream returned non-JSON" }, 502);

  return c.json({ ...data, base_url: base.replace(/\/$/, "") });
});
