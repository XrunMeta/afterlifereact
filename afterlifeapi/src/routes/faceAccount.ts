

import { v_b7c41b, type v_437670 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_6690d9 } from "../middleware/auth";
import { v_769690 } from "../lib/xrunAccountFace";

export const v_acf120 = new v_b7c41b<v_de0a25>();

const v_d291e8 = 4;
const v_b9cb1f = 2_000_000;
const v_21bb34 = new Set(["afl_signup", "login"]);

type XrunJson = { status?: string; code?: string | number; message?: string; data?: unknown };

async function v_0bb1df(c: v_437670<v_de0a25>, v_8f00b9) {
  let v_7ecfd1 = null;
  try {
    v_7ecfd1 = (await v_8f00b9.json()) as XrunJson;
  } catch {

  }
  if (v_8f00b9.ok && v_7ecfd1?.status === "success") return v_3f4e2e.json({ ok: true, data: v_7ecfd1.data ?? null });
  const v_c99bd2 = typeof v_7ecfd1?.code === "string" ? v_7ecfd1.code : "XRUN_ERROR";

  const v_d308b5 = v_8f00b9.status === 401 || v_8f00b9.status === 403 || v_8f00b9.status < 400 ? 502 : v_8f00b9.status;
  return v_d5bb0f(v_3f4e2e, v_c99bd2, v_d308b5);
}

function v_d5bb0f(c: v_437670<v_de0a25>, v_c99bd2, v_d308b5) {
  return v_3f4e2e.json({ error: { code: v_c99bd2, message: v_c99bd2 } }, v_d308b5 as 400);
}

function v_9765c6(c: v_437670<v_de0a25>, v_7ecfd1): Record<string, string> {
  const v_65a2cd = { "X-Internal-Secret": v_3f4e2e.env.XRUN_INTERNAL_SECRET ?? "" };
  if (v_7ecfd1) v_65a2cd["Content-Type"] = "application/json";
  return v_65a2cd;
}

async function v_68d2b9(c: v_437670<v_de0a25>): Promise<number | Response> {
  if (!v_3f4e2e.env.XRUN_INTERNAL_SECRET) return v_d5bb0f(v_3f4e2e, "FACE_DISABLED", 503);
  const v_660822 = await v_769690(v_3f4e2e.env.DB, v_3f4e2e.get("userId")!);
  if (!v_660822) return v_d5bb0f(v_3f4e2e, "NO_XRUN_ACCOUNT", 409);
  return v_660822;
}

v_acf120.get("/status", v_6690d9, async (v_3f4e2e) => {
  const v_660822 = await v_68d2b9(v_3f4e2e);
  if (v_660822 instanceof Response) {

    return v_3f4e2e.json({ ok: true, data: { enabled: false } });
  }
  try {
    const v_8f00b9 = await fetch(`${v_3f4e2e.env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_9765c6(v_3f4e2e, true),
      body: JSON.stringify({ member: v_660822 }),
    });
    if (!v_8f00b9.ok) return v_3f4e2e.json({ ok: true, data: { enabled: false } });
    return v_0bb1df(v_3f4e2e, v_8f00b9);
  } catch {
    return v_3f4e2e.json({ ok: true, data: { enabled: false } });
  }
});

v_acf120.post("/challenge", v_6690d9, async (v_3f4e2e) => {
  const v_660822 = await v_68d2b9(v_3f4e2e);
  if (v_660822 instanceof Response) return v_660822;
  try {
    const v_8f00b9 = await fetch(`${v_3f4e2e.env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_9765c6(v_3f4e2e, true),
      body: JSON.stringify({ member: v_660822 }),
    });
    return v_0bb1df(v_3f4e2e, v_8f00b9);
  } catch {
    return v_d5bb0f(v_3f4e2e, "NETWORK", 502);
  }
});

v_acf120.post("/enroll", v_6690d9, async (v_3f4e2e) => {
  const v_660822 = await v_68d2b9(v_3f4e2e);
  if (v_660822 instanceof Response) return v_660822;
  const v_ebd523 = await v_3f4e2e.req.formData().catch(() => null);
  if (!v_ebd523) return v_d5bb0f(v_3f4e2e, "FRAMES_INVALID", 400);
  const v_3b40dd = (v_ebd523.getAll("frames") as unknown[]).filter((v_8b5cd8) => typeof v_8b5cd8 !== "string") as File[];
  if (v_3b40dd.length < 2 || v_3b40dd.length > v_d291e8 || v_3b40dd.some((v_8b5cd8) => v_8b5cd8.size <= 0 || v_8b5cd8.size > v_b9cb1f)) {
    return v_d5bb0f(v_3f4e2e, "FRAMES_INVALID", 400);
  }
  const v_04e790 = String(v_ebd523.get("source") ?? "");
  const v_8d4337 = new FormData();
  v_8d4337.set("member", String(v_660822));
  v_8d4337.set("challengeId", String(v_ebd523.get("challengeId") ?? ""));
  v_8d4337.set("source", v_21bb34.has(v_04e790) ? v_04e790 : "login");
  v_3b40dd.forEach((v_8b5cd8, v_ebec57) => v_8d4337.append("frames", new File([v_8b5cd8], `f${v_ebec57}.jpg`, { type: "image/jpeg" })));
  try {
    const v_8f00b9 = await fetch(`${v_3f4e2e.env.XRUN_API_URL}/oth-path`, {
      method: "POST",
      headers: v_9765c6(v_3f4e2e, false),
      body: v_8d4337,
    });
    return v_0bb1df(v_3f4e2e, v_8f00b9);
  } catch {
    return v_d5bb0f(v_3f4e2e, "NETWORK", 502);
  }
});
