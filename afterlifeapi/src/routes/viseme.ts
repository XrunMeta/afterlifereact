

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";

export const v_5c0bb5 = new v_b7c41b<v_de0a25>();

const v_c930ce = new Set([
  "oth-staff@example.invalid",
  "oth-user@example.invalid",
]);

const v_1c386b = "https://rtc.example.invalid/prethird";

v_5c0bb5.post("/synth", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(v_43e90c)
    .first<{ email: string | null }>();
  const v_e0c7e8 = (v_3ac7e7?.email ?? "").toLowerCase();
  if (!v_c930ce.has(v_e0c7e8)) {

    throw new v_3ebe58("FORBIDDEN", "viseme synth is not enabled for this account.");
  }

  const v_43fd42 = v_3f4e2e.env.LEARN_SECRET ?? "";
  if (!v_43fd42) {
    return v_3f4e2e.json({ error: "LEARN_SECRET not configured" }, 500);
  }

  const v_4d33b2 = await v_3f4e2e.req
    .json<{ text?: string; se_key?: string }>()
    .catch(() => ({} as { text?: string; se_key?: string }));
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  if (!v_9b6134) throw new v_3ebe58("VALIDATION_FAILED", "text required.");
  if (v_9b6134.length > 500) throw new v_3ebe58("VALIDATION_FAILED", "text too long (max 500).");
  const v_2f693a = v_4d33b2.se_key && typeof v_4d33b2.se_key === "string" ? v_4d33b2.se_key : undefined;

  const v_694b25 = v_3f4e2e.env.CALL_PRETHIRD_BASE || v_1c386b;
  const v_0a6a65 = `${v_694b25.replace(/\/$/, "")}/oth-path`;
  let v_eb792a;
  try {
    v_eb792a = await fetch(v_0a6a65, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": v_43fd42,
      },
      body: JSON.stringify({ text: v_9b6134, se_key: v_2f693a }),
    });
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `upstream: ${(v_9e86fd as Error).message}` }, 502);
  }
  if (!v_eb792a.ok) {
    const v_9b6134 = await v_eb792a.text().catch(() => "");
    return v_3f4e2e.json({ error: `upstream ${v_eb792a.status}: ${v_9b6134.slice(0, 200)}` }, 502);
  }
  const v_9390e8 = await v_eb792a.json().catch(() => null);
  if (!v_9390e8) return v_3f4e2e.json({ error: "upstream returned non-JSON" }, 502);
  return v_3f4e2e.json(v_9390e8);
});

