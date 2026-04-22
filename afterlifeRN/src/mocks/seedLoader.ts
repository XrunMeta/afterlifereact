import type {
  v_b89f99,
  v_4b85a1,
  v_7a4d15,
  v_49c051,
  v_35413f,
  v_bc3df4,
  v_d79d7f,
  v_b0b271,
  v_7b4861,
  v_42b73c,
  v_e4762c,
} from '../types/domain';

const CLONE_TYPES: readonly v_d79d7f[] = ['memlow', 'friend', 'mentor', 'celeb'];
const VISIBILITIES: readonly v_b0b271[] = ['public', 'followers', 'private'];
const STATUSES: readonly v_7b4861[] = ['active', 'pending_assets'];
const COOWNER_STATUSES: readonly v_42b73c[] = ['invited', 'approved', 'rejected'];
const SENDER_TYPES: readonly v_e4762c[] = ['user', 'clone'];

const v_98f249 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const v_71daa1 = (v_9fe22d, v_3b402b): string => {
  if (typeof v_3b402b !== 'string' || v_3b402b.length === 0) {
    throw new Error(`${v_9fe22d} must be non-empty string`);
  }
  return v_3b402b;
};

const v_6d0907 = (v_9fe22d, v_3b402b): string => {
  const v_fd5f43 = v_71daa1(v_9fe22d, v_3b402b);
  if (!v_98f249.test(v_fd5f43)) throw new Error(`${v_9fe22d} must be ISO timestamp`);
  return v_fd5f43;
};

const v_a0e5b2 = <T extends string>(v_9fe22d, v_3b402b, v_999957): T => {
  const v_fd5f43 = v_71daa1(v_9fe22d, v_3b402b);
  if (!(v_999957 as readonly string[]).includes(v_fd5f43)) {
    throw new Error(`${v_9fe22d} invalid, got ${v_fd5f43}`);
  }
  return v_fd5f43 as T;
};

export function v_2aa078(v_18b8bf): asserts v_18b8bf is v_b89f99[] {
  v_18b8bf.forEach((v_479f05, v_ebec57) => {
    const v_cb35cb = v_479f05 as Record<string, unknown>;
    v_71daa1(`user[${v_ebec57}].id`, v_cb35cb.id);
    v_71daa1(`user[${v_ebec57}].displayName`, v_cb35cb.displayName);
    v_71daa1(`user[${v_ebec57}].handle`, v_cb35cb.handle);
    if (v_cb35cb.avatarUrl !== undefined) v_71daa1(`user[${v_ebec57}].avatarUrl`, v_cb35cb.avatarUrl);
    if (v_cb35cb.bio !== undefined) v_71daa1(`user[${v_ebec57}].bio`, v_cb35cb.bio);
    v_6d0907(`user[${v_ebec57}].createdAt`, v_cb35cb.createdAt);
  });
}

export function v_8e78d0(v_18b8bf): asserts v_18b8bf is v_4b85a1[] {
  v_18b8bf.forEach((v_479f05, v_ebec57) => {
    const v_cb35cb = v_479f05 as Record<string, unknown>;
    v_71daa1(`clone[${v_ebec57}].id`, v_cb35cb.id);
    v_a0e5b2(`clone[${v_ebec57}].cloneType`, v_cb35cb.cloneType, v_aad223);
    v_71daa1(`clone[${v_ebec57}].ownerUserId`, v_cb35cb.ownerUserId);
    v_71daa1(`clone[${v_ebec57}].displayName`, v_cb35cb.displayName);
    v_71daa1(`clone[${v_ebec57}].description`, v_cb35cb.description);
    if (!Array.isArray(v_cb35cb.interests)) throw new Error(`clone[${v_ebec57}].interests must be array`);
    (v_cb35cb.interests as unknown[]).forEach((v_81e2ef, v_b75e36) => v_71daa1(`clone[${v_ebec57}].interests[${v_b75e36}]`, v_81e2ef));
    if (v_cb35cb.imageUrl !== undefined) v_71daa1(`clone[${v_ebec57}].imageUrl`, v_cb35cb.imageUrl);
    if (v_cb35cb.voiceSampleUrl !== undefined) v_71daa1(`clone[${v_ebec57}].voiceSampleUrl`, v_cb35cb.voiceSampleUrl);
    v_a0e5b2(`clone[${v_ebec57}].visibility`, v_cb35cb.visibility, v_f46940);
    v_a0e5b2(`clone[${v_ebec57}].status`, v_cb35cb.status, v_58bf8d);
    v_6d0907(`clone[${v_ebec57}].createdAt`, v_cb35cb.createdAt);
  });
}

