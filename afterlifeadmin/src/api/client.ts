

const v_8aa4be = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const v_cc9198 = `${v_8aa4be}/oth-path`;

async function v_576f5a<T>(v_9fe22d, v_b36f96): Promise<T> {
  const v_8f00b9 = await fetch(`${v_cc9198}${v_9fe22d}`, {
    ...v_b36f96,
    headers: {
      "Content-Type": "application/json",
      ...v_b36f96?.headers,
    },
  });
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
  const v_f71b56 = /^https?:\/\//.test(v_e6050d) ? v_e6050d : `${v_8aa4be}${v_e6050d}`;
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
};
