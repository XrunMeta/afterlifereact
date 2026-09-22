

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";

export const v_5add74 = new v_b7c41b<v_de0a25>();

const v_c930ce = new Set([
  "oth-staff@example.invalid",
  "oth-user@example.invalid",
]);

const v_f94c48 = "https://rtc.example.invalid/triposr";

v_5add74.post("/generate", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(v_43e90c)
    .first<{ email: string | null }>();
  const v_e0c7e8 = (v_3ac7e7?.email ?? "").toLowerCase();
  if (!v_c930ce.has(v_e0c7e8)) {
    throw new v_3ebe58("FORBIDDEN", "3D generate is not enabled for this account.");
  }

  const v_694b25 = v_3f4e2e.env.CALL_TRIPOSR_BASE || v_f94c48;
  const v_0a6a65 = `${v_694b25.replace(/\/$/, "")}/generate`;

  const v_c0c2d5 = v_3f4e2e.req.header("content-type") ?? "";
  if (!v_c0c2d5.startsWith("multipart/form-data")) {
    throw new v_3ebe58("VALIDATION_FAILED", "multipart/form-data required (field: image).");
  }

  let v_eb792a;
  try {
    v_eb792a = await fetch(v_0a6a65, {
      method: "POST",
      headers: { "Content-Type": v_c0c2d5 },
      body: v_3f4e2e.req.raw.body,

      duplex: "half",
    });
  } catch (v_9e86fd) {
    return v_3f4e2e.json({ error: `upstream: ${(v_9e86fd as Error).message}` }, 502);
  }
  if (!v_eb792a.ok) {
    const v_c70495 = await v_eb792a.text().catch(() => "");
    return v_3f4e2e.json({ error: `upstream ${v_eb792a.status}: ${v_c70495.slice(0, 200)}` }, 502);
  }
  const v_9390e8 = await v_eb792a.json<{ [k: string]: unknown }>().catch(() => null);
  if (!v_9390e8) return v_3f4e2e.json({ error: "upstream returned non-JSON" }, 502);

  return v_3f4e2e.json({ ...v_9390e8, base_url: v_694b25.replace(/\/$/, "") });
});
