

import { API_BASE } from "../config/apiBase";

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

async function jsonOrThrow(
  res: Response,
  context: string,
): Promise<unknown> {
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const msg =
      (parsed && typeof parsed === "object" && "error" in parsed
        ? (parsed as { error?: { message?: string } }).error?.message
        : null) ?? `${context} failed (${res.status})`;
    throw new Error(msg);
  }
  return parsed;
}

export async function getUserProfile(
  accessToken: string,
  userId: number,
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/oth-path${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return jsonOrThrow(res, "getUserProfile") as Promise<UserProfile>;
}

export async function followUser(
  accessToken: string,
  userId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/oth-path${userId}/follow`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await jsonOrThrow(res, "followUser");
}

export async function unfollowUser(
  accessToken: string,
  userId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/oth-path${userId}/follow`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await jsonOrThrow(res, "unfollowUser");
}

export async function listUserFollowers(
  accessToken: string,
  userId: number,
  limit = 50,
): Promise<{ items: UserFollowItem[] }> {
  const res = await fetch(
    `${API_BASE}/oth-path${userId}/followers?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return jsonOrThrow(res, "listUserFollowers") as Promise<{
    items: UserFollowItem[];
  }>;
}

export async function listUserFollowing(
  accessToken: string,
  userId: number,
  limit = 50,
): Promise<{ items: UserFollowItem[] }> {
  const res = await fetch(
    `${API_BASE}/oth-path${userId}/following?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return jsonOrThrow(res, "listUserFollowing") as Promise<{
    items: UserFollowItem[];
  }>;
}
