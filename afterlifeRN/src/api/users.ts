

import { v_cc9198 } from "../config/apiBase";

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

async function v_1a2d12(
  v_8f00b9,
  v_e3aeb3,
): Promise<unknown> {
  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = null;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }
  if (!v_8f00b9.ok) {
    const v_badeaf =
      (v_8decf8 && typeof v_8decf8 === "object" && "error" in v_8decf8
        ? (v_8decf8 as { error?: { message?: string } }).error?.message
        : null) ?? `${v_e3aeb3} failed (${v_8f00b9.status})`;
    throw new Error(v_badeaf);
  }
  return v_8decf8;
}

export async function v_9fd740(
  v_2ca7e0,
  v_43e90c,
): Promise<UserProfile> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_43e90c}`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  return v_1a2d12(v_8f00b9, "getUserProfile") as Promise<UserProfile>;
}

export async function v_31c237(
  v_2ca7e0,
  v_43e90c,
): Promise<void> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_43e90c}/follow`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  await v_1a2d12(v_8f00b9, "followUser");
}

export async function v_deb9b0(
  v_2ca7e0,
  v_43e90c,
): Promise<void> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_43e90c}/follow`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  await v_1a2d12(v_8f00b9, "unfollowUser");
}

export async function v_00fbca(
  v_2ca7e0,
  v_43e90c,
  v_02be30 = 50,
): Promise<{ items: UserFollowItem[] }> {
  const v_8f00b9 = await fetch(
    `${v_cc9198}/oth-path${v_43e90c}/followers?limit=${v_02be30}`,
    { headers: { Authorization: `Bearer ${v_2ca7e0}` } },
  );
  return v_1a2d12(v_8f00b9, "listUserFollowers") as Promise<{
    items: UserFollowItem[];
  }>;
}

export async function v_5959d8(
  v_2ca7e0,
  v_43e90c,
  v_02be30 = 50,
): Promise<{ items: UserFollowItem[] }> {
  const v_8f00b9 = await fetch(
    `${v_cc9198}/oth-path${v_43e90c}/following?limit=${v_02be30}`,
    { headers: { Authorization: `Bearer ${v_2ca7e0}` } },
  );
  return v_1a2d12(v_8f00b9, "listUserFollowing") as Promise<{
    items: UserFollowItem[];
  }>;
}
