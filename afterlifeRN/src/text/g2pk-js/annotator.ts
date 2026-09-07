

const v_07a2ce = [
  '으로부터', '한테서는', '한테서', '한테는', '한테', '으로써', '에게서', '에게로', '에게는', '에게도',
  '에게', '으로도', '으로만', '이라도', '이라면', '이라서', '이라고', '에서만', '에서도', '에서는',
  '에서', '이란', '이든', '이면', '으로', '까지', '조차', '마저', '부터', '만큼', '뿐만', '보다',
  '처럼', '같이', '따라', '만도',
];
const v_a21119 = [
  '이', '가', '은', '는', '을', '를', '의', '에', '와', '과', '이나', '나', '이야', '야',
  '이도', '도', '만', '이든', '든', '이나마', '나마', '조차', '마다', '이며', '며', '랑', '이랑',
  '아', '이여', '여',
];

const v_22f471 = ['ㄹ', '을', '를'];

const v_257872 = new Set(
  '군데 권 개 그루 닢 대 두 마리 모 모금 뭇 발 발짝 방 번 벌 보루 살 수 술 시 쌈 움큼 정 짝 채 척 첩 축 켤레 톨 통 명 살 분 초 년 월 일 시간 원 세'.split(' '),
);

export function v_5949f4(v_fba864): string {

  let v_9c44e3 = v_fba864.replace(/([\d,]+)([가-힣]+)/g, (v_a63110, v_0ad8c5, v_5787df) => {

    for (const v_b3e922 of v_257872) {
      if (v_5787df.startsWith(v_b3e922)) {
        return `${v_0ad8c5}${v_b3e922}/B${v_5787df.slice(v_b3e922.length)}`;
      }
    }
    return v_a63110;
  });

  const v_1468d5 = v_9c44e3.split(/(\s+)/); 
  const v_8d4337 = [];

  for (const v_e930c0 of v_1468d5) {
    if (/^\s+$/.test(v_e930c0) || !v_e930c0) {
      v_8d4337.push(v_e930c0);
      continue;
    }

    let v_7be1fc = v_e930c0;

    let v_4b037d = false;
    for (const v_231735 of v_07a2ce) {
      if (v_7be1fc.endsWith(v_231735) && v_7be1fc.length > v_231735.length) {
        const v_7ffba6 = v_7be1fc.slice(0, -v_231735.length);
        v_7be1fc = v_7ffba6 + v_231735 + '/J';
        v_4b037d = true;
        break;
      }
    }
    if (!v_4b037d) {
      for (const v_231735 of v_a21119) {
        if (v_7be1fc.endsWith(v_231735) && v_7be1fc.length > v_231735.length) {
          const v_7ffba6 = v_7be1fc.slice(0, -v_231735.length);
          v_7be1fc = v_7ffba6 + v_231735 + '/J';
          v_4b037d = true;
          break;
        }
      }
    }

    if (!v_4b037d) {
      for (const v_9999f9 of v_22f471) {
        if (v_7be1fc.endsWith(v_9999f9) && v_7be1fc.length > v_9999f9.length) {
          v_7be1fc = v_7be1fc + '/E';
          v_4b037d = true;
          break;
        }
      }
    }

    v_8d4337.push(v_7be1fc);
  }

  return v_8d4337.join('');
}
