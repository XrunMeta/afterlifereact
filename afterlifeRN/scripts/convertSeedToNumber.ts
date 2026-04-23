

import * as fs from 'fs';
import * as path from 'path';

const SEED_DIR = path.join(__dirname, '..', 'src', 'mocks', 'seed');
const MSG_DIR = path.join(SEED_DIR, 'messages');

const CLONE_TYPE_OFFSET: Record<string, number> = {
  memlow: 0,
  friend: 6,
  mentor: 12,
  celeb: 18,
};

const userIdNum = (s: string): number => {
  if (s.startsWith('user-v')) return 1000 + parseInt(s.slice('user-v'.length), 10);
  return parseInt(s.slice('user-'.length), 10);
};

const cloneIdNum = (s: string): number => {
  const m = /^clone-(memlow|friend|mentor|celeb)-(\d+)$/.exec(s);
  if (!m) throw new Error(`Bad clone id: ${s}`);
  return CLONE_TYPE_OFFSET[m[1]]! + parseInt(m[2], 10);
};

const stripPrefixNum = (prefix: string) => (s: string): number =>
  parseInt(s.slice(prefix.length), 10);

const feedIdNum = stripPrefixNum('feed-');
const followIdNum = stripPrefixNum('follow-');
const coownerIdNum = stripPrefixNum('coowner-');

function read(name: string): any[] {
  return JSON.parse(fs.readFileSync(path.join(SEED_DIR, name), 'utf8'));
}

function write(name: string, data: unknown) {
  fs.writeFileSync(path.join(SEED_DIR, name), JSON.stringify(data, null, 2) + '\n');
}

function writeMsgFile(file: string, data: unknown) {
  fs.writeFileSync(path.join(MSG_DIR, file), JSON.stringify(data, null, 2) + '\n');
}

const users = read('users.json').map((u) => ({ ...u, id: userIdNum(u.id) }));
write('users.json', users);

const clones = read('clones.json').map((c) => {
  const { ownerUserId, id, ...rest } = c;
  return { id: cloneIdNum(id), cloneType: rest.cloneType, ownerId: userIdNum(ownerUserId), ...omit(rest, 'cloneType') };
});
write('clones.json', clones);

const follows = read('follows.json').map((f) => ({
  id: followIdNum(f.id),
  followerUserId: userIdNum(f.followerUserId),
  followingCloneId: cloneIdNum(f.followingCloneId),
  followedAt: f.followedAt,
}));
write('follows.json', follows);

const coowners = read('coowners.json').map((co) => ({
  id: coownerIdNum(co.id),
  cloneId: cloneIdNum(co.cloneId),
  userId: userIdNum(co.userId),
  status: co.status,
  invitedAt: co.invitedAt,
  ...(co.approvedAt ? { approvedAt: co.approvedAt } : {}),
}));
write('coowners.json', coowners);

const feeds = read('feeds.json').map((f) => {
  const out: any = {
    id: feedIdNum(f.id),
    cloneId: cloneIdNum(f.cloneId),
    content: f.text,
    createdAt: f.createdAt,
  };
  if (f.imageUrl) out.mediaUrl = f.imageUrl;
  return out;
});
write('feeds.json', feeds);

const msgFiles = fs
  .readdirSync(MSG_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'messages.json')
  .sort();

let msgCounter = 0;
const allMessages: any[] = [];
msgFiles.forEach((file) => {
  const arr = JSON.parse(fs.readFileSync(path.join(MSG_DIR, file), 'utf8')) as any[];
  const converted = arr.map((m) => ({
    id: ++msgCounter,
    cloneId: cloneIdNum(m.cloneId),
    userId: userIdNum(m.userId),
    role: m.senderType,
    content: m.text,
    timestamp: m.timestamp,
  }));
  writeMsgFile(file, converted);
  allMessages.push(...converted);
});
write('messages.json', allMessages);

console.log(
  `Converted: users=${users.length}, clones=${clones.length}, follows=${follows.length}, coowners=${coowners.length}, feeds=${feeds.length}, messages=${allMessages.length}`,
);

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const { [key]: _, ...rest } = obj;
  return rest;
}
