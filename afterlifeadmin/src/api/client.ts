

function v_462b2f(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v_81e2ef = window.localStorage.getItem("afterlife.admin.apiOverride");
    return v_81e2ef && v_81e2ef.length > 0 ? v_81e2ef : null;
  } catch {
    return null;
  }
}
function v_b6d386(): string {
  const v_d2d765 = v_462b2f();
  const v_f17108 = (v_d2d765 ?? import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  return `${v_f17108}/oth-path`;
}

let v_145e43 = null;
async function v_bae635(): Promise<string | null> {
  if (v_145e43) {
    return await v_145e43.catch(() => null);
  }

  const v_06a17d = await import("./adminAuth");
  v_145e43 = v_06a17d.refreshSession();
  try {
    return await v_145e43;
  } catch {
    return null;
  } finally {
    v_145e43 = null;
  }
}

function v_83779a() {
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

async function v_576f5a<T>(v_9fe22d, v_b36f96): Promise<T> {
  const v_a215ca = async (): Promise<Response> => {
    const v_3f4675 = {
      "Content-Type": "application/json",
      ...((v_b36f96?.headers as Record<string, string>) ?? {}),
    };
    const v_21cc31 = v_8da5ba();
    if (v_21cc31 && !v_3f4675["Authorization"]) {
      v_3f4675["Authorization"] = `Bearer ${v_21cc31}`;
    }
    return await fetch(`${v_b6d386()}${v_9fe22d}`, { ...v_b36f96, headers: v_3f4675 });
  };

  let v_8f00b9 = await v_a215ca();
  if (v_8f00b9.status === 401) {
    const v_f7a7f7 = await v_bae635();
    if (v_f7a7f7) {
      v_8f00b9 = await v_a215ca(); 
    }
    if (v_8f00b9.status === 401) {
      v_83779a();
      throw new Error("unauthorized");
    }
  }
  if (!v_8f00b9.ok) {
    const v_49263d = await v_8f00b9.json().catch(() => ({ error: v_8f00b9.statusText }));
    throw new Error((v_49263d as { error: string }).error || v_8f00b9.statusText);
  }
  return v_8f00b9.json();
}

export interface RawResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: unknown;
  timeMs: number;
}

function v_8da5ba(): string | null {
  try {
    return localStorage.getItem("afterlife.admin.token");
  } catch {
    return null;
  }
}

export function v_c94c9c(v_21cc31) {
  try {
    if (v_21cc31) localStorage.setItem("afterlife.admin.token", v_21cc31);
    else localStorage.removeItem("afterlife.admin.token");
  } catch {}
}

export function v_22b25d(): string | null {
  return v_8da5ba();
}

export async function v_8e836f(
  v_bfe9b9,
  v_e6050d,
  v_4d33b2,
  v_6540eb,
): Promise<RawResponse> {
  const v_4c6dd7 = Date.now();
  const v_3f4675 = {
    "Content-Type": "application/json",
    ...v_6540eb,
  };
  const v_21cc31 = v_8da5ba();
  if (v_21cc31 && !v_3f4675["Authorization"]) {
    v_3f4675["Authorization"] = `Bearer ${v_21cc31}`;
  }
  const v_00cfc6 = {
    method: v_bfe9b9,
    headers: v_3f4675,
    credentials: "include",
  };
  if (v_4d33b2 !== undefined && v_bfe9b9 !== "GET" && v_bfe9b9 !== "HEAD") {
    v_00cfc6.body = typeof v_4d33b2 === "string" ? v_4d33b2 : JSON.stringify(v_4d33b2);
  }
  const v_a1be2d = (v_462b2f() ?? import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const v_f71b56 = /^https?:\/\//.test(v_e6050d) ? v_e6050d : `${v_a1be2d}${v_e6050d}`;
  const v_8f00b9 = await fetch(v_f71b56, v_00cfc6);
  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = v_9b6134;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }
  const v_4e3745 = {};
  v_8f00b9.headers.forEach((v_81e2ef, v_0eb677) => {
    v_4e3745[v_0eb677] = v_81e2ef;
  });
  return {
    status: v_8f00b9.status,
    ok: v_8f00b9.ok,
    headers: v_4e3745,
    body: v_8decf8,
    timeMs: Date.now() - v_4c6dd7,
  };
}

export const v_05a921 = {

  getUsers: () => v_576f5a<any[]>("/oth-path"),
  getUser: (v_389afb) => v_576f5a<any>(`/oth-path${v_389afb}`),
  deleteUser: (v_389afb) =>
    v_576f5a(`/oth-path${v_389afb}`, { method: "DELETE" }),

  getClones: () => v_576f5a<any[]>("/oth-path"),
  getClone: (v_389afb) => v_576f5a<any>(`/oth-path${v_389afb}`),
  deleteClone: (v_389afb) =>
    v_576f5a(`/oth-path${v_389afb}`, { method: "DELETE" }),

  getFeeds: () => v_576f5a<any[]>("/oth-path"),
  deleteFeed: (v_389afb) =>
    v_576f5a(`/oth-path${v_389afb}`, { method: "DELETE" }),

  getMessages: (v_6e0fd3) =>
    v_576f5a<any[]>(`/oth-path${v_6e0fd3}`),

  getStats: () => v_576f5a<any>("/oth-path"),

  getOtpLogs: (v_24baff) => {
    const v_212049 = new URLSearchParams();
    if (v_24baff?.email) v_212049.set("email", v_24baff.email);
    if (v_24baff?.limit) v_212049.set("limit", String(v_24baff.limit));
    const v_25c4f7 = v_212049.toString();
    return v_576f5a<{
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
    }>(`/oth-path${v_25c4f7 ? `?${v_25c4f7}` : ""}`);
  },

  getCloneReports: (v_24baff) => {
    const v_212049 = new URLSearchParams();
    if (v_24baff?.status) v_212049.set("status", v_24baff.status);
    if (v_24baff?.limit) v_212049.set("limit", String(v_24baff.limit));
    const v_25c4f7 = v_212049.toString();
    return v_576f5a<{
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
    }>(`/oth-path${v_25c4f7 ? `?${v_25c4f7}` : ""}`);
  },

  getSystemPersona: () =>
    v_576f5a<{ rules_text: string; blocklist: string[] }>("/oth-path"),
  updateSystemPersona: (v_9390e8) =>
    v_576f5a("/oth-path", { method: "PUT", body: JSON.stringify(v_9390e8) }),

  getPersonaQuestions: () =>
    v_576f5a<{ questions: unknown[] }>("/oth-path"),
  updatePersonaQuestions: (v_9390e8) =>
    v_576f5a<{ ok: true }>("/oth-path", { method: "PUT", body: JSON.stringify(v_9390e8) }),

  getUserReports: (v_24baff) => {
    const v_212049 = new URLSearchParams();
    if (v_24baff?.status) v_212049.set("status", v_24baff.status);
    if (v_24baff?.limit) v_212049.set("limit", String(v_24baff.limit));
    const v_25c4f7 = v_212049.toString();
    return v_576f5a<{
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
    }>(`/oth-path${v_25c4f7 ? `?${v_25c4f7}` : ""}`);
  },
};
