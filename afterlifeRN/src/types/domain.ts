export type CloneType = 'memlow' | 'friend' | 'mentor' | 'celeb';
export type CloneStatus = 'active' | 'pending_assets';
export type Visibility = 'public' | 'followers' | 'private';
export type CoownerStatus = 'invited' | 'approved' | 'rejected';
export type SenderType = 'user' | 'clone';

export interface DomainUser {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface DomainClone {
  id: string;
  cloneType: CloneType;
  ownerUserId: string;
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
  id: string;
  followerUserId: string;
  followingCloneId: string;
  followedAt: string;
}

export interface DomainCoowner {
  id: string;
  cloneId: string;
  userId: string;
  status: CoownerStatus;
  invitedAt: string;
  approvedAt?: string;
}

export interface DomainMessage {
  id: string;
  cloneId: string;
  userId: string;
  senderType: SenderType;
  text: string;
  timestamp: string;
}

export interface DomainFeed {
  id: string;
  cloneId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}
