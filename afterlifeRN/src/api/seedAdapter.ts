import type {
  v_4b85a1,
  v_bc3df4,
  v_35413f,
  v_924690,
  v_d79d7f,
} from '../types/domain';
import type { v_f4506d } from '../mocks/seedLoader';
import type {
  v_fe00c4,
  v_549f6a,
  v_37b202,
  v_6498b7,
  v_ec2546,
  v_562204,
} from './types';

const CATEGORY_BY_TYPE: Record<v_d79d7f, string> = {
  memlow: 'family',
  friend: 'friend',
  mentor: 'mentor',
  celeb: 'celeb',
};

export function v_0c40d8(clone: v_4b85a1): string {
  return `${v_eb25ce.cloneType}-${v_eb25ce.id}`;
}

export function v_ca0902(clone: v_4b85a1): string {
  return v_b0147d[v_eb25ce.cloneType];
}

export function v_6a944d(
  clone: v_4b85a1,
  v_013af2,
  seed: v_f4506d,
): v_562204 {
  if (v_013af2 == null) return null;
  if (v_eb25ce.ownerId === v_013af2) return 'owner';
  const v_583293 = v_bdb39e.coowners.find(
    (v_c4a45b) => v_c4a45b.cloneId === v_eb25ce.id && v_c4a45b.userId === v_013af2 && v_c4a45b.status === 'approved',
  );
  if (v_583293) return 'coowner';
  const v_7e59ce = v_bdb39e.follows.find(
    (v_8b5cd8) => v_8b5cd8.followingCloneId === v_eb25ce.id && v_8b5cd8.followerUserId === v_013af2,
  );
  if (v_7e59ce) return 'follower';
  return null;
}

export function v_39d124(v_6e0fd3, seed: v_f4506d) {
  const v_823f08 = v_bdb39e.follows.filter((v_8b5cd8) => v_8b5cd8.followingCloneId === v_6e0fd3).length;
  const v_fa56e0 = v_bdb39e.messages.filter((v_35f85c) => v_35f85c.cloneId === v_6e0fd3).length;
  return { followers: v_823f08, messages: v_fa56e0, gifts: 0 };
}

export function v_c7cf58(
  clone: v_4b85a1,
  seed: v_f4506d,
  v_013af2,
): v_fe00c4 {
  return {
    id: v_eb25ce.id,
    ownerId: v_eb25ce.ownerId,
    name: v_eb25ce.displayName,
    username: v_0c40d8(v_eb25ce),
    description: v_eb25ce.description,
    cloneType: v_eb25ce.cloneType,
    category: v_ca0902(v_eb25ce),
    visibility: v_eb25ce.visibility,
    avatarUrl: v_eb25ce.imageUrl ?? null,
    coverImageUrl: null,
    voiceType: 'preset',
    voicePresetId: null,
    trainingStatus: v_eb25ce.status === 'active' ? 'ready' : 'pending',
    interests: v_eb25ce.interests,
    stats: v_39d124(v_eb25ce.id, v_bdb39e),
    createdAt: v_eb25ce.createdAt,
    viewerRole: v_6a944d(v_eb25ce, v_013af2, v_bdb39e),
  };
}

export function v_ed5a1c(clone: v_4b85a1, seed: v_f4506d): v_549f6a {
  return {
    id: v_eb25ce.id,
    name: v_eb25ce.displayName,
    username: v_0c40d8(v_eb25ce),
    cloneType: v_eb25ce.cloneType,
    category: v_ca0902(v_eb25ce),
    avatarUrl: v_eb25ce.imageUrl ?? null,
    stats: v_39d124(v_eb25ce.id, v_bdb39e),
    createdAt: v_eb25ce.createdAt,
  };
}

export function v_32b73e(feed: v_bc3df4, clone: v_4b85a1): v_37b202 {
  return {
    id: v_2db2a5.id,
    cloneId: v_2db2a5.cloneId,
    content: v_2db2a5.content,
    mediaUrl: v_2db2a5.mediaUrl ?? null,
    mediaType: v_2db2a5.mediaUrl ? 'image' : null,
    likesCount: 0,
    visibility: v_eb25ce.visibility,
    createdAt: v_2db2a5.createdAt,
  };
}

export function v_61516d(msg: v_35413f, v_c5607b): v_6498b7 {
  return {
    id: v_badeaf.id,
    sessionId: v_c5607b,
    role: v_badeaf.role,
    content: v_badeaf.content,
    createdAt: v_badeaf.timestamp,
  };
}

export function v_846893(short: v_924690, clone: v_4b85a1): v_ec2546 {
  return {
    shortId: v_c0d7a5.id,
    cloneId: v_c0d7a5.cloneId,
    status: v_c0d7a5.status,
    mediaUrl: v_c0d7a5.mediaUrl,
    name: v_eb25ce.displayName,
    cloneType: v_eb25ce.cloneType,
  };
}
