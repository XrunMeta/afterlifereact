import type {
  DomainClone,
  DomainFeed,
  DomainMessage,
  CloneType,
} from '../types/domain';
import type { Seed } from '../mocks/seedLoader';
import type {
  ApiClone,
  ApiCloneListItem,
  ApiFeed,
  ApiMessage,
  ViewerRole,
} from './types';

const CATEGORY_BY_TYPE: Record<CloneType, string> = {
  memlow: 'family',
  friend: 'friend',
  mentor: 'mentor',
  celeb: 'celeb',
};

export function deriveUsername(clone: DomainClone): string {
  return `${clone.cloneType}-${clone.id}`;
}

export function deriveCategory(clone: DomainClone): string {
  return CATEGORY_BY_TYPE[clone.cloneType];
}

export function computeViewerRole(
  clone: DomainClone,
  viewerId: number | null,
  seed: Seed,
): ViewerRole {
  if (viewerId == null) return null;
  if (clone.ownerId === viewerId) return 'owner';
  const coowner = seed.coowners.find(
    (co) => co.cloneId === clone.id && co.userId === viewerId && co.status === 'approved',
  );
  if (coowner) return 'coowner';
  const follow = seed.follows.find(
    (f) => f.followingCloneId === clone.id && f.followerUserId === viewerId,
  );
  if (follow) return 'follower';
  return null;
}

export function computeCloneStats(cloneId: number, seed: Seed) {
  const followers = seed.follows.filter((f) => f.followingCloneId === cloneId).length;
  const messages = seed.messages.filter((m) => m.cloneId === cloneId).length;
  return { followers, messages, gifts: 0 };
}

export function toApiClone(
  clone: DomainClone,
  seed: Seed,
  viewerId: number | null,
): ApiClone {
  return {
    id: clone.id,
    ownerId: clone.ownerId,
    name: clone.displayName,
    username: deriveUsername(clone),
    description: clone.description,
    cloneType: clone.cloneType,
    category: deriveCategory(clone),
    visibility: clone.visibility,
    avatarUrl: clone.imageUrl ?? null,
    coverImageUrl: null,
    voiceType: 'preset',
    voicePresetId: null,
    trainingStatus: clone.status === 'active' ? 'ready' : 'pending',
    interests: clone.interests,
    stats: computeCloneStats(clone.id, seed),
    createdAt: clone.createdAt,
    viewerRole: computeViewerRole(clone, viewerId, seed),
  };
}

export function toApiCloneListItem(clone: DomainClone, seed: Seed): ApiCloneListItem {
  return {
    id: clone.id,
    name: clone.displayName,
    username: deriveUsername(clone),
    cloneType: clone.cloneType,
    category: deriveCategory(clone),
    avatarUrl: clone.imageUrl ?? null,
    stats: computeCloneStats(clone.id, seed),
    createdAt: clone.createdAt,
  };
}

export function toApiFeed(feed: DomainFeed, clone: DomainClone): ApiFeed {
  return {
    id: feed.id,
    cloneId: feed.cloneId,
    content: feed.content,
    mediaUrl: feed.mediaUrl ?? null,
    mediaType: feed.mediaUrl ? 'image' : null,
    likesCount: 0,
    visibility: clone.visibility,
    createdAt: feed.createdAt,
  };
}

export function toApiMessage(msg: DomainMessage, sessionId: string): ApiMessage {
  return {
    id: msg.id,
    sessionId,
    role: msg.role,
    content: msg.content,
    createdAt: msg.timestamp,
  };
}
