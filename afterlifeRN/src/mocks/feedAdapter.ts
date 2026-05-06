import type { DomainFeed, CloneType } from "../types/domain";
import type { FeedItem } from "../types/feed";
import { seedSource } from "../api/source";
import { IMAGES } from "./images";
import { apiCloneCache } from "../stores/feedStore";

const CLONE_TYPE_LABEL: Record<CloneType, string> = {
  memlow: "멤로우",
  friend: "친구",
  mentor: "멘토",
  celeb: "셀럽",
};

const LOCAL_IMAGE_BY_CLONE_ID: Record<number, number> = {
  1: IMAGES.grandfatherPost, 
  2: IMAGES.grandmotherPost, 
};

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function toFeedItem(f: DomainFeed): FeedItem {

  const c =
    apiCloneCache.get(f.cloneId) ??
    seedSource.clones().find((x) => x.id === f.cloneId);
  const h = Math.abs(f.id);

  const likes =
    typeof f.likesCount === "number" ? f.likesCount : 500 + (h % 9500);
  const comments = 20 + (h % 480);
  const localImage = LOCAL_IMAGE_BY_CLONE_ID[f.cloneId];
  return {
    id: f.id,
    cloneId: f.cloneId,
    author: c?.displayName ?? "알 수 없음",
    username: c ? `@${c.cloneType}-${c.id}` : "@unknown",
    authorAvatar: localImage ?? c?.imageUrl ?? "",
    image: f.mediaUrl ?? localImage ?? c?.imageUrl ?? "",
    title: c?.displayName ?? "",
    description: f.content,
    type: c ? CLONE_TYPE_LABEL[c.cloneType] : "친구",
    mainCategory: "",
    interests: c?.interests ?? [],
    likes: formatLikes(likes),
    comments,
  };
}
