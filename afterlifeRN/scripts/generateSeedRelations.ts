

import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';
import v_de7ba7 from '../src/mocks/seed/users.json';
import v_f891e6 from '../src/mocks/seed/clones.json';

function v_d7bc8c(v_bdb39e) {
  let v_8d41d7 = v_bdb39e >>> 0;
  return () => {
    v_8d41d7 = (v_8d41d7 + 0x6D2B79F5) >>> 0;
    let v_cb35cb = Math.imul(v_8d41d7 ^ (v_8d41d7 >>> 15), 1 | v_8d41d7);
    v_cb35cb = (v_cb35cb + Math.imul(v_cb35cb ^ (v_cb35cb >>> 7), 61 | v_cb35cb)) ^ v_cb35cb;
    return ((v_cb35cb ^ (v_cb35cb >>> 14)) >>> 0) / 4294967296;
  };
}

const v_fc3f08 = v_d7bc8c(20260421);
const v_be181a = (v_43e24b, v_d2c6bf) => Math.floor(v_fc3f08() * (v_d2c6bf - v_43e24b + 1)) + v_43e24b;

const v_dcbdd9 = {
  memlow: [3, 15],
  friend: [20, 80],
  mentor: [50, 200],
  celeb: [200, 500],
};

const v_1e752a = [];
const v_9b3001 = (v_de7ba7 as any[]).map(v_ceb55a => v_ceb55a.id);
let v_cf9b9a = 0;
(v_f891e6 as any[]).forEach(v_3f4e2e => {
  const [v_bc6da1, v_d54b9c] = v_dcbdd9[v_3f4e2e.cloneType];
  const v_5f5d6d = v_be181a(v_bc6da1, v_d54b9c);
  const v_3539f6 = [...v_9b3001];
  while (v_3539f6.length < v_5f5d6d) v_3539f6.push(`user-v${v_3539f6.length + 1}`);
  for (let v_ebec57 = v_3539f6.length - 1; v_ebec57 > 0; v_ebec57--) {
    const v_b75e36 = Math.floor(v_fc3f08() * (v_ebec57 + 1));
    [v_3539f6[v_ebec57], v_3539f6[v_b75e36]] = [v_3539f6[v_b75e36], v_3539f6[v_ebec57]];
  }
  const v_587413 = v_3539f6.slice(0, v_5f5d6d);
  v_587413.forEach(v_ceb55a => {
    v_1e752a.push({
      id: `follow-${String(++v_cf9b9a).padStart(5, '0')}`,
      followerUserId: v_ceb55a,
      followingCloneId: v_3f4e2e.id,
      followedAt: `2026-${String(v_be181a(3, 4)).padStart(2, '0')}-${String(v_be181a(1, 28)).padStart(2, '0')}T${String(v_be181a(0, 23)).padStart(2, '0')}:00:00Z`,
    });
  });
});

const v_62c8fb = [];
let v_667873 = 0;
(v_f891e6 as any[]).filter(v_3f4e2e => v_3f4e2e.cloneType === 'memlow').forEach(v_3f4e2e => {
  const v_9e8c70 = v_be181a(2, 4);
  const v_75fbef = v_9b3001.filter(v_ceb55a => v_ceb55a !== 'user-001');
  for (let v_ebec57 = v_75fbef.length - 1; v_ebec57 > 0; v_ebec57--) {
    const v_b75e36 = Math.floor(v_fc3f08() * (v_ebec57 + 1));
    [v_75fbef[v_ebec57], v_75fbef[v_b75e36]] = [v_75fbef[v_b75e36], v_75fbef[v_ebec57]];
  }
  v_75fbef.slice(0, v_9e8c70).forEach(v_ceb55a => {
    const v_6239c1 = `2026-03-${String(v_be181a(1, 20)).padStart(2, '0')}T10:00:00Z`;
    v_62c8fb.push({
      id: `coowner-${String(++v_667873).padStart(4, '0')}`,
      cloneId: v_3f4e2e.id,
      userId: v_ceb55a,
      status: 'approved',
      invitedAt: v_6239c1,
      approvedAt: v_6239c1.replace('10:00:00', '12:00:00'),
    });
  });
});

const v_934e83 = {
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

const v_632473 = [];
let v_91a653 = 0;
(v_f891e6 as any[]).forEach(v_3f4e2e => {
  const v_9e8c70 = v_be181a(2, 8);
  const v_75fbef = v_934e83[v_3f4e2e.cloneType];
  for (let v_ebec57 = 0; v_ebec57 < v_9e8c70; v_ebec57++) {
    v_632473.push({
      id: `feed-${String(++v_91a653).padStart(4, '0')}`,
      cloneId: v_3f4e2e.id,
      text: v_75fbef[v_ebec57 % v_75fbef.length],
      createdAt: `2026-04-${String(v_be181a(1, 20)).padStart(2, '0')}T${String(v_be181a(0, 23)).padStart(2, '0')}:00:00Z`,
    });
  }
});

const v_8d4337 = (v_1833e7, v_9390e8) =>
  v_9d3c52.writeFileSync(
    v_9fe22d.join(__dirname, '..', 'src', 'mocks', 'seed', `${v_1833e7}.json`),
    JSON.stringify(v_9390e8, null, 2),
  );

v_8d4337('follows', v_1e752a);
v_8d4337('coowners', v_62c8fb);
v_8d4337('feeds', v_632473);

console.log(`Generated: follows=${v_1e752a.length}, coowners=${v_62c8fb.length}, feeds=${v_632473.length}`);
