

const JOSAS_LONG = [
  '으로부터', '한테서는', '한테서', '한테는', '한테', '으로써', '에게서', '에게로', '에게는', '에게도',
  '에게', '으로도', '으로만', '이라도', '이라면', '이라서', '이라고', '에서만', '에서도', '에서는',
  '에서', '이란', '이든', '이면', '으로', '까지', '조차', '마저', '부터', '만큼', '뿐만', '보다',
  '처럼', '같이', '따라', '만도',
];
const JOSAS_SHORT = [
  '이', '가', '은', '는', '을', '를', '의', '에', '와', '과', '이나', '나', '이야', '야',
  '이도', '도', '만', '이든', '든', '이나마', '나마', '조차', '마다', '이며', '며', '랑', '이랑',
  '아', '이여', '여',
];

const EOMIS_E = ['ㄹ', '을', '를'];

const BOUND_NOUN_SET = new Set(
  '군데 권 개 그루 닢 대 두 마리 모 모금 뭇 발 발짝 방 번 벌 보루 살 수 술 시 쌈 움큼 정 짝 채 척 첩 축 켤레 톨 통 명 살 분 초 년 월 일 시간 원 세'.split(' '),
);

export function annotate(str: string): string {

  let staged = str.replace(/([\d,]+)([가-힣]+)/g, (match, num, noun) => {

    for (const bn of BOUND_NOUN_SET) {
      if (noun.startsWith(bn)) {
        return `${num}${bn}/B${noun.slice(bn.length)}`;
      }
    }
    return match;
  });

  const words = staged.split(/(\s+)/); 
  const out: string[] = [];

  for (const word of words) {
    if (/^\s+$/.test(word) || !word) {
      out.push(word);
      continue;
    }

    let tagged = word;

    let matched = false;
    for (const josa of JOSAS_LONG) {
      if (tagged.endsWith(josa) && tagged.length > josa.length) {
        const stem = tagged.slice(0, -josa.length);
        tagged = stem + josa + '/J';
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const josa of JOSAS_SHORT) {
        if (tagged.endsWith(josa) && tagged.length > josa.length) {
          const stem = tagged.slice(0, -josa.length);
          tagged = stem + josa + '/J';
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      for (const eomi of EOMIS_E) {
        if (tagged.endsWith(eomi) && tagged.length > eomi.length) {
          tagged = tagged + '/E';
          matched = true;
          break;
        }
      }
    }

    out.push(tagged);
  }

  return out.join('');
}
