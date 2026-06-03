

import { v_04b58a } from "../lib/authFetch";

export interface UserProfileClone {
  id: number;
  name: string;
  username: string;
  description: string | null;
  cloneType: string;
  category: string | null;
  avatarUrl: string | null;
  visibility: string;
  followersCount: number;
  likesCount: number;
  createdAt: string;
}

export interface UserProfile {
  user: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
    followersCount: number;
    followingCount: number;
    isMe: boolean;
    isFollowing: boolean;

    isBlocked?: boolean;
  };
  clones: UserProfileClone[];
}

export interface UserFollowItem {
  followId: number;
  userId: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export async function v_9fd740(
  v_2ca7e0,
  v_43e90c,
): Promise<UserProfile> {
  return v_04b58a<UserProfile>(`/oth-path${v_43e90c}`, v_2ca7e0);
}

export async function v_31c237(
  v_2ca7e0,
  v_43e90c,
): Promise<void> {
  await v_04b58a<unknown>(`/oth-path${v_43e90c}/follow`, v_2ca7e0, { method: "POST" });
}

export async function v_deb9b0(
  v_2ca7e0,
  v_43e90c,
): Promise<void> {
  await v_04b58a<unknown>(`/oth-path${v_43e90c}/follow`, v_2ca7e0, { method: "DELETE" });
}

export async function v_00fbca(
  v_2ca7e0,
  v_43e90c,
  v_02be30 = 50,
): Promise<{ items: UserFollowItem[] }> {
  return v_04b58a<{ items: UserFollowItem[] }>(
    `/oth-path${v_43e90c}/followers?limit=${v_02be30}`,
    v_2ca7e0,
  );
}

export async function v_5959d8(
  v_2ca7e0,
  v_43e90c,
  v_02be30 = 50,
): Promise<{ items: UserFollowItem[] }> {
  return v_04b58a<{ items: UserFollowItem[] }>(
    `/oth-path${v_43e90c}/following?limit=${v_02be30}`,
    v_2ca7e0,
  );
}

export async function v_b9d616(
  v_2ca7e0,
  v_43e90c,
): Promise<{ ok: true; blocked: true }> {
  return v_04b58a<{ ok: true; blocked: true }>(
    `/oth-path${v_43e90c}/block`,
    v_2ca7e0,
    { method: "POST" },
  );
}

export async function v_83b07d(
  v_2ca7e0,
  v_43e90c,
): Promise<{ ok: true; blocked: false }> {
  return v_04b58a<{ ok: true; blocked: false }>(
    `/oth-path${v_43e90c}/block`,
    v_2ca7e0,
    { method: "DELETE" },
  );
}

export async function v_095ba5(
  v_2ca7e0,
  v_43e90c,
  v_58ca36,
): Promise<{ ok: true; reported: true; blocked: true }> {
  return v_04b58a<{ ok: true; reported: true; blocked: true }>(
    `/oth-path${v_43e90c}/report`,
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_58ca36 ? { reason: v_58ca36 } : {}) },
  );
}
