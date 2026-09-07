

const v_3aaad4 = new Set(
  '군데 권 개 그루 닢 대 두 마리 모 모금 뭇 발 발짝 방 번 벌 보루 살 수 술 시 쌈 움큼 정 짝 채 척 첩 축 켤레 톨 통'.split(' '),
);

const v_36199e = {
  '1': '일', '2': '이', '3': '삼', '4': '사', '5': '오',
  '6': '육', '7': '칠', '8': '팔', '9': '구',
};

const v_86f81c = {
  '1': '한', '2': '두', '3': '세', '4': '네', '5': '다섯',
  '6': '여섯', '7': '일곱', '8': '여덟', '9': '아홉',
};

const v_342e72 = {
  '1': '열', '2': '스물', '3': '서른', '4': '마흔', '5': '쉰',
  '6': '예순', '7': '일흔', '8': '여든', '9': '아흔',
};

export function v_fdd04f(v_0ad8c5, v_c160c0 = true): string {
  const v_738e47 = v_0ad8c5.replace(/,/g, '');

  if (v_738e47 === '0') return '영';
  if (!v_c160c0 && v_738e47 === '20') return '스무';

  const v_cdcb00 = [];
  const v_fe889f = v_738e47.length;

  for (let v_e86ad8 = 0; v_e86ad8 < v_fe889f; v_e86ad8++) {
    const v_5f701e = v_738e47[v_e86ad8];
    const v_ebec57 = v_fe889f - v_e86ad8 - 1; 

    let v_1833e7 = '';

    if (v_c160c0) {
      if (v_ebec57 === 0) {
        v_1833e7 = v_36199e[v_5f701e] || '';
      } else if (v_ebec57 === 1) {
        v_1833e7 = (v_36199e[v_5f701e] || '') + '십';
        v_1833e7 = v_1833e7.replace('일십', '십');
      }
    } else {
      if (v_ebec57 === 0) {
        v_1833e7 = v_86f81c[v_5f701e] || '';
      } else if (v_ebec57 === 1) {
        v_1833e7 = v_342e72[v_5f701e] || '';
      }
    }

    if (v_5f701e === '0') {
      if (v_ebec57 % 4 === 0) {
        const v_f7af2e = v_cdcb00.slice(-Math.min(3, v_cdcb00.length));
        if (v_f7af2e.join('') === '') {
          v_cdcb00.push('');
          continue;
        }
      } else {
        v_cdcb00.push('');
        continue;
      }
    }

    if (v_ebec57 === 2) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '백';
      v_1833e7 = v_1833e7.replace('일백', '백');
    } else if (v_ebec57 === 3) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '천';
      v_1833e7 = v_1833e7.replace('일천', '천');
    } else if (v_ebec57 === 4) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '만';
      v_1833e7 = v_1833e7.replace('일만', '만');
    } else if (v_ebec57 === 5) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '십';
      v_1833e7 = v_1833e7.replace('일십', '십');
    } else if (v_ebec57 === 6) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '백';
      v_1833e7 = v_1833e7.replace('일백', '백');
    } else if (v_ebec57 === 7) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '천';
      v_1833e7 = v_1833e7.replace('일천', '천');
    } else if (v_ebec57 === 8) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '억';
    } else if (v_ebec57 === 9) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '십';
    } else if (v_ebec57 === 10) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '백';
    } else if (v_ebec57 === 11) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '천';
    } else if (v_ebec57 === 12) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '조';
    } else if (v_ebec57 === 13) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '십';
    } else if (v_ebec57 === 14) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '백';
    } else if (v_ebec57 === 15) {
      v_1833e7 = (v_36199e[v_5f701e] || '') + '천';
    }

    v_cdcb00.push(v_1833e7);
  }

  return v_cdcb00.join('');
}

export function v_9da465(v_fba864): string {
  let v_8d4337 = v_fba864;

  const v_2b8b40 = /([\d][\d,]*)([가-힣]+)\/B/g;
  const v_ef86b6 = [];
  let v_a63110;
  while ((v_a63110 = v_2b8b40.exec(v_fba864)) !== null) {
    v_ef86b6.push([v_a63110[1], v_a63110[2]]);
  }

  const v_110a8b = new Set<string>();
  for (const [v_0ad8c5, v_b3e922] of v_ef86b6) {
    const v_b24339 = `${v_0ad8c5}|${v_b3e922}`;
    if (v_110a8b.has(v_b24339)) continue;
    v_110a8b.add(v_b24339);
    const v_cdcb00 = v_3aaad4.has(v_b3e922)
      ? v_fdd04f(v_0ad8c5, false)
      : v_fdd04f(v_0ad8c5, true);
    const v_a13c2e = `${v_0ad8c5}${v_b3e922}/B`;
    const v_257132 = `${v_cdcb00}${v_b3e922}/B`;
    v_8d4337 = v_8d4337.split(v_a13c2e).join(v_257132);
  }

  const v_e6d4a6 = '0123456789';
  const v_77b1ac = '영일이삼사오육칠팔구';
  for (let v_ebec57 = 0; v_ebec57 < v_e6d4a6.length; v_ebec57++) {
    v_8d4337 = v_8d4337.split(v_e6d4a6[v_ebec57]).join(v_77b1ac[v_ebec57]);
  }

  return v_8d4337;
}
