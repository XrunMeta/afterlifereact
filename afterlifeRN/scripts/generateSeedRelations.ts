

import * as fs from 'fs';
import * as path from 'path';
import users from '../src/mocks/seed/users.json';
import clones from '../src/mocks/seed/clones.json';

function prng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = prng(20260421);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const FOLLOW_RANGE: Record<string, [number, number]> = {
  memlow: [3, 15],
  friend: [20, 80],
  mentor: [50, 200],
  celeb: [200, 500],
};

const follows: any[] = [];
const userIds = (users as any[]).map(u => u.id);
let followCounter = 0;
(clones as any[]).forEach(c => {
  const [lo, hi] = FOLLOW_RANGE[c.cloneType];
  const target = randInt(lo, hi);
  const virtualPool = [...userIds];
  while (virtualPool.length < target) virtualPool.push(`user-v${virtualPool.length + 1}`);
  for (let i = virtualPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [virtualPool[i], virtualPool[j]] = [virtualPool[j], virtualPool[i]];
  }
  const selected = virtualPool.slice(0, target);
  selected.forEach(u => {
    follows.push({
      id: `follow-${String(++followCounter).padStart(5, '0')}`,
      followerUserId: u,
      followingCloneId: c.id,
      followedAt: `2026-${String(randInt(3, 4)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}T${String(randInt(0, 23)).padStart(2, '0')}:00:00Z`,
    });
  });
});

const coowners: any[] = [];
let coCounter = 0;
(clones as any[]).filter(c => c.cloneType === 'memlow').forEach(c => {
  const count = randInt(2, 4);
  const pool = userIds.filter(u => u !== 'user-001');
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  pool.slice(0, count).forEach(u => {
    const invitedAt = `2026-03-${String(randInt(1, 20)).padStart(2, '0')}T10:00:00Z`;
    coowners.push({
      id: `coowner-${String(++coCounter).padStart(4, '0')}`,
      cloneId: c.id,
      userId: u,
      status: 'approved',
      invitedAt,
      approvedAt: invitedAt.replace('10:00:00', '12:00:00'),
    });
  });
});

const feedTemplates: Record<string, string[]> = {
  memlow: [
    '오늘 손주 얼굴이 보고싶어 한참을 앉아있었어.',
    '예전 사진을 정리하다 네 어릴 적 모습이 눈에 들어왔다.',
    '추운 날이면 뜨끈한 국물 한그릇이 생각나는구나.',
  ],
  friend: [
    '주말에 뭐해? 오랜만에 한잔 어때',
    '이 노래 너 분명 좋아할 거 같아서 공유해',
    '요즘 나 헬스 시작했어, 같이 갈래?',
  ],
  mentor: [
    '작은 습관 하나가 한 해를 바꿉니다. 오늘 무엇을 시작하시나요?',
    '실패는 데이터입니다. 감정으로 해석하지 마세요.',
    '질문을 바꾸면 답이 바뀝니다.',
  ],
  celeb: [
    '새 앨범 작업 중입니다. 곧 좋은 소식으로 만나요!',
    '오늘 공식 일정 마쳤습니다. 여러분 덕에 힘이 났어요.',
    '#공지 다음주 라이브 예정입니다.',
  ],
};

const feeds: any[] = [];
let feedCounter = 0;
(clones as any[]).forEach(c => {
  const count = randInt(2, 8);
  const pool = feedTemplates[c.cloneType];
  for (let i = 0; i < count; i++) {
    feeds.push({
      id: `feed-${String(++feedCounter).padStart(4, '0')}`,
      cloneId: c.id,
      text: pool[i % pool.length],
      createdAt: `2026-04-${String(randInt(1, 20)).padStart(2, '0')}T${String(randInt(0, 23)).padStart(2, '0')}:00:00Z`,
    });
  }
});

const out = (name: string, data: unknown) =>
  fs.writeFileSync(
    path.join(__dirname, '..', 'src', 'mocks', 'seed', `${name}.json`),
    JSON.stringify(data, null, 2),
  );

out('follows', follows);
out('coowners', coowners);
out('feeds', feeds);

console.log(`Generated: follows=${follows.length}, coowners=${coowners.length}, feeds=${feeds.length}`);
