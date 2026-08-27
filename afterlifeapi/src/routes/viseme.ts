

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
    .json<{
      text?: string;
      clone_id?: number;
      clone_name?: string;
      user_name?: string;
      active_person_id?: number;
      user_location?: string;
    }>()
    .catch(() => ({} as { text?: string; clone_id?: number; clone_name?: string; user_name?: string; active_person_id?: number; user_location?: string }));
  const text = (body.text ?? "").trim();
  if (!text) throw new APIError("VALIDATION_FAILED", "text required.");
  if (text.length > 2000) throw new APIError("VALIDATION_FAILED", "text too long (max 2000).");
  const cloneId = Number.isInteger(body.clone_id) ? body.clone_id : undefined;
  const cloneName = typeof body.clone_name === "string" && body.clone_name.trim() ? body.clone_name.trim().slice(0, 80) : undefined;
  const userName = typeof body.user_name === "string" && body.user_name.trim() ? body.user_name.trim().slice(0, 80) : undefined;
  const activePersonId = Number.isInteger(body.active_person_id) ? body.active_person_id : undefined;
  const userLocation = typeof body.user_location === "string" && body.user_location.trim() ? body.user_location.trim().slice(0, 200) : undefined;

  let personaDescription: string | undefined = undefined;
  if (cloneId !== undefined) {
    const cloneRow = await c.env.DB.prepare("SELECT description FROM clones WHERE id = ?")
      .bind(cloneId)
      .first<{ description: string | null }>();
    const desc = (cloneRow?.description ?? "").trim();
    if (desc) personaDescription = desc.slice(0, 600);
  }

  let rememberedName: string | undefined = undefined;
  if (activePersonId !== undefined && cloneId !== undefined) {
    const personRow = await c.env.DB.prepare(
      "SELECT display_name FROM persons WHERE id = ? AND clone_id = ? LIMIT 1"
    )
      .bind(activePersonId, cloneId)
      .first<{ display_name: string | null }>();
    const dn = (personRow?.display_name ?? "").trim();
    if (dn) rememberedName = dn.slice(0, 80);
  }

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
      body: JSON.stringify({
        text,
        clone_id: cloneId,
        clone_name: cloneName,
        user_name: userName,
        active_person_id: activePersonId,
        user_location: userLocation,

        persona_description: personaDescription,
        remembered_name: rememberedName,
      }),
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
