

import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';

const v_e5a638 = v_9fe22d.join(__dirname, '..', 'src', 'mocks', 'seed');
const v_94c904 = v_9fe22d.join(v_e5a638, 'messages');

const v_c04160 = {
  memlow: 0,
  friend: 6,
  mentor: 12,
  celeb: 18,
};

const v_c47d85 = (v_fd5f43): number => {
  if (v_fd5f43.startsWith('user-v')) return 1000 + parseInt(v_fd5f43.slice('user-v'.length), 10);
  return parseInt(v_fd5f43.slice('user-'.length), 10);
};

const v_d34659 = (v_fd5f43): number => {
  const v_35f85c = /^clone-(memlow|friend|mentor|celeb)-(\d+)$/.exec(v_fd5f43);
  if (!v_35f85c) throw new Error(`Bad clone id: ${v_fd5f43}`);
  return v_c04160[v_35f85c[1]]! + parseInt(v_35f85c[2], 10);
};

const v_7406df = (v_cd931c) => (v_fd5f43): number =>
  parseInt(v_fd5f43.slice(v_cd931c.length), 10);

const v_9a5061 = v_7406df('feed-');
const v_bf77e8 = v_7406df('follow-');
const v_e0b498 = v_7406df('coowner-');

function v_0dd7c7(v_1833e7): any[] {
  return JSON.parse(v_9d3c52.readFileSync(v_9fe22d.join(v_e5a638, v_1833e7), 'utf8'));
}

function v_b14903(v_1833e7, v_9390e8) {
  v_9d3c52.writeFileSync(v_9fe22d.join(v_e5a638, v_1833e7), JSON.stringify(v_9390e8, null, 2) + '\n');
}

function v_5f7186(v_4de33e, v_9390e8) {
  v_9d3c52.writeFileSync(v_9fe22d.join(v_94c904, v_4de33e), JSON.stringify(v_9390e8, null, 2) + '\n');
}

const v_de7ba7 = v_0dd7c7('users.json').map((v_ceb55a) => ({ ...v_ceb55a, id: v_c47d85(v_ceb55a.id) }));
v_b14903('users.json', v_de7ba7);

const v_f891e6 = v_0dd7c7('clones.json').map((v_3f4e2e) => {
  const { ownerUserId: v_07de05, id: v_389afb, ...v_83bbcd } = v_3f4e2e;
  return { id: v_d34659(v_389afb), cloneType: v_83bbcd.cloneType, ownerId: v_c47d85(v_07de05), ...v_076f74(v_83bbcd, 'cloneType') };
});
v_b14903('clones.json', v_f891e6);

const v_1e752a = v_0dd7c7('follows.json').map((v_8b5cd8) => ({
  id: v_bf77e8(v_8b5cd8.id),
  followerUserId: v_c47d85(v_8b5cd8.followerUserId),
  followingCloneId: v_d34659(v_8b5cd8.followingCloneId),
  followedAt: v_8b5cd8.followedAt,
}));
v_b14903('follows.json', v_1e752a);

const v_62c8fb = v_0dd7c7('coowners.json').map((v_c4a45b) => ({
  id: v_e0b498(v_c4a45b.id),
  cloneId: v_d34659(v_c4a45b.cloneId),
  userId: v_c47d85(v_c4a45b.userId),
  status: v_c4a45b.status,
  invitedAt: v_c4a45b.invitedAt,
  ...(v_c4a45b.approvedAt ? { approvedAt: v_c4a45b.approvedAt } : {}),
}));
v_b14903('coowners.json', v_62c8fb);

const v_632473 = v_0dd7c7('feeds.json').map((v_8b5cd8) => {
  const v_8d4337 = {
    id: v_9a5061(v_8b5cd8.id),
    cloneId: v_d34659(v_8b5cd8.cloneId),
    content: v_8b5cd8.text,
    createdAt: v_8b5cd8.createdAt,
  };
  if (v_8b5cd8.imageUrl) v_8d4337.mediaUrl = v_8b5cd8.imageUrl;
  return v_8d4337;
});
v_b14903('feeds.json', v_632473);

const v_c903a3 = v_9d3c52
  .readdirSync(v_94c904)
  .filter((v_8b5cd8) => v_8b5cd8.endsWith('.json') && v_8b5cd8 !== 'messages.json')
  .sort();

let v_f878b4 = 0;
const v_846fc2 = [];
v_c903a3.forEach((v_4de33e) => {
  const v_d0c056 = JSON.parse(v_9d3c52.readFileSync(v_9fe22d.join(v_94c904, v_4de33e), 'utf8')) as any[];
  const v_9b07bc = v_d0c056.map((v_35f85c) => ({
    id: ++v_f878b4,
    cloneId: v_d34659(v_35f85c.cloneId),
    userId: v_c47d85(v_35f85c.userId),
    role: v_35f85c.senderType,
    content: v_35f85c.text,
    timestamp: v_35f85c.timestamp,
  }));
  v_5f7186(v_4de33e, v_9b07bc);
  v_846fc2.push(...v_9b07bc);
});
v_b14903('messages.json', v_846fc2);

console.log(
  `Converted: users=${v_de7ba7.length}, clones=${v_f891e6.length}, follows=${v_1e752a.length}, coowners=${v_62c8fb.length}, feeds=${v_632473.length}, messages=${v_846fc2.length}`,
);

function v_076f74<T extends object, K extends keyof T>(v_8839e3, v_b24339): Omit<T, K> {
  const { [v_b24339]: v_37eab7, ...v_83bbcd } = v_8839e3;
  return v_83bbcd;
}
