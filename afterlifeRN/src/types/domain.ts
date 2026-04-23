export type CloneType = 'memlow' | 'friend' | 'mentor' | 'celeb';
export type CloneStatus = 'active' | 'pending_assets';
export type Visibility = 'public' | 'followers' | 'private';
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
  description: string;
  interests: string[];
  imageUrl?: string;
  voiceSampleUrl?: string;
  visibility: Visibility;
  status: CloneStatus;
  createdAt: string;
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
  createdAt: string;
}
