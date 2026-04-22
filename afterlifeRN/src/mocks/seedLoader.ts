import type {
  DomainUser,
  DomainClone,
  DomainFollow,
  DomainCoowner,
  DomainMessage,
  DomainFeed,
  CloneType,
  Visibility,
  CloneStatus,
  CoownerStatus,
  SenderType,
} from '../types/domain';

const CLONE_TYPES: readonly CloneType[] = ['memlow', 'friend', 'mentor', 'celeb'];
const VISIBILITIES: readonly Visibility[] = ['public', 'followers', 'private'];
const STATUSES: readonly CloneStatus[] = ['active', 'pending_assets'];
const COOWNER_STATUSES: readonly CoownerStatus[] = ['invited', 'approved', 'rejected'];
const SENDER_TYPES: readonly SenderType[] = ['user', 'clone'];

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const requireString = (path: string, value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be non-empty string`);
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
    requireString(`user[${i}].id`, r.id);
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
    requireString(`clone[${i}].id`, r.id);
    requireEnum(`clone[${i}].cloneType`, r.cloneType, CLONE_TYPES);
    requireString(`clone[${i}].ownerUserId`, r.ownerUserId);
    requireString(`clone[${i}].displayName`, r.displayName);
    requireString(`clone[${i}].description`, r.description);
    if (!Array.isArray(r.interests)) throw new Error(`clone[${i}].interests must be array`);
    (r.interests as unknown[]).forEach((v, j) => requireString(`clone[${i}].interests[${j}]`, v));
    if (r.imageUrl !== undefined) requireString(`clone[${i}].imageUrl`, r.imageUrl);
    if (r.voiceSampleUrl !== undefined) requireString(`clone[${i}].voiceSampleUrl`, r.voiceSampleUrl);
    requireEnum(`clone[${i}].visibility`, r.visibility, VISIBILITIES);
    requireEnum(`clone[${i}].status`, r.status, STATUSES);
    requireIso(`clone[${i}].createdAt`, r.createdAt);
  });
}

export function assertFollows(rows: unknown[]): asserts rows is DomainFollow[] {
  const seen = new Set<string>();
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireString(`follow[${i}].id`, r.id);
    const fu = requireString(`follow[${i}].followerUserId`, r.followerUserId);
    const fc = requireString(`follow[${i}].followingCloneId`, r.followingCloneId);
    requireIso(`follow[${i}].followedAt`, r.followedAt);
    const key = `${fu}::${fc}`;
    if (seen.has(key)) throw new Error(`follow[${i}] duplicate (${key})`);
    seen.add(key);
  });
}

export function assertCoowners(rows: unknown[]): asserts rows is DomainCoowner[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireString(`coowner[${i}].id`, r.id);
    requireString(`coowner[${i}].cloneId`, r.cloneId);
    requireString(`coowner[${i}].userId`, r.userId);
    requireEnum(`coowner[${i}].status`, r.status, COOWNER_STATUSES);
    requireIso(`coowner[${i}].invitedAt`, r.invitedAt);
    if (r.approvedAt !== undefined) requireIso(`coowner[${i}].approvedAt`, r.approvedAt);
  });
}

export function assertMessages(rows: unknown[]): asserts rows is DomainMessage[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireString(`message[${i}].id`, r.id);
    requireString(`message[${i}].cloneId`, r.cloneId);
    requireString(`message[${i}].userId`, r.userId);
    requireEnum(`message[${i}].senderType`, r.senderType, SENDER_TYPES);
    requireString(`message[${i}].text`, r.text);
    requireIso(`message[${i}].timestamp`, r.timestamp);
  });
}

export function assertFeeds(rows: unknown[]): asserts rows is DomainFeed[] {
  rows.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    requireString(`feed[${i}].id`, r.id);
    requireString(`feed[${i}].cloneId`, r.cloneId);
    requireString(`feed[${i}].text`, r.text);
    if (r.imageUrl !== undefined) requireString(`feed[${i}].imageUrl`, r.imageUrl);
    requireIso(`feed[${i}].createdAt`, r.createdAt);
  });
}

export interface Seed {
  users: DomainUser[];
  clones: DomainClone[];
  follows: DomainFollow[];
  coowners: DomainCoowner[];
  messages: DomainMessage[];
  feeds: DomainFeed[];
}

export function loadSeed(raw: {
  users: unknown[];
  clones: unknown[];
  follows: unknown[];
  coowners: unknown[];
  messages: unknown[];
  feeds: unknown[];
}): Seed {
  assertUsers(raw.users);
  assertClones(raw.clones);
  assertFollows(raw.follows);
  assertCoowners(raw.coowners);
  assertMessages(raw.messages);
  assertFeeds(raw.feeds);
  return raw as Seed;
}
