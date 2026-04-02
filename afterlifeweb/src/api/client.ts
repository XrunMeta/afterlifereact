const API_BASE = "/oth-path";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json();
}

export const api = {

  getUsers: () => request<any[]>("/oth-path"),
  getUser: (id: string) => request<any>(`/oth-path${id}`),
  deleteUser: (id: string) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getClones: () => request<any[]>("/oth-path"),
  getClone: (id: string) => request<any>(`/oth-path${id}`),
  deleteClone: (id: string) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getFeeds: () => request<any[]>("/oth-path"),
  deleteFeed: (id: string) =>
    request(`/oth-path${id}`, { method: "DELETE" }),

  getMessages: (cloneId: string) => request<any[]>(`/oth-path${cloneId}`),

  getStats: () => request<any>("/oth-path"),
};
