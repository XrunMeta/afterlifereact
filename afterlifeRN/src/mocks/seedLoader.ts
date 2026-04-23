import type {
  DomainUser,
  DomainClone,
  DomainFollow,
  DomainCoowner,
  DomainMessage,
  DomainFeed,
  DomainShort,
  CloneType,
  Visibility,
  CloneStatus,
  CoownerStatus,
  MessageRole,
} from '../types/domain';

const CLONE_TYPES: readonly CloneType[] = ['memlow', 'friend', 'mentor', 'celeb'];
const SHORT_STATUSES = ['queued', 'processing', 'ready', 'failed'] as const;
const VISIBILITIES: readonly Visibility[] = ['public', 'followers', 'private'];
const STATUSES: readonly CloneStatus[] = ['active', 'pending_assets'];
const COOWNER_STATUSES: readonly CoownerStatus[] = ['invited', 'approved', 'rejected'];
const MESSAGE_ROLES: readonly MessageRole[] = ['user', 'clone'];

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const requireString = (path: string, value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be non-empty string`);
  }
  return value;
};

const requireNumber = (path: string, value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${path} must be non-negative number`);
  }
  return value;
};

const requireIso = (path: string, value: unknown): string => {
  const s = requireString(path, value);
  if (!ISO_RE.test(s)) throw new Error(`${path} must be ISO timestamp`);
  return s;
};

const requireEnum = <T extends string>(path: string, value: unknown, allowed: readonly T[]): T => {
  const s = requireString(path, value);
  if (!(allowed as readonly string[]).includes(s)) {
    throw new Error(`${path} invalid, got ${s}`);
  }
  return s as T;
};

export function assertUsers(rows: unknown[]): asserts rows is DomainUser[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`user[${i}].id`, r.id);
    requireString(`user[${i}].displayName`, r.displayName);
    requireString(`user[${i}].handle`, r.handle);
    if (r.avatarUrl !== undefined) requireString(`user[${i}].avatarUrl`, r.avatarUrl);
    if (r.bio !== undefined) requireString(`user[${i}].bio`, r.bio);
    requireIso(`user[${i}].createdAt`, r.createdAt);
  });
}

export function assertClones(rows: unknown[]): asserts rows is DomainClone[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`clone[${i}].id`, r.id);
    requireEnum(`clone[${i}].cloneType`, r.cloneType, CLONE_TYPES);
    requireNumber(`clone[${i}].ownerId`, r.ownerId);
    requireString(`clone[${i}].displayName`, r.displayName);
    requireString(`clone[${i}].description`, r.description);
    if (!Array.isArray(r.interests)) throw new Error(`clone[${i}].interests must be array`);
    (r.interests as unknown[]).forEach((v, j) => requireString(`clone[${i}].interests[${j}]`, v));
    if (r.imageUrl !== undefined) requireString(`clone[${i}].imageUrl`, r.imageUrl);
    if (r.voiceSampleUrl !== undefined) requireString(`clone[${i}].voiceSampleUrl`, r.voiceSampleUrl);
    requireEnum(`clone[${i}].visibility`, r.visibility, VISIBILITIES);
    requireEnum(`clone[${i}].status`, r.status, STATUSES);
    requireIso(`clone[${i}].createdAt`, r.createdAt);
    if (r.primaryEditorUserId !== undefined) {
      requireNumber(`clone[${i}].primaryEditorUserId`, r.primaryEditorUserId);
    }
    if (r.l1Profile !== undefined) {
      const l1 = r.l1Profile as Record<string, unknown>;
      if (typeof l1?.attrs !== 'object' || l1.attrs === null || Array.isArray(l1.attrs)) {
        throw new Error(`clone[${i}].l1Profile.attrs must be object`);
      }
      Object.entries(l1.attrs as Record<string, unknown>).forEach(([k, v]) => {
        requireString(`clone[${i}].l1Profile.attrs.${k}`, v);
      });
      if (typeof l1.notes !== 'string') {
        throw new Error(`clone[${i}].l1Profile.notes must be string`);
      }
    }
  });
}

export function assertFollows(rows: unknown[]): asserts rows is DomainFollow[] {
  const seen = new Set<string>();
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`follow[${i}].id`, r.id);
    const fu = requireNumber(`follow[${i}].followerUserId`, r.followerUserId);
    const fc = requireNumber(`follow[${i}].followingCloneId`, r.followingCloneId);
    requireIso(`follow[${i}].followedAt`, r.followedAt);
    const key = `${fu}::${fc}`;
    if (seen.has(key)) throw new Error(`follow[${i}] duplicate (${key})`);
    seen.add(key);
  });
}

export function assertCoowners(rows: unknown[]): asserts rows is DomainCoowner[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`coowner[${i}].id`, r.id);
    requireNumber(`coowner[${i}].cloneId`, r.cloneId);
    requireNumber(`coowner[${i}].userId`, r.userId);
    requireEnum(`coowner[${i}].status`, r.status, COOWNER_STATUSES);
    requireIso(`coowner[${i}].invitedAt`, r.invitedAt);
    if (r.approvedAt !== undefined) requireIso(`coowner[${i}].approvedAt`, r.approvedAt);
  });
}

export function assertMessages(rows: unknown[]): asserts rows is DomainMessage[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`message[${i}].id`, r.id);
    requireNumber(`message[${i}].cloneId`, r.cloneId);
    requireNumber(`message[${i}].userId`, r.userId);
    requireEnum(`message[${i}].role`, r.role, MESSAGE_ROLES);
    requireString(`message[${i}].content`, r.content);
    requireIso(`message[${i}].timestamp`, r.timestamp);
  });
}

export function assertFeeds(rows: unknown[]): asserts rows is DomainFeed[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`feed[${i}].id`, r.id);
    requireNumber(`feed[${i}].cloneId`, r.cloneId);
    requireString(`feed[${i}].content`, r.content);
    if (r.mediaUrl !== undefined) requireString(`feed[${i}].mediaUrl`, r.mediaUrl);
    requireIso(`feed[${i}].createdAt`, r.createdAt);
  });
}

export function assertShorts(rows: unknown[]): asserts rows is DomainShort[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireNumber(`short[${i}].id`, r.id);
    requireNumber(`short[${i}].cloneId`, r.cloneId);
    requireEnum(`short[${i}].status`, r.status, SHORT_STATUSES);
    if (r.mediaUrl !== null && r.mediaUrl !== undefined) {
      requireString(`short[${i}].mediaUrl`, r.mediaUrl);
    }
    requireIso(`short[${i}].createdAt`, r.createdAt);
  });
}

export interface Seed {
  users: DomainUser[];
  clones: DomainClone[];
  follows: DomainFollow[];
  coowners: DomainCoowner[];
  messages: DomainMessage[];
  feeds: DomainFeed[];
  shorts: DomainShort[];
}

export function loadSeed(raw: {
  users: unknown[];
  clones: unknown[];
  follows: unknown[];
  coowners: unknown[];
  messages: unknown[];
  feeds: unknown[];
  shorts: unknown[];
}): Seed {
  assertUsers(raw.users);
  assertClones(raw.clones);
  assertFollows(raw.follows);
  assertCoowners(raw.coowners);
  assertMessages(raw.messages);
  assertFeeds(raw.feeds);
  assertShorts(raw.shorts);
  return raw as Seed;
}
