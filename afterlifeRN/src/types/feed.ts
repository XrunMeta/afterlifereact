import type { CloneType } from "./domain";

export interface FeedItem {
  id: number;
  cloneId: number;

  cloneOwnerId?: number;

  cloneVisibility?: string;

  cloneType?: CloneType;
  author: string;
  username: string;
  authorAvatar: string | number;
  image: string | number;
  title: string;
  description: string;
  type: string;
  mainCategory: string;
  interests: string[];
  likes: string;
  comments: number;
}
