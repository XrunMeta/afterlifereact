import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_6690d9 } from "../middleware/auth";
import { v_353f26 } from "../middleware/rateLimit";
import { v_3ebe58 } from "../lib/errors";

export const v_5f51b5 = new v_b7c41b<v_de0a25>();

const v_fa7695 = "clone_avatar";

type CheckFile = { id: number; owner_user_id: number | null; r2_key: string; purpose: string | null };
type Verdict = { ok: true } | { ok: false; reason: "NO_FACE" | "CHECK_FAILED" };

async function v_ebd298(env: v_de0a25["Bindings"], v_4de33e, v_f17108): Promise<void> {
  if (v_4de33e.purpose !== v_fa7695) return;
  try {
    const v_d0ca5b = await v_c9c489.DB
      .prepare("DELETE FROM files WHERE id = ? AND owner_user_id = ? AND purpose = ?")
      .bind(v_4de33e.id, v_4de33e.owner_user_id, v_fa7695)
      .run();
    if (!v_d0ca5b.meta?.changes) return;
    await v_c9c489.R2_ARCHIVE.delete(v_4de33e.r2_key);
    const v_a23604 = (globalThis as { caches?: { default?: Cache } }).caches?.default;
    if (v_a23604) {
      await v_a23604
        .delete(new Request(`${v_f17108}/oth-path${v_4de33e.id}`, { method: "GET" }))
        .catch(() => false);
    }
  } catch (v_9e86fd) {
    console.warn(`[face-check] purge failed file=${v_4de33e.id}: ${(v_9e86fd as Error).message}`);
  }
}

async function v_0bb1df(env: v_de0a25["Bindings"], v_f17108, v_433c46): Promise<Verdict> {
  const v_0bc646 = { ok: false, reason: "CHECK_FAILED" } as const;
  const v_694b25 = v_c9c489.PRETHIRD_PUBLIC_BASE;
  const v_43fd42 = v_c9c489.PREBUILD_SECRET;
  if (!v_694b25 || !v_43fd42) return v_0bc646;
  const v_8a33c8 = `${v_f17108}/oth-path${v_433c46}`;
  try {
    const v_8f00b9 = await fetch(`${v_694b25}/prethird/face-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_43fd42}` },
      body: JSON.stringify({ imageUrl: v_8a33c8 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!v_8f00b9.ok) return v_0bc646;
    const v_81e2ef = await v_8f00b9.json<{ ok?: unknown; reason?: unknown }>();
    if (typeof v_81e2ef?.ok !== "boolean") return v_0bc646;
    if (v_81e2ef.ok) return { ok: true };
    return { ok: false, reason: v_81e2ef.reason === "NO_FACE" ? "NO_FACE" : "CHECK_FAILED" };
  } catch {
    return v_0bc646;
  }
}

v_5f51b5.post(
  "/",

  v_353f26({ user: 10, anon: 10, bucket: "face-check" }),
  v_6690d9,
  async (v_3f4e2e) => {
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_3f4e2e.req
      .json<{ src_file_id?: number }>()
      .catch(() => ({}) as { src_file_id?: number });
    const v_433c46 = Number(v_4d33b2?.src_file_id);
    if (!Number.isInteger(v_433c46) || v_433c46 <= 0) {
      throw new v_3ebe58("VALIDATION_FAILED", "src_file_id required.");
    }

    const v_4de33e = await v_3f4e2e.env.DB
      .prepare("SELECT id, owner_user_id, r2_key, purpose FROM files WHERE id = ?")
      .bind(v_433c46)
      .first<CheckFile>();
    if (!v_4de33e || v_4de33e.owner_user_id !== v_43e90c) {
      throw new v_3ebe58("NOT_FOUND", "File not found.");
    }

    const v_f17108 = new URL(v_3f4e2e.req.url).origin;
    const v_1b0e1d = await v_0bb1df(v_3f4e2e.env, v_f17108, v_433c46);

    const v_c529cf = v_ebd298(v_3f4e2e.env, v_4de33e, v_f17108);
    let v_c248c7 = false;
    try {
      v_3f4e2e.executionCtx.waitUntil(v_c529cf);
      v_c248c7 = true;
    } catch {

    }
    if (!v_c248c7) await v_c529cf;
    return v_3f4e2e.json(v_1b0e1d);
  },
);
