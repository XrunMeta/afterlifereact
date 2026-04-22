export interface FeedItem {
  id: number;
  cloneId: number;
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
