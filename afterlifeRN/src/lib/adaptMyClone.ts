

import type { v_fa0201 } from "../api/clones";
import type { v_affcc0 } from "../types/clone";

export function v_a8d790(c: v_fa0201): v_affcc0 {
  return {
    id: v_3f4e2e.id,
    cloneType: v_3f4e2e.cloneType,
    ownerId: v_3f4e2e.ownerId,
    displayName: v_3f4e2e.name,
    username: v_3f4e2e.username,
    description: v_3f4e2e.description ?? "",
    interests: v_3f4e2e.interests ?? [],
    imageUrl: v_3f4e2e.avatarUrl ?? undefined,
    visibility: v_3f4e2e.visibility,
    status: (v_3f4e2e.trainingStatus as v_affcc0["status"]) ?? "active",
    createdAt: v_3f4e2e.createdAt,
    myRole: v_3f4e2e.myRole,
    coownerCount: v_3f4e2e.coownerCount,
    likesCount: v_3f4e2e.likesCount,
    commentsCount: v_3f4e2e.commentsCount,
    followersCount: v_3f4e2e.followersCount,
    messagesCount: v_3f4e2e.messagesCount,
    ...(v_3f4e2e.l1Profile ? { l1Profile: v_3f4e2e.l1Profile } : {}),
  };
}