export function v_5f4862(v_18b8bf): asserts v_18b8bf is v_7a4d15[] {
  const v_110a8b = new Set<string>();
  v_18b8bf.forEach((v_479f05, v_ebec57) => {
    const v_cb35cb = v_479f05 as Record<string, unknown>;
    v_71daa1(`follow[${v_ebec57}].id`, v_cb35cb.id);
    const v_7f1284 = v_71daa1(`follow[${v_ebec57}].followerUserId`, v_cb35cb.followerUserId);
    const v_3b170c = v_71daa1(`follow[${v_ebec57}].followingCloneId`, v_cb35cb.followingCloneId);
    v_6d0907(`follow[${v_ebec57}].followedAt`, v_cb35cb.followedAt);
    const v_b24339 = `${v_7f1284}::${v_3b170c}`;
    if (v_110a8b.has(v_b24339)) throw new Error(`follow[${v_ebec57}] duplicate (${v_b24339})`);
    v_110a8b.add(v_b24339);
  });
}

export function v_240f60(v_18b8bf): asserts v_18b8bf is v_49c051[] {
  v_18b8bf.forEach((v_479f05, v_ebec57) => {
    const v_cb35cb = v_479f05 as Record<string, unknown>;
    v_71daa1(`coowner[${v_ebec57}].id`, v_cb35cb.id);
    v_71daa1(`coowner[${v_ebec57}].cloneId`, v_cb35cb.cloneId);
    v_71daa1(`coowner[${v_ebec57}].userId`, v_cb35cb.userId);
    v_a0e5b2(`coowner[${v_ebec57}].status`, v_cb35cb.status, v_69489f);
    v_6d0907(`coowner[${v_ebec57}].invitedAt`, v_cb35cb.invitedAt);
    if (v_cb35cb.approvedAt !== undefined) v_6d0907(`coowner[${v_ebec57}].approvedAt`, v_cb35cb.approvedAt);
  });
}

export function v_50b973(v_18b8bf): asserts v_18b8bf is v_35413f[] {
  v_18b8bf.forEach((v_479f05, v_ebec57) => {
    const v_cb35cb = v_479f05 as Record<string, unknown>;
    v_71daa1(`message[${v_ebec57}].id`, v_cb35cb.id);
    v_71daa1(`message[${v_ebec57}].cloneId`, v_cb35cb.cloneId);
    v_71daa1(`message[${v_ebec57}].userId`, v_cb35cb.userId);
    v_a0e5b2(`message[${v_ebec57}].senderType`, v_cb35cb.senderType, v_658793);
    v_71daa1(`message[${v_ebec57}].text`, v_cb35cb.text);
    v_6d0907(`message[${v_ebec57}].timestamp`, v_cb35cb.timestamp);
  });
}

export function v_a07f65(v_18b8bf): asserts v_18b8bf is v_bc3df4[] {
  v_18b8bf.forEach((v_479f05, v_ebec57) => {
    const v_cb35cb = v_479f05 as Record<string, unknown>;
    v_71daa1(`feed[${v_ebec57}].id`, v_cb35cb.id);
    v_71daa1(`feed[${v_ebec57}].cloneId`, v_cb35cb.cloneId);
    v_71daa1(`feed[${v_ebec57}].text`, v_cb35cb.text);
    if (v_cb35cb.imageUrl !== undefined) v_71daa1(`feed[${v_ebec57}].imageUrl`, v_cb35cb.imageUrl);
    v_6d0907(`feed[${v_ebec57}].createdAt`, v_cb35cb.createdAt);
  });
}

export interface Seed {
  users: v_b89f99[];
  clones: v_4b85a1[];
  follows: v_7a4d15[];
  coowners: v_49c051[];
  messages: v_35413f[];
  feeds: v_bc3df4[];
}

export function v_a151c0(v_479f05): Seed {
  v_2aa078(v_479f05.users);
  v_8e78d0(v_479f05.clones);
  v_5f4862(v_479f05.follows);
  v_240f60(v_479f05.coowners);
  v_50b973(v_479f05.messages);
  v_a07f65(v_479f05.feeds);
  return v_479f05 as Seed;
}
