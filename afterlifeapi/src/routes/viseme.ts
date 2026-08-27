

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const viseme = new Hono<AppEnv>();

const WHITELIST_EMAILS = new Set([
  "oth-staff@example.invalid",
  "oth-user@example.invalid",
]);

const DEFAULT_PRETHIRD_BASE = "https://rtc.example.invalid/prethird";

viseme.post("/synth", requireAuth, async (c) => {
  const userId = c.get("userId")!;

  const row = await c.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ email: string | null }>();
  const email = (row?.email ?? "").toLowerCase();
  if (!WHITELIST_EMAILS.has(email)) {

    throw new APIError("FORBIDDEN", "viseme synth is not enabled for this account.");
  }

  const secret = c.env.LEARN_SECRET ?? "";
  if (!secret) {
    return c.json({ error: "LEARN_SECRET not configured" }, 500);
  }

  const body = await c.req
    .json<{ text?: string; se_key?: string }>()
    .catch(() => ({} as { text?: string; se_key?: string }));
  const text = (body.text ?? "").trim();
  if (!text) throw new APIError("VALIDATION_FAILED", "text required.");
  if (text.length > 500) throw new APIError("VALIDATION_FAILED", "text too long (max 500).");
  const seKey = body.se_key && typeof body.se_key === "string" ? body.se_key : undefined;

  const base = c.env.CALL_PRETHIRD_BASE || DEFAULT_PRETHIRD_BASE;
  const upstream = `${base.replace(/\/$/, "")}/oth-path`;
  let resp: Response;
  try {
    resp = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": secret,
      },
      body: JSON.stringify({ text, se_key: seKey }),
    });
  } catch (e) {
    return c.json({ error: `upstream: ${(e as Error).message}` }, 502);
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return c.json({ error: `upstream ${resp.status}: ${text.slice(0, 200)}` }, 502);
  }
  const data = await resp.json().catch(() => null);
  if (!data) return c.json({ error: "upstream returned non-JSON" }, 502);
  return c.json(data);
});

viseme.post("/chat", requireAuth, async (c) => {
  const userId = c.get("userId")!;

  const row = await c.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ email: string | null }>();
  const email = (row?.email ?? "").toLowerCase();
  if (!WHITELIST_EMAILS.has(email)) {
    throw new APIError("FORBIDDEN", "viseme chat is not enabled for this account.");
  }

  const secret = c.env.LEARN_SECRET ?? "";
  if (!secret) {
    return c.json({ error: "LEARN_SECRET not configured" }, 500);
  }

  const body = await c.req
    .json<{ text?: string; clone_id?: number }>()
    .catch(() => ({} as { text?: string; clone_id?: number }));
  const text = (body.text ?? "").trim();
  if (!text) throw new APIError("VALIDATION_FAILED", "text required.");
  if (text.length > 2000) throw new APIError("VALIDATION_FAILED", "text too long (max 2000).");
  const cloneId = Number.isInteger(body.clone_id) ? body.clone_id : undefined;

  const base = c.env.CALL_PRETHIRD_BASE || DEFAULT_PRETHIRD_BASE;
  const upstream = `${base.replace(/\/$/, "")}/oth-path`;
  let resp: Response;
  try {
    resp = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": secret,
      },
      body: JSON.stringify({ text, clone_id: cloneId }),
    });
  } catch (e) {
    return c.json({ error: `upstream: ${(e as Error).message}` }, 502);
  }
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    return c.json({ error: `upstream ${resp.status}: ${errText.slice(0, 200)}` }, 502);
  }
  const data = await resp.json().catch(() => null);
  if (!data) return c.json({ error: "upstream returned non-JSON" }, 502);
  return c.json(data);
});
