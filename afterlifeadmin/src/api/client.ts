

function readApiOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem("afterlife.admin.apiOverride");
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}
function getApiBase(): string {
  const override = readApiOverride();
  const origin = (override ?? import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  return `${origin}/oth-path`;
}

let refreshInflight: Promise<string> | null = null;
async function tryRefresh(): Promise<string | null> {
  if (refreshInflight) {
    return await refreshInflight.catch(() => null);
  }

  const mod = await import("./adminAuth");
  refreshInflight = mod.refreshSession();
  try {
    return await refreshInflight;
  } catch {
    return null;
  } finally {
    refreshInflight = null;
  }
}

function clearAndRedirect() {
  try {
    localStorage.removeItem("afterlife.admin.token");
    localStorage.removeItem("afterlife.admin.refresh");
    localStorage.removeItem("afterlife.admin.profile");
  } catch {

  }
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const exec = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options?.headers as Record<string, string>) ?? {}),
    };
    const token = readToken();
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return await fetch(`${getApiBase()}${path}`, { ...options, headers });
  };

  let res = await exec();
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await exec(); 
    }
    if (res.status === 401) {
      clearAndRedirect();
      throw new Error("unauthorized");
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json();
}

export interface RawResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: unknown;
  timeMs: number;
}

function readToken(): string | null {
  try {
    return localStorage.getItem("afterlife.admin.token");
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) localStorage.setItem("afterlife.admin.token", token);
    else localStorage.removeItem("afterlife.admin.token");
  } catch {}
}

export function getAdminToken(): string | null {
  return readToken();
}

export async function rawRequest(
  method: string,
  fullPath: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<RawResponse> {
  const started = Date.now();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  const token = readToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const apiOrigin = (readApiOverride() ?? import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const url = /^https?:\/\//.test(fullPath) ? fullPath : `${apiOrigin}${fullPath}`;
  const res = await fetch(url, init);
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  const hdr: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    hdr[k] = v;
  });
  return {
    status: res.status,
    ok: res.ok,
    headers: hdr,
    body: parsed,
    timeMs: Date.now() - started,
  };
}

export const api = {

  getUsers: () => request<any[]>("/oth-path"),
  getUser: (id: string | number) => request<any>(`/oth-path${id}`),
  deleteUser: (id: string | number) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getClones: () => request<any[]>("/oth-path"),
  getClone: (id: string | number) => request<any>(`/oth-path${id}`),
  deleteClone: (id: string | number) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getFeeds: () => request<any[]>("/oth-path"),
  deleteFeed: (id: string | number) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getMessages: (cloneId: string | number) =>
    request<any[]>(`/oth-path${cloneId}`),

  getStats: () => request<any>("/oth-path"),
};
