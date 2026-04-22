import type { DomainFeed, CloneType } from "../types/domain";
import type { FeedItem } from "../types/feed";
import { SEED } from "./seedIndex";

const CLONE_TYPE_LABEL: Record<CloneType, string> = {
  memlow: "멤로우",
  friend: "친구",
  mentor: "멘토",
  celeb: "셀럽",
};

function hashToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function toFeedItem(f: DomainFeed): FeedItem {
  const c = SEED.clones.find((x) => x.id === f.cloneId);
  const h = hashToInt(f.id);
  const likes = 500 + (h % 9500);
  const comments = 20 + (h % 480);
  return {
    id: f.id,
    cloneId: f.cloneId,
    author: c?.displayName ?? "알 수 없음",
    username: c ? `@${c.id.replace("clone-", "")}` : "@unknown",
    authorAvatar: c?.imageUrl ?? "",
    image: f.imageUrl ?? c?.imageUrl ?? "",
    title: c?.displayName ?? "",
    description: f.text,
    type: c ? CLONE_TYPE_LABEL[c.cloneType] : "친구",
    mainCategory: "",
    interests: c?.interests ?? [],
    likes: formatLikes(likes),
    comments,
  };
}
