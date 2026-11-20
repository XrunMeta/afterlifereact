

export function v_291582(v_c9c489): boolean {
  return v_c9c489.VOICE_PRESET_SYNC_REQUIRED === "1";
}

export function v_ec7e95(): string {

  const v_8d41d7 = Date.now().toString(36);
  const v_fc3f08 = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `preset-${v_8d41d7}${v_fc3f08}`;
}

export interface GabiaSyncOk {
  ok: true;
  path: string;
  bytes: number;
}

export interface GabiaSyncFail {
  ok: false;
  reason: string;
  status: number;
}

const v_635f22 = 30_000;

export async function v_7a8165(
  v_c9c489,
  v_2f693a,
  v_48d922,
  v_c0c2d5,
): Promise<GabiaSyncOk | GabiaSyncFail> {
  if (!v_c9c489.LEARN_SECRET) {
    return { ok: false, reason: "learn-secret-missing", status: 0 };
  }
  if (!v_c9c489.CALL_PRETHIRD_BASE) {
    return { ok: false, reason: "prethird-base-missing", status: 0 };
  }
  const v_f71b56 = `${v_c9c489.CALL_PRETHIRD_BASE.replace(/\/$/, "")}/oth-path`;
  const v_ebd523 = new FormData();
  v_ebd523.append("se_key", v_2f693a);
  v_ebd523.append(
    "file",
    new Blob([v_48d922], { type: v_c0c2d5 || "application/octet-stream" }),
    "sample",
  );

  const v_4fc7c7 = new AbortController();
  const v_8d41d7 = setTimeout(() => v_4fc7c7.abort(), v_635f22);
  try {
    const v_eb792a = await fetch(v_f71b56, {
      method: "POST",
      headers: { "X-Admin-Secret": v_c9c489.LEARN_SECRET },
      body: v_ebd523,
      signal: v_4fc7c7.signal,
    });
    const v_9b6134 = await v_eb792a.text();

    type GabiaBody = { ok?: boolean; path?: string; bytes?: number; error?: string };
    let v_4d33b2 = null;
    try {
      v_4d33b2 = v_9b6134 ? (JSON.parse(v_9b6134) as GabiaBody) : null;
    } catch {
      v_4d33b2 = null;
    }
    if (v_eb792a.ok && v_4d33b2?.ok && typeof v_4d33b2.path === "string" && typeof v_4d33b2.bytes === "number") {
      return { ok: true, path: v_4d33b2.path, bytes: v_4d33b2.bytes };
    }
    const v_58ca36 = v_4d33b2?.error ?? `gabia ${v_eb792a.status}`;
    return { ok: false, reason: v_58ca36, status: v_eb792a.status };
  } catch (v_9e86fd) {
    if ((v_9e86fd as Error).name === "AbortError") {
      return { ok: false, reason: "timeout", status: 0 };
    }
    return { ok: false, reason: (v_9e86fd as Error).message || "fetch failed", status: 0 };
  } finally {
    clearTimeout(v_8d41d7);
  }
}
