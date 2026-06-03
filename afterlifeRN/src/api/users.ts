

import { authFetch } from "../lib/authFetch";

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

export async function getUserProfile(
  accessToken: string,
  userId: number,
): Promise<UserProfile> {
  return authFetch<UserProfile>(`/oth-path${userId}`, accessToken);
}

export async function followUser(
  accessToken: string,
  userId: number,
): Promise<void> {
  await authFetch<unknown>(`/oth-path${userId}/follow`, accessToken, { method: "POST" });
}

export async function unfollowUser(
  accessToken: string,
  userId: number,
): Promise<void> {
  await authFetch<unknown>(`/oth-path${userId}/follow`, accessToken, { method: "DELETE" });
}

export async function listUserFollowers(
  accessToken: string,
  userId: number,
  limit = 50,
): Promise<{ items: UserFollowItem[] }> {
  return authFetch<{ items: UserFollowItem[] }>(
    `/oth-path${userId}/followers?limit=${limit}`,
    accessToken,
  );
}

export async function listUserFollowing(
  accessToken: string,
  userId: number,
  limit = 50,
): Promise<{ items: UserFollowItem[] }> {
  return authFetch<{ items: UserFollowItem[] }>(
    `/oth-path${userId}/following?limit=${limit}`,
    accessToken,
  );
}

export async function blockUser(
  accessToken: string,
  userId: number,
): Promise<{ ok: true; blocked: true }> {
  return authFetch<{ ok: true; blocked: true }>(
    `/oth-path${userId}/block`,
    accessToken,
    { method: "POST" },
  );
}

export async function unblockUser(
  accessToken: string,
  userId: number,
): Promise<{ ok: true; blocked: false }> {
  return authFetch<{ ok: true; blocked: false }>(
    `/oth-path${userId}/block`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function reportUser(
  accessToken: string,
  userId: number,
  reason?: string,
): Promise<{ ok: true; reported: true; blocked: true }> {
  return authFetch<{ ok: true; reported: true; blocked: true }>(
    `/oth-path${userId}/report`,
    accessToken,
    { method: "POST", body: JSON.stringify(reason ? { reason } : {}) },
  );
}
