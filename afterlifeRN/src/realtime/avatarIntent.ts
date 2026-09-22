

export type BridgeIntent =
  | 'self'
  | 'emotion_neg'
  | 'challenge'
  | 'emotion_pos'
  | 'location'
  | 'advice'
  | 'fact'
  | 'complex'
  | 'generic';

export const v_dd9753 = [
  'self',
  'emotion_neg',
  'challenge',
  'emotion_pos',
  'location',
  'advice',
  'fact',
  'complex',
  'generic',
] as const;

type Rule = { intent: BridgeIntent; needles: readonly string[] };

const v_8d6752 = [
  {
    intent: 'self',
    needles: ['너 누구', '너는 누구', '이름이', '이름 뭐', '몇 살', '취미', '진짜 사람', 'AI야', 'AI 야', '너도 사람', '너 사람'],
  },
  {
    intent: 'emotion_neg',
    needles: ['피곤', '속상', '슬퍼', '슬프', '힘들', '우울', '외로', '지쳤', '눈물', '괴로'],
  },
  {
    intent: 'challenge',
    needles: ['바보', '거짓말', '못하는데', '못하지', '너 못', '헛소리', '틀렸어', '거짓'],
  },
  {
    intent: 'emotion_pos',
    needles: ['대박', '웃기다', '웃겨', '헐', '대단', '기뻐', '신나', '재밌', '재미', '좋다', '최고'],
  },
  {
    intent: 'location',
    needles: [
      '어디', '위치', '근처', '맛집', '카페', '가볼', '장소', '여행',
      '서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강남', '홍대', '이태원', '노원', '상계',
    ],
  },
  {
    intent: 'advice',
    needles: ['추천', '골라', '어떤 게', '고민', '조언', '어떡', '뭐 먹', '뭐먹', '선택', '골라줘'],
  },
  {
    intent: 'fact',
    needles: [
      '몇 시', '언제', '누구', '얼마', '뜻', '방법', '왜', '검색', '알려줘',
      '어떻게', '무엇', '무슨', '어느', '몇', '어때', '어떻',
    ],
  },
];

const v_61cc24 = 40;

export function v_919a30(v_bd947d): BridgeIntent {
  const v_9b6134 = (v_bd947d ?? '').trim();
  if (!v_9b6134) return 'generic';
  for (const v_32000f of v_8d6752) {
    for (const v_f4e98d of v_32000f.needles) {
      if (v_9b6134.includes(v_f4e98d)) return v_32000f.intent;
    }
  }
  return v_9b6134.length >= v_61cc24 ? 'complex' : 'generic';
}

export function v_a60398(v_9d78c8, v_506e86): BridgeIntent {
  if (v_506e86 != null && v_9d78c8 === v_506e86 && v_9d78c8 !== 'generic') return 'generic';
  return v_9d78c8;
}
