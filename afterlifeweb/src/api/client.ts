const v_cc9198 = "/oth-path";

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

  getMessages: (v_6e0fd3) => v_576f5a<any[]>(`/oth-path${v_6e0fd3}`),

  getStats: () => v_576f5a<any>("/oth-path"),
};
