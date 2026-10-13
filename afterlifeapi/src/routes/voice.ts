import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_6690d9 } from "../middleware/auth";
import { v_3ebe58 } from "../lib/errors";

export const v_b74951 = new v_b7c41b<v_de0a25>();

v_b74951.post("/analyze", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ src_file_id?: number }>()
    .catch(() => ({}) as { src_file_id?: number });
  const v_433c46 = Number(v_4d33b2.src_file_id);
  if (!Number.isInteger(v_433c46) || v_433c46 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "src_file_id required.");
  }

  const v_4de33e = await v_3f4e2e.env.DB
    .prepare("SELECT id, owner_user_id FROM files WHERE id = ?")
    .bind(v_433c46)
    .first<{ id: number; owner_user_id: number | null }>();
  if (!v_4de33e || v_4de33e.owner_user_id !== v_43e90c) {
    throw new v_3ebe58("NOT_FOUND", "File not found.");
  }

  const v_694b25 = v_3f4e2e.env.PRETHIRD_PUBLIC_BASE;
  const v_43fd42 = v_3f4e2e.env.PREBUILD_SECRET;
  if (!v_694b25 || !v_43fd42) {
    return v_3f4e2e.json({ ok: false, reason: "ANALYZE_FAILED" });
  }
  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_35d74b = `${v_f17108}/oth-path${v_433c46}`;
  try {
    const v_8f00b9 = await fetch(`${v_694b25}/prethird/voice-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_43fd42}` },
      body: JSON.stringify({ voiceRawUrl: v_35d74b }),
      signal: AbortSignal.timeout(30000),
    });
    if (!v_8f00b9.ok) return v_3f4e2e.json({ ok: false, reason: "ANALYZE_FAILED" });
    const v_1b0e1d = await v_8f00b9.json<{ ok: boolean; reason?: string }>();
    return v_3f4e2e.json(v_1b0e1d);
  } catch {
    return v_3f4e2e.json({ ok: false, reason: "ANALYZE_FAILED" });
  }
});
