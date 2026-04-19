import { v_326be8 } from "rcmrninabrnb";
import { v_ad99b4, v_19c48d, v_9ded95 } from "./config";
import { v_fe6cdd, type v_30a5d4 } from "./errors";
import { v_820df3 } from "./storage";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type RequestOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  auth?: boolean;
  idempotent?: boolean;
  signal?: AbortSignal;
  parseJson?: boolean;
};

let v_c477c6 = null;

function v_07ba85(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + "-" + Date.now();
}

function v_38ccaa(
  v_9fe22d,
  v_7c5791,
): string {
  const v_2f361a = v_9fe22d.startsWith("/") ? v_9fe22d : `/${v_9fe22d}`;
  const v_f71b56 = `${v_ad99b4}${v_2f361a}`;
  if (!v_7c5791) return v_f71b56;
  const v_24baff = new URLSearchParams();
  for (const [v_0eb677, v_81e2ef] of Object.entries(v_7c5791)) {
    if (v_81e2ef === undefined || v_81e2ef === null) continue;
    v_24baff.append(v_0eb677, String(v_81e2ef));
  }
  const v_212049 = v_24baff.toString();
  return v_212049 ? `${v_f71b56}?${v_212049}` : v_f71b56;
}

async function v_54f21b(): Promise<boolean> {
  if (v_326be8.OS !== "web") {
    return false;
  }
  if (v_c477c6) return v_c477c6;
  v_c477c6 = (async () => {
    try {
      const v_8f00b9 = await fetch(`${v_ad99b4}/oth-path`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!v_8f00b9.ok) return false;
      const v_9390e8 = (await v_8f00b9.json().catch(() => null)) as
        | { accessToken?: string; accessExpiresIn?: number }
        | null;
      if (!v_9390e8?.accessToken || !v_9390e8.accessExpiresIn) return false;
      await v_820df3.setAccessToken(v_9390e8.accessToken, v_9390e8.accessExpiresIn);
      return true;
    } catch {
      return false;
    } finally {
      v_c477c6 = null;
    }
  })();
  return v_c477c6;
}

export async function v_576f5a<T = unknown>(
  v_9fe22d,
  v_328259 = {},
): Promise<T> {
  const {
    method: v_bfe9b9 = "GET",
    body: v_4d33b2,
    query: v_7c5791,
    headers: v_3f4675 = {},
    auth: v_68f0aa = true,
    idempotent: v_7a467e = v_bfe9b9 !== "GET",
    signal: v_361415,
    parseJson: v_4c95c2 = true,
  } = v_328259;

  const v_f71b56 = v_38ccaa(v_9fe22d, v_7c5791);
  const v_79ebec = v_07ba85();

  const v_a99cf9 = {
    ...v_19c48d,
    ...v_3f4675,
    "X-Request-Id": v_79ebec,
  };

  if (v_7a467e && !v_a99cf9["X-Idempotency-Key"]) {
    v_a99cf9["X-Idempotency-Key"] = v_07ba85();
  }

  if (v_68f0aa) {
    const v_21cc31 = await v_820df3.getAccessToken();
    if (v_21cc31) v_a99cf9.Authorization = `Bearer ${v_21cc31}`;
  }

  const v_22d288 = new AbortController();
  const v_3894d5 = setTimeout(() => v_22d288.abort(), v_9ded95);
  if (v_361415) {
    v_361415.addEventListener("abort", () => v_22d288.abort());
  }

  const v_156aa6 = (): Promise<Response> =>
    fetch(v_f71b56, {
      method: v_bfe9b9,
      headers: v_a99cf9,
      body: v_4d33b2 !== undefined ? JSON.stringify(v_4d33b2) : undefined,
      credentials: "include",
      signal: v_22d288.signal,
    });

  let v_8f00b9;
  try {
    v_8f00b9 = await v_156aa6();
  } catch (v_9e86fd) {
    clearTimeout(v_3894d5);
    const v_6c558f = (v_9e86fd as Error)?.name === "AbortError";
    throw new v_fe6cdd(0, v_6c558f ? "Request timed out" : "Network error", {
      requestId: v_79ebec,
    });
  }

  if (v_8f00b9.status === 401 && v_68f0aa) {
    const v_f7a7f7 = await v_54f21b();
    if (v_f7a7f7) {
      const v_4094c3 = await v_820df3.getAccessToken();
      if (v_4094c3) v_a99cf9.Authorization = `Bearer ${v_4094c3}`;
      try {
        v_8f00b9 = await v_156aa6();
      } catch (v_9e86fd) {
        clearTimeout(v_3894d5);
        const v_6c558f = (v_9e86fd as Error)?.name === "AbortError";
        throw new v_fe6cdd(0, v_6c558f ? "Request timed out" : "Network error", {
          requestId: v_79ebec,
        });
      }
    } else {
      await v_820df3.clear();
    }
  }

  clearTimeout(v_3894d5);

  if (v_8f00b9.status === 204) {
    return undefined as T;
  }

  let v_9390e8 = null;
  if (v_4c95c2) {
    const v_9b6134 = await v_8f00b9.text();
    if (v_9b6134) {
      try {
        v_9390e8 = JSON.parse(v_9b6134);
      } catch {
        v_9390e8 = v_9b6134;
      }
    }
  }

  if (!v_8f00b9.ok) {
    const v_931bf0 = (v_9390e8 ?? {}) as v_30a5d4;
    const v_a8cd21 =
      v_931bf0.message ??
      v_931bf0.error ??
      `Request failed (${v_8f00b9.status})`;
    throw new v_fe6cdd(v_8f00b9.status, v_a8cd21, {
      code: v_931bf0.code,
      payload: v_931bf0,
      requestId: v_79ebec,
    });
  }

  return v_9390e8 as T;
}

export const v_9a8286 = {
  get: <T>(v_9fe22d, v_328259 = {}) =>
    v_576f5a<T>(v_9fe22d, { ...v_328259, method: "GET" }),
  post: <T>(v_9fe22d, v_4d33b2, v_328259 = {}) =>
    v_576f5a<T>(v_9fe22d, { ...v_328259, method: "POST", body: v_4d33b2 }),
  patch: <T>(v_9fe22d, v_4d33b2, v_328259 = {}) =>
    v_576f5a<T>(v_9fe22d, { ...v_328259, method: "PATCH", body: v_4d33b2 }),
  put: <T>(v_9fe22d, v_4d33b2, v_328259 = {}) =>
    v_576f5a<T>(v_9fe22d, { ...v_328259, method: "PUT", body: v_4d33b2 }),
  delete: <T>(v_9fe22d, v_328259 = {}) =>
    v_576f5a<T>(v_9fe22d, { ...v_328259, method: "DELETE" }),
};