v_5c0bb5.post("/chat", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(v_43e90c)
    .first<{ email: string | null }>();
  const v_e0c7e8 = (v_3ac7e7?.email ?? "").toLowerCase();
  if (!v_c930ce.has(v_e0c7e8)) {
    throw new v_3ebe58("FORBIDDEN", "viseme chat is not enabled for this account.");
  }

  const v_43fd42 = v_3f4e2e.env.LEARN_SECRET ?? "";
  if (!v_43fd42) {
    return v_3f4e2e.json({ error: "LEARN_SECRET not configured" }, 500);
  }

  const v_4d33b2 = await v_3f4e2e.req
    .json<{
      text?: string;
      clone_id?: number;
      clone_name?: string;
      user_name?: string;
      active_person_id?: number;
      user_location?: string;

      text_only?: boolean;
    }>()
    .catch(() => ({} as {
      text?: string; clone_id?: number; clone_name?: string; user_name?: string;
      active_person_id?: number; user_location?: string; text_only?: boolean;
    }));
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  if (!v_9b6134) throw new v_3ebe58("VALIDATION_FAILED", "text required.");
  if (v_9b6134.length > 2000) throw new v_3ebe58("VALIDATION_FAILED", "text too long (max 2000).");
  const v_6e0fd3 = Number.isInteger(v_4d33b2.clone_id) ? v_4d33b2.clone_id : undefined;
  const v_f2ff36 = typeof v_4d33b2.clone_name === "string" && v_4d33b2.clone_name.trim() ? v_4d33b2.clone_name.trim().slice(0, 80) : undefined;
  const v_f08a5e = typeof v_4d33b2.user_name === "string" && v_4d33b2.user_name.trim() ? v_4d33b2.user_name.trim().slice(0, 80) : undefined;
  const v_c6a7ad = Number.isInteger(v_4d33b2.active_person_id) ? v_4d33b2.active_person_id : undefined;
  const v_146d3d = typeof v_4d33b2.user_location === "string" && v_4d33b2.user_location.trim() ? v_4d33b2.user_location.trim().slice(0, 200) : undefined;
  const v_9fb0f4 = v_4d33b2.text_only === true;

  let v_102587 = undefined;
  let v_ab7387 = undefined;
  let v_4676ca = undefined;
  let v_600d71 = undefined;
  let v_f7975f = undefined;
  if (v_6e0fd3 !== undefined) {
    const v_1de203 = await v_3f4e2e.env.DB.prepare(
      "SELECT description, l1_profile FROM clones WHERE id = ?"
    )
      .bind(v_6e0fd3)
      .first<{ description: string | null; l1_profile: string | null }>();
    const v_41b99d = (v_1de203?.description ?? "").trim();
    if (v_41b99d) v_102587 = v_41b99d.slice(0, 600);
    if (v_1de203?.l1_profile) {
      try {
        const v_e2a85c = JSON.parse(v_1de203.l1_profile) as {
          attrs?: Record<string, string>;
          personality_core?: string;
          tone?: string;
          knowledge?: Array<{ q?: string; a?: string }>;
        };

        if (v_e2a85c.attrs && typeof v_e2a85c.attrs === "object") {
          const v_468545 = [];
          for (const [v_0eb677, v_81e2ef] of Object.entries(v_e2a85c.attrs)) {
            if (typeof v_81e2ef === "string" && v_81e2ef.trim()) v_468545.push(`${v_0eb677}=${v_81e2ef.trim().slice(0, 40)}`);
          }
          if (v_468545.length) v_ab7387 = v_468545.slice(0, 12).join(", ").slice(0, 400);
        }
        if (typeof v_e2a85c.personality_core === "string" && v_e2a85c.personality_core.trim())
          v_4676ca = v_e2a85c.personality_core.trim().slice(0, 300);
        if (typeof v_e2a85c.tone === "string" && v_e2a85c.tone.trim())
          v_600d71 = v_e2a85c.tone.trim().slice(0, 300);

        if (Array.isArray(v_e2a85c.knowledge)) {
          const v_4622b9 = [];
          for (const v_0eb677 of v_e2a85c.knowledge) {
            if (v_0eb677 && typeof v_0eb677.q === "string" && typeof v_0eb677.a === "string") {
              const v_ab6401 = v_0eb677.q.trim();
              const v_779914 = v_0eb677.a.trim();
              if (v_ab6401 && v_779914) v_4622b9.push({ q: v_ab6401.slice(0, 120), a: v_779914.slice(0, 240) });
            }
            if (v_4622b9.length >= 10) break;
          }
          if (v_4622b9.length) v_f7975f = v_4622b9;
        }
      } catch {

      }
    }
  }

  let v_076306 = undefined;
  let v_673d96 = undefined; 
  if (v_c6a7ad !== undefined && v_6e0fd3 !== undefined) {
    const v_8e8b02 = await v_3f4e2e.env.DB.prepare(
      "SELECT display_name FROM persons WHERE id = ? AND clone_id = ? AND user_id = ? LIMIT 1"
    )
      .bind(v_c6a7ad, v_6e0fd3, v_43e90c)
      .first<{ display_name: string | null }>();
    if (v_8e8b02) v_673d96 = v_c6a7ad;
    const v_3d529f = (v_8e8b02?.display_name ?? "").trim();
    if (v_3d529f) v_076306 = v_3d529f.slice(0, 80);
  }

  const v_694b25 = v_3f4e2e.env.CALL_PRETHIRD_BASE || v_1c386b;
  const v_0a6a65 = `${v_694b25.replace(/\/$/, "")}/oth-path`;
  let v_eb792a;
  try {
    v_eb792a = await fetch(v_0a6a65, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": v_43fd42,
      },
      body: JSON.stringify({
        text: v_9b6134,
        clone_id: v_6e0fd3,
        clone_name: v_f2ff36,
        user_name: v_f08a5e,
        active_person_id: v_673d96,
        user_location: v_146d3d,

        persona_description: v_102587,
        persona_attrs_summary: v_ab7387,  
        persona_core: v_4676ca,                    
        persona_tone: v_600d71,                    
        persona_knowledge: v_f7975f,          
        remembered_name: v_076306,
        text_only: v_9fb0f4,                          
      }),
    });
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `upstream: ${(v_9e86fd as Error).message}` }, 502);
  }
  if (!v_eb792a.ok) {
    const v_a896d5 = await v_eb792a.text().catch(() => "");
    return v_3f4e2e.json({ error: `upstream ${v_eb792a.status}: ${v_a896d5.slice(0, 200)}` }, 502);
  }
  const v_9390e8 = await v_eb792a.json().catch(() => null);
  if (!v_9390e8) return v_3f4e2e.json({ error: "upstream returned non-JSON" }, 502);
  return v_3f4e2e.json(v_9390e8);
});
