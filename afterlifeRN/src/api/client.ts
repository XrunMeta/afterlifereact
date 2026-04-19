import { Platform } from "react-native";
import { API_BASE_URL, API_DEFAULT_HEADERS, API_TIMEOUT_MS } from "./config";
import { ApiError, type ApiErrorPayload } from "./errors";
import { tokenStorage } from "./storage";

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

let refreshInFlight: Promise<boolean> | null = null;

function uuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + "-" + Date.now();
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${trimmed}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function attemptRefresh(): Promise<boolean> {
  if (Platform.OS !== "web") {
    return false;
  }
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/oth-path`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return false;
      const data = (await res.json().catch(() => null)) as
        | { accessToken?: string; accessExpiresIn?: number }
        | null;
      if (!data?.accessToken || !data.accessExpiresIn) return false;
      await tokenStorage.setAccessToken(data.accessToken, data.accessExpiresIn);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    auth = true,
    idempotent = method !== "GET",
    signal,
    parseJson = true,
  } = opts;

  const url = buildUrl(path, query);
  const reqId = uuid();

  const finalHeaders: Record<string, string> = {
    ...API_DEFAULT_HEADERS,
    ...headers,
    "X-Request-Id": reqId,
  };

  if (idempotent && !finalHeaders["X-Idempotency-Key"]) {
    finalHeaders["X-Idempotency-Key"] = uuid();
  }

  if (auth) {
    const token = await tokenStorage.getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener("abort", () => ctrl.abort());
  }

  const doFetch = (): Promise<Response> =>
    fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: ctrl.signal,
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch (e) {
    clearTimeout(timeoutId);
    const aborted = (e as Error)?.name === "AbortError";
    throw new ApiError(0, aborted ? "Request timed out" : "Network error", {
      requestId: reqId,
    });
  }

  if (res.status === 401 && auth) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      const newToken = await tokenStorage.getAccessToken();
      if (newToken) finalHeaders.Authorization = `Bearer ${newToken}`;
      try {
        res = await doFetch();
      } catch (e) {
        clearTimeout(timeoutId);
        const aborted = (e as Error)?.name === "AbortError";
        throw new ApiError(0, aborted ? "Request timed out" : "Network error", {
          requestId: reqId,
        });
      }
    } else {
      await tokenStorage.clear();
    }
  }

  clearTimeout(timeoutId);

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  if (parseJson) {
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
  }

  if (!res.ok) {
    const payload = (data ?? {}) as ApiErrorPayload;
    const message =
      payload.message ??
      payload.error ??
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, {
      code: payload.code,
      payload,
      requestId: reqId,
    });
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, opts: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
