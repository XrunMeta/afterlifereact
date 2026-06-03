export type CloneType = 'memlow' | 'friend' | 'mentor' | 'celeb';
export type ShortStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface L1Profile {
  attrs: Record<string, string>;
  notes: string;
}

export interface DomainShort {
  id: number;
  cloneId: number;
  status: ShortStatus;
  mediaUrl: string | null;
  createdAt: string;
}
export type CloneStatus = 'active' | 'pending_assets';

export type Visibility = 'public' | 'followers' | 'selected' | 'private';
export type CoownerStatus = 'invited' | 'approved' | 'rejected';
export type MessageRole = 'user' | 'clone';

export interface DomainUser {
  id: number;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface DomainClone {
  id: number;
  cloneType: CloneType;
  ownerId: number;
  displayName: string;

  username?: string;
  description: string;
  interests: string[];
  imageUrl?: string;
  voiceSampleUrl?: string;
  visibility: Visibility;
  status: CloneStatus;
  createdAt: string;
  primaryEditorUserId?: number;
  l1Profile?: L1Profile;

  myRole?: "owner" | "coowner";
  coownerCount?: number;
  likesCount?: number;
  commentsCount?: number;
  followersCount?: number;
  messagesCount?: number;
}

export interface DomainFollow {
  id: number;
  followerUserId: number;
  followingCloneId: number;
  followedAt: string;
}

export interface DomainCoowner {
  id: number;
  cloneId: number;
  userId: number;
  status: CoownerStatus;
  invitedAt: string;
  approvedAt?: string;
}

export interface DomainMessage {
  id: number;
  cloneId: number;
  userId: number;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface DomainFeed {
  id: number;
  cloneId: number;
  content: string;
  mediaUrl?: string;

  mediaType?: string | null;
  likesCount?: number;
  createdAt: string;
}
