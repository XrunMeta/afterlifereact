

import type { MyClone } from "../api/clones";
import type { Clone } from "../types/clone";

export function adaptMyClone(c: MyClone): Clone {
  return {
    id: c.id,
    cloneType: c.cloneType,
    ownerId: c.ownerId,
    displayName: c.name,
    username: c.username,
    description: c.description ?? "",
    interests: c.interests ?? [],
    imageUrl: c.avatarUrl ?? undefined,
    visibility: c.visibility,
    status: (c.trainingStatus as Clone["status"]) ?? "active",
    createdAt: c.createdAt,
    myRole: c.myRole,
    coownerCount: c.coownerCount,
    likesCount: c.likesCount,
    commentsCount: c.commentsCount,
    followersCount: c.followersCount,
    messagesCount: c.messagesCount,
    ...(c.l1Profile ? { l1Profile: c.l1Profile } : {}),
  };
}
