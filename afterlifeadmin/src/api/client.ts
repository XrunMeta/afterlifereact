

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

export interface AdminCloneListItem {
  id: number;
  name: string;
  username: string;
  avatarUrl: string | null;
  cloneType: string;
  visibility: string;
  trainingStatus: string;
  ownerId: number;
  ownerName: string | null;
  ownerXrunMemberId: string | null;
  createdAt: string;
  deletionState: "active" | "soft_deleted" | "archived_cold" | "hard_deleted";
  softDeletedAt: string | null;
  deletedAt: string | null;

  adminSuspendedAt: string | null;
  adminSuspendReason: string | null;
  reportCount: number;
  commentCount: number;
  likeCount: number;
  followerCount: number;
  interactionCount: number;
}
export interface AdminCloneListResponse {
  items: AdminCloneListItem[];
  total: number;
  offset: number;
  limit: number;
}
export interface AdminCloneListParams {
  visibility?: string;
  deletionState?: string;

  suspended?: boolean;
  minReports?: number;
  q?: string;
  offset?: number;
  limit?: number;
}

export const api = {

  getUsers: () => request<any[]>("/oth-path"),
  getUser: (id: string | number) => request<any>(`/oth-path${id}`),
  deleteUser: (id: string | number) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getClones: (params?: AdminCloneListParams) => {
    const qs = new URLSearchParams();
    if (params?.visibility) qs.set("visibility", params.visibility);
    if (params?.deletionState) qs.set("deletionState", params.deletionState);
    if (params?.suspended !== undefined) qs.set("suspended", params.suspended ? "1" : "0");
    if (params?.minReports) qs.set("minReports", String(params.minReports));
    if (params?.q) qs.set("q", params.q);
    if (params?.offset) qs.set("offset", String(params.offset));
    if (params?.limit) qs.set("limit", String(params.limit));
    const tail = qs.toString();
    return request<AdminCloneListResponse>(`/oth-path${tail ? `?${tail}` : ""}`);
  },
  getClone: (id: string | number) => request<any>(`/oth-path${id}`),

  deleteClone: (id: string | number, reason: string) =>
    request(`/oth-path${id}`, { method: "DELETE", body: JSON.stringify({ reason }) }),

  suspendClone: (id: string | number, reason: string) =>
    request(`/oth-path${id}/disable`, { method: "POST", body: JSON.stringify({ reason }) }),

  restoreClone: (id: string | number, reason?: string) =>
    request(`/oth-path${id}/activate`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  getFeeds: () => request<any[]>("/oth-path"),
  deleteFeed: (id: string | number) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getMessages: (cloneId: string | number) =>
    request<any[]>(`/oth-path${cloneId}`),

  getStats: () => request<any>("/oth-path"),

  getOtpLogs: (params?: { email?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.email) qs.set("email", params.email);
    if (params?.limit) qs.set("limit", String(params.limit));
    const tail = qs.toString();
    return request<{
      items: Array<{
        id: number;
        email: string;
        code: string;
        sentAt: string;
        expiresAt: string;
        status: "pending" | "verified" | "expired" | "exhausted";
        attempts: number;
        verifiedAt: string | null;
      }>;
    }>(`/oth-path${tail ? `?${tail}` : ""}`);
  },

  getCloneReports: (params?: { status?: string; limit?: number; reason?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.reason) qs.set("reason", params.reason);
    const tail = qs.toString();
    return request<{
      items: Array<{
        id: number;
        userId: number;
        userName: string | null;
        userEmail: string;
        cloneId: number;
        cloneName: string;
        cloneUsername: string;
        cloneOwnerId: number;
        cloneOwnerName: string | null;
        cloneOwnerEmail: string | null;
        reason: string | null;
        status: string;
        createdAt: string;
        reviewedAt: string | null;
      }>;
    }>(`/oth-path${tail ? `?${tail}` : ""}`);
  },

  getSystemPersona: () =>
    request<{ rules_text: string; blocklist: string[] }>("/oth-path"),
  updateSystemPersona: (data: { rules_text: string; blocklist: string[] }) =>
    request("/oth-path", { method: "PUT", body: JSON.stringify(data) }),

  getPersonaQuestions: () =>
    request<{ questions: unknown[] }>("/oth-path"),
  updatePersonaQuestions: (data: { questions: unknown[] }) =>
    request<{ ok: true }>("/oth-path", { method: "PUT", body: JSON.stringify(data) }),

  getUserReports: (params?: { status?: string; limit?: number; reason?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.reason) qs.set("reason", params.reason);
    const tail = qs.toString();
    return request<{
      items: Array<{
        id: number;
        reporterId: number;
        reporterName: string | null;
        reporterEmail: string;
        targetId: number;
        targetName: string | null;
        targetEmail: string;
        reason: string | null;
        status: string;
        createdAt: string;
        reviewedAt: string | null;
      }>;
    }>(`/oth-path${tail ? `?${tail}` : ""}`);
  },

  getUserDetail: (id: string | number) =>
    request<{
      user: {
        id: number;
        name: string | null;
        email: string;
        deletionState: string;
        suspendedUntil: string | null;
        createdAt: string;
        warningCount: number;
      };
      warnings: Array<{ id: number; reason: string | null; createdAt: string }>;
      reports: Array<{
        id: number;
        reason: string | null;
        status: string;
        createdAt: string;
        reporterEmail: string;
      }>;
      clones: Array<{
        id: number;
        name: string;
        username: string;
        cloneType: string;
        deletionState: string;
      }>;
    }>(`/oth-path${id}/detail`),

  warnUser: (id: string | number, body?: { reportId?: number; reason?: string }) =>
    request<{
      ok: true;
      warningCount: number;
      suspended: boolean;
      suspendedUntil: string | null;
    }>(`/oth-path${id}/warn`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  dismissUserReport: (reportId: string | number, message?: string) =>
    request<{ ok: true; updated: number }>(
      `/oth-path${reportId}/dismiss`,
      { method: "POST", body: JSON.stringify({ message: message ?? null }) },
    ),

  applyUserPenalty: (
    id: string | number,
    body: {
      action:
        | "warn"
        | "clone_deactivate"
        | "clone_delete"
        | "clone_create_ban"
        | "account_ban"
        | "account_withdraw";
      suspendDays?: number | null;
      reason?: string;
      reportId?: number | null;
      reporterMessage?: string;
    },
  ) =>
    request<{ ok: true; message: string }>(
      `/oth-path${id}/apply-penalty`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  getVoicePresets: () =>
    request<{
      voices: Array<{
        id: number;
        name: string;
        name_en: string | null;
        name_ja: string | null;
        name_zh_cn: string | null;
        name_id: string | null;
        gender: string | null;
        age_range: string | null;
        description: string | null;
        sort_order: number;
        is_active: 0 | 1;
        r2_key: string | null;
        se_key: string | null;
      }>;
    }>(`/oth-path`),
  createVoicePreset: (body: {
    name: string;
    name_en?: string | null;
    name_ja?: string | null;
    name_zh_cn?: string | null;
    name_id?: string | null;
    gender?: string | null;
    age_range?: string | null;
    description?: string | null;
    sort_order?: number;
    is_active?: 0 | 1;
    r2_key?: string | null;
    se_key?: string | null;
  }) =>
    request<{ id: number }>(`/oth-path`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateVoicePreset: (
    id: number,
    body: {
      name?: string;
      name_en?: string | null;
      name_ja?: string | null;
      name_zh_cn?: string | null;
      name_id?: string | null;
      gender?: string | null;
      age_range?: string | null;
      description?: string | null;
      sort_order?: number;
      is_active?: 0 | 1;
      r2_key?: string | null;
      se_key?: string | null;
    },
  ) =>
    request<{ ok: true }>(`/oth-path${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getReportPenaltyRules: () =>
    request<{
      items: Array<{
        threshold: number;
        action: "warn" | "suspend";
        suspendDays: number | null;
        updatedAt: string;
      }>;
    }>(`/oth-path`),
  putReportPenaltyRule: (
    threshold: number,
    body: { action: "warn" | "suspend"; suspendDays: number | null },
  ) =>
    request<{ ok: true }>(`/oth-path${threshold}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteReportPenaltyRule: (threshold: number) =>
    request<{ ok: true; deleted: number }>(
      `/oth-path${threshold}`,
      { method: "DELETE" },
    ),

  getFaceRecognitionPersons: (params?: { userId?: number; cloneId?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.userId) qs.set("userId", String(params.userId));
    if (params?.cloneId) qs.set("cloneId", String(params.cloneId));
    if (params?.limit) qs.set("limit", String(params.limit));
    const tail = qs.toString();
    return request<{
      items: Array<{
        personId: number;
        userId: number;
        cloneId: number | null;
        displayName: string | null;
        consentState: string;
        createdAt: number;
        userName: string | null;
        userEmail: string;
        cloneName: string | null;
        cloneUsername: string | null;
        cloneFaceCount: number;
        legacyFaceCount: number;
        lastEnrollAt: number | null;
        srcEnroll: number;
        srcCall: number;
        srcSelf: number;
      }>;
    }>(`/oth-path${tail ? `?${tail}` : ""}`);
  },
  getFaceRecognitionPersonFaces: (personId: number) =>
    request<{
      items: Array<{
        id: number;
        tbl: "clone_person_faces" | "face_embeddings";
        cloneId: number | null;
        vectorizeId: string | null;
        model: string | null;
        dim: number | null;
        source: string;
        createdAt: number;
      }>;
    }>(`/oth-path${personId}/faces`),

  getCrashReports: (params?: {
    fatal?: "0" | "1";
    userId?: number;
    screen?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.fatal) qs.set("fatal", params.fatal);
    if (params?.userId) qs.set("userId", String(params.userId));
    if (params?.screen) qs.set("screen", params.screen);
    if (params?.q) qs.set("q", params.q);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const tail = qs.toString();
    return request<{
      items: Array<{
        id: number;
        userId: number | null;
        userEmail: string | null;
        ts: number;
        receivedAt: number;
        isFatal: boolean;
        errorName: string | null;
        message: string;
        screen: string | null;
        appVersion: string | null;
        runtimeVersion: string | null;
        updateId: string | null;
        channel: string | null;
        platform: string | null;
        osVersion: string | null;
        deviceModel: string | null;
        locale: string | null;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(`/oth-path${tail ? `?${tail}` : ""}`);
  },
  getCrashReport: (id: number) =>
    request<{
      item: {
        id: number;
        userId: number | null;
        userEmail: string | null;
        ts: number;
        receivedAt: number;
        isFatal: boolean;
        errorName: string | null;
        message: string;
        stack: string | null;
        screen: string | null;
        breadcrumbs: Array<{ category: string; message: string; ts?: number; data?: Record<string, unknown> }>;
        extra: Record<string, unknown> | null;
        appVersion: string | null;
        runtimeVersion: string | null;
        updateId: string | null;
        channel: string | null;
        platform: string | null;
        osVersion: string | null;
        deviceModel: string | null;
        locale: string | null;
      };
    }>(`/oth-path${id}`),
  deleteCrashReport: (id: number) =>
    request<{ ok: true }>(`/oth-path${id}`, { method: "DELETE" }),

  getConversations: (userEmail: string) =>
    request<{
      user_id: number | null;
      user_email: string;
      clones: Array<{
        id: number;
        name: string;
        created_at: string;
        items: Array<{ ts: number; input: string; answer: string; meta: Record<string, unknown> }>;
        count?: number;
        error?: string;
      }>;
    }>(`/oth-path?user_email=${encodeURIComponent(userEmail)}`),
};
