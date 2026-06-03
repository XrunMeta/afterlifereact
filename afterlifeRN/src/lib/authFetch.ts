

import { API_BASE } from "../config/apiBase";
import { AuthApiError, type ApiErrorBody } from "../api/auth";

const REFRESH_TOKEN_PATH = "/oth-path";
const REFRESH_COOKIE_PATH = "/oth-path";

let _refreshFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshFlight) return _refreshFlight;

  _refreshFlight = (async (): Promise<string | null> => {
    try {

      const { useAuthStore } = await import("../stores/authStore");
      const state = useAuthStore.getState();
      const storedRefreshToken = state.refreshToken;

      let newAccessToken: string | null = null;
      let newRefreshToken: string | null = null;

      if (storedRefreshToken) {

        const res = await fetch(`${API_BASE}${REFRESH_TOKEN_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.warn("[authFetch] refresh/token failed:", res.status, text.slice(0, 200));
          return null;
        }
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          accessExpiresIn: number;
        };
        newAccessToken = data.accessToken;
        newRefreshToken = data.refreshToken;
      } else {

        console.warn("[authFetch] no stored refreshToken — trying cookie-based refresh (may fail on RN)");
        const res = await fetch(`${API_BASE}${REFRESH_COOKIE_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) {
          console.warn("[authFetch] cookie refresh failed:", res.status);
          return null;
        }
        const data = (await res.json()) as { accessToken: string; accessExpiresIn: number };
        newAccessToken = data.accessToken;
      }

      if (!newAccessToken) return null;

      await state.setApiTokens(newAccessToken, newRefreshToken, { persist: true });

      console.log("[authFetch] token refreshed OK");
      return newAccessToken;
    } catch (err) {
      console.warn("[authFetch] refresh error:", err);
      return null;
    } finally {
      _refreshFlight = null;
    }
  })();

  return _refreshFlight;
}

export async function authFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
  idempotencyKey?: string,
  opts?: { multipart?: boolean },
): Promise<T> {
  const isRefreshPath =
    path === REFRESH_TOKEN_PATH || path === REFRESH_COOKIE_PATH;

  const makeHeaders = (token: string): Record<string, string> => {
    const h: Record<string, string> = {
      ...(opts?.multipart ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...((init.headers as Record<string, string>) ?? {}),
    };
    if (idempotencyKey) h["X-Idempotency-Key"] = idempotencyKey;
    return h;
  };

  const url = `${API_BASE}${path}`;
  const method = init.method ?? "GET";

  const res = await fetch(url, { ...init, headers: makeHeaders(accessToken) });
  const text = await res.text();

  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }

  if (res.ok) return parsed as T;

  const body = parsed as ApiErrorBody | null;
  const code = body?.error?.code ?? "HTTP_ERROR";
  const message = body?.error?.message ?? `HTTP ${res.status}`;

  const is401 = res.status === 401;
  const isTokenExpired = code === "UNAUTHENTICATED";

  if (is401 && isTokenExpired && !isRefreshPath) {
    console.log("[authFetch] 401 detected — attempting token refresh:", method, path);

    const newToken = await refreshAccessToken();

    if (!newToken) {

      console.warn("[authFetch] refresh failed — logging out");
      try {
        const { useAuthStore } = await import("../stores/authStore");
        await useAuthStore.getState().apiLogout();
      } catch {

      }
      throw new AuthApiError(401, code, message, body?.error?.details);
    }

    const res2 = await fetch(url, { ...init, headers: makeHeaders(newToken) });
    const text2 = await res2.text();
    let parsed2: unknown = null;
    try {
      parsed2 = text2 ? JSON.parse(text2) : null;
    } catch {

    }

    if (res2.ok) return parsed2 as T;

    const body2 = parsed2 as ApiErrorBody | null;
    const code2 = body2?.error?.code ?? "HTTP_ERROR";
    const message2 = body2?.error?.message ?? `HTTP ${res2.status}`;

    console.warn("[authFetch] retry after refresh also failed:", res2.status, code2);
    if (res2.status === 401) {
      try {
        const { useAuthStore } = await import("../stores/authStore");
        await useAuthStore.getState().apiLogout();
      } catch {

      }
    }
    throw new AuthApiError(res2.status, code2, message2, body2?.error?.details);
  }

  console.warn(
    "[authFetch] failed:",
    method,
    url,
    "status=",
    res.status,
    "code=",
    code,
    "msg=",
    message,
    "raw=",
    text.slice(0, 300),
  );
  throw new AuthApiError(res.status, code, message, body?.error?.details);
}
