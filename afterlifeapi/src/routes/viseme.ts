

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

  const v_694b25 = v_3f4e2e.env.PRETHIRD_PUBLIC_BASE || v_1c386b;
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
    .json<{ text?: string; clone_id?: number }>()
    .catch(() => ({} as { text?: string; clone_id?: number }));
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  if (!v_9b6134) throw new v_3ebe58("VALIDATION_FAILED", "text required.");
  if (v_9b6134.length > 2000) throw new v_3ebe58("VALIDATION_FAILED", "text too long (max 2000).");
  const v_6e0fd3 = Number.isInteger(v_4d33b2.clone_id) ? v_4d33b2.clone_id : undefined;

  const v_694b25 = v_3f4e2e.env.PRETHIRD_PUBLIC_BASE || v_1c386b;
  const v_0a6a65 = `${v_694b25.replace(/\/$/, "")}/oth-path`;
  let v_eb792a;
  try {
    v_eb792a = await fetch(v_0a6a65, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": v_43fd42,
      },
      body: JSON.stringify({ text: v_9b6134, clone_id: v_6e0fd3 }),
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
