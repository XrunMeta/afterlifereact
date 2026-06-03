

import { v_cc9198 } from "../config/apiBase";
import { v_84a859, type v_669377 } from "../api/auth";

const v_a089f8 = "/oth-path";
const v_d331e7 = "/oth-path";

let v_360aa6 = null;

async function v_4dd1c9(): Promise<string | null> {
  if (v_360aa6) return v_360aa6;

  v_360aa6 = (async (): Promise<string | null> => {
    try {

      const { useAuthStore: v_1ed7d9 } = await import("../stores/authStore");
      const v_b6e533 = v_1ed7d9.getState();
      const v_2474a1 = v_b6e533.refreshToken;

      let v_5451e8 = null;
      let v_ca30ed = null;

      if (v_2474a1) {

        const v_8f00b9 = await fetch(`${v_cc9198}${v_a089f8}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: v_2474a1 }),
        });
        if (!v_8f00b9.ok) {
          const v_9b6134 = await v_8f00b9.text();
          console.warn("[authFetch] refresh/token failed:", v_8f00b9.status, v_9b6134.slice(0, 200));
          return null;
        }
        const v_9390e8 = (await v_8f00b9.json()) as {
          accessToken: string;
          refreshToken: string;
          accessExpiresIn: number;
        };
        v_5451e8 = v_9390e8.accessToken;
        v_ca30ed = v_9390e8.refreshToken;
      } else {

        console.warn("[authFetch] no stored refreshToken — trying cookie-based refresh (may fail on RN)");
        const v_8f00b9 = await fetch(`${v_cc9198}${v_d331e7}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!v_8f00b9.ok) {
          console.warn("[authFetch] cookie refresh failed:", v_8f00b9.status);
          return null;
        }
        const v_9390e8 = (await v_8f00b9.json()) as { accessToken: string; accessExpiresIn: number };
        v_5451e8 = v_9390e8.accessToken;
      }

      if (!v_5451e8) return null;

      await v_b6e533.setApiTokens(v_5451e8, v_ca30ed, { persist: true });

      console.log("[authFetch] token refreshed OK");
      return v_5451e8;
    } catch (v_49263d) {
      console.warn("[authFetch] refresh error:", v_49263d);
      return null;
    } finally {
      v_360aa6 = null;
    }
  })();

  return v_360aa6;
}

export async function v_04b58a<T>(
  v_9fe22d,
  v_2ca7e0,
  v_00cfc6 = {},
  v_6f448e,
  v_328259,
): Promise<T> {
  const v_f85997 =
    v_9fe22d === v_a089f8 || v_9fe22d === v_d331e7;

  const v_bdc6fc = (v_21cc31): Record<string, string> => {
    const v_65a2cd = {
      ...(v_328259?.multipart ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${v_21cc31}`,
      ...((v_00cfc6.headers as Record<string, string>) ?? {}),
    };
    if (v_6f448e) v_65a2cd["X-Idempotency-Key"] = v_6f448e;
    return v_65a2cd;
  };

  const v_f71b56 = `${v_cc9198}${v_9fe22d}`;
  const v_bfe9b9 = v_00cfc6.method ?? "GET";

  const v_8f00b9 = await fetch(v_f71b56, { ...v_00cfc6, headers: v_bdc6fc(v_2ca7e0) });
  const v_9b6134 = await v_8f00b9.text();

  let v_8decf8 = null;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }

  if (v_8f00b9.ok) return v_8decf8 as T;

  const v_4d33b2 = v_8decf8 as v_669377 | null;
  const v_c99bd2 = v_4d33b2?.error?.code ?? "HTTP_ERROR";
  const v_a8cd21 = v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`;

  const v_187e93 = v_8f00b9.status === 401;
  const v_563acb = v_c99bd2 === "UNAUTHENTICATED";

  if (v_187e93 && v_563acb && !v_f85997) {
    console.log("[authFetch] 401 detected — attempting token refresh:", v_bfe9b9, v_9fe22d);

    const v_4094c3 = await v_4dd1c9();

    if (!v_4094c3) {

      console.warn("[authFetch] refresh failed — logging out");
      try {
        const { useAuthStore: v_1ed7d9 } = await import("../stores/authStore");
        await v_1ed7d9.getState().apiLogout();
      } catch {

      }
      throw new v_84a859(401, v_c99bd2, v_a8cd21, v_4d33b2?.error?.details);
    }

    const v_48bbbd = await fetch(v_f71b56, { ...v_00cfc6, headers: v_bdc6fc(v_4094c3) });
    const v_e0f89e = await v_48bbbd.text();
    let v_7fcbbc = null;
    try {
      v_7fcbbc = v_e0f89e ? JSON.parse(v_e0f89e) : null;
    } catch {

    }

    if (v_48bbbd.ok) return v_7fcbbc as T;

    const v_ef157f = v_7fcbbc as v_669377 | null;
    const v_cfc601 = v_ef157f?.error?.code ?? "HTTP_ERROR";
    const v_3b61b3 = v_ef157f?.error?.message ?? `HTTP ${v_48bbbd.status}`;

    console.warn("[authFetch] retry after refresh also failed:", v_48bbbd.status, v_cfc601);
    if (v_48bbbd.status === 401) {
      try {
        const { useAuthStore: v_1ed7d9 } = await import("../stores/authStore");
        await v_1ed7d9.getState().apiLogout();
      } catch {

      }
    }
    throw new v_84a859(v_48bbbd.status, v_cfc601, v_3b61b3, v_ef157f?.error?.details);
  }

  console.warn(
    "[authFetch] failed:",
    v_bfe9b9,
    v_f71b56,
    "status=",
    v_8f00b9.status,
    "code=",
    v_c99bd2,
    "msg=",
    v_a8cd21,
    "raw=",
    v_9b6134.slice(0, 300),
  );
  throw new v_84a859(v_8f00b9.status, v_c99bd2, v_a8cd21, v_4d33b2?.error?.details);
}
