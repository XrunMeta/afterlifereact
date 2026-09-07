

const BOUND_NOUNS = new Set(
  '군데 권 개 그루 닢 대 두 마리 모 모금 뭇 발 발짝 방 번 벌 보루 살 수 술 시 쌈 움큼 정 짝 채 척 첩 축 켤레 톨 통'.split(' '),
);

const DIGIT_TO_NAME: Record<string, string> = {
  '1': '일', '2': '이', '3': '삼', '4': '사', '5': '오',
  '6': '육', '7': '칠', '8': '팔', '9': '구',
};

const DIGIT_TO_MOD: Record<string, string> = {
  '1': '한', '2': '두', '3': '세', '4': '네', '5': '다섯',
  '6': '여섯', '7': '일곱', '8': '여덟', '9': '아홉',
};

const DIGIT_TO_DEC: Record<string, string> = {
  '1': '열', '2': '스물', '3': '서른', '4': '마흔', '5': '쉰',
  '6': '예순', '7': '일흔', '8': '여든', '9': '아흔',
};

export function process_num(num: string, sino: boolean = true): string {
  const cleaned = num.replace(/,/g, '');

  if (cleaned === '0') return '영';
  if (!sino && cleaned === '20') return '스무';

  const spelledout: string[] = [];
  const len = cleaned.length;

  for (let idx = 0; idx < len; idx++) {
    const digit = cleaned[idx];
    const i = len - idx - 1; 

    let name = '';

    if (sino) {
      if (i === 0) {
        name = DIGIT_TO_NAME[digit] || '';
      } else if (i === 1) {
        name = (DIGIT_TO_NAME[digit] || '') + '십';
        name = name.replace('일십', '십');
      }
    } else {
      if (i === 0) {
        name = DIGIT_TO_MOD[digit] || '';
      } else if (i === 1) {
        name = DIGIT_TO_DEC[digit] || '';
      }
    }

    if (digit === '0') {
      if (i % 4 === 0) {
        const lastThree = spelledout.slice(-Math.min(3, spelledout.length));
        if (lastThree.join('') === '') {
          spelledout.push('');
          continue;
        }
      } else {
        spelledout.push('');
        continue;
      }
    }

    if (i === 2) {
      name = (DIGIT_TO_NAME[digit] || '') + '백';
      name = name.replace('일백', '백');
    } else if (i === 3) {
      name = (DIGIT_TO_NAME[digit] || '') + '천';
      name = name.replace('일천', '천');
    } else if (i === 4) {
      name = (DIGIT_TO_NAME[digit] || '') + '만';
      name = name.replace('일만', '만');
    } else if (i === 5) {
      name = (DIGIT_TO_NAME[digit] || '') + '십';
      name = name.replace('일십', '십');
    } else if (i === 6) {
      name = (DIGIT_TO_NAME[digit] || '') + '백';
      name = name.replace('일백', '백');
    } else if (i === 7) {
      name = (DIGIT_TO_NAME[digit] || '') + '천';
      name = name.replace('일천', '천');
    } else if (i === 8) {
      name = (DIGIT_TO_NAME[digit] || '') + '억';
    } else if (i === 9) {
      name = (DIGIT_TO_NAME[digit] || '') + '십';
    } else if (i === 10) {
      name = (DIGIT_TO_NAME[digit] || '') + '백';
    } else if (i === 11) {
      name = (DIGIT_TO_NAME[digit] || '') + '천';
    } else if (i === 12) {
      name = (DIGIT_TO_NAME[digit] || '') + '조';
    } else if (i === 13) {
      name = (DIGIT_TO_NAME[digit] || '') + '십';
    } else if (i === 14) {
      name = (DIGIT_TO_NAME[digit] || '') + '백';
    } else if (i === 15) {
      name = (DIGIT_TO_NAME[digit] || '') + '천';
    }

    spelledout.push(name);
  }

  return spelledout.join('');
}

export function convert_num(str: string): string {
  let out = str;

  const pattern = /([\d][\d,]*)([가-힣]+)\/B/g;
  const tokens: Array<[string, string]> = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(str)) !== null) {
    tokens.push([match[1], match[2]]);
  }

  const seen = new Set<string>();
  for (const [num, bn] of tokens) {
    const key = `${num}|${bn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const spelledout = BOUND_NOUNS.has(bn)
      ? process_num(num, false)
      : process_num(num, true);
    const from = `${num}${bn}/B`;
    const to = `${spelledout}${bn}/B`;
    out = out.split(from).join(to);
  }

  const digits = '0123456789';
  const names = '영일이삼사오육칠팔구';
  for (let i = 0; i < digits.length; i++) {
    out = out.split(digits[i]).join(names[i]);
  }

  return out;
}
