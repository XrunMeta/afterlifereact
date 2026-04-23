import type { CloneType, Visibility, MessageRole } from '../types/domain';

export type ViewerRole = 'owner' | 'coowner' | 'follower' | null;

export interface ApiCloneStats {
  followers: number;
  messages: number;
  gifts: number;
}

export interface ApiClone {
  id: number;
  ownerId: number;
  name: string;
  username: string;
  description: string;
  cloneType: CloneType;
  category: string;
  visibility: Visibility;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  voiceType: 'preset' | 'custom';
  voicePresetId: number | null;
  trainingStatus: 'pending' | 'processing' | 'ready';
  interests: string[];
  stats: ApiCloneStats;
  createdAt: string;
  viewerRole: ViewerRole;
}

export interface ApiCloneListItem {
  id: number;
  name: string;
  username: string;
  cloneType: CloneType;
  category: string;
  avatarUrl: string | null;
  stats: ApiCloneStats;
  createdAt: string;
}

export interface ApiFeed {
  id: number;
  cloneId: number;
  content: string;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | 'short' | null;
  likesCount: number;
  visibility: Visibility;
  createdAt: string;
}

export interface ApiFeedList {
  items: ApiFeed[];
  nextCursor: number | null;
}

export interface ApiMessage {
  id: number;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ApiMessageList {
  items: ApiMessage[];
  nextCursor: number | null;
}

export interface ApiFollowedCloneList {
  items: ApiCloneListItem[];
}

export interface ApiSession {
  sessionId: string;
  livekitRoom: string;
  livekitToken: string;
  cloudflareCallsAppId: string;
  loraUri: string;
  ttsVoiceUri: string;
  expiresAt: string;
  viewerRole: ViewerRole;
}
