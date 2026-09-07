

import { v_47f2de, v_f010bf, v_c33aa1, v_0f06d0, v_9e718c } from '../jamo';

function v_c26a1c<T>(v_61a388, v_505a6d, v_badeaf): void {
  const v_779914 = JSON.stringify(v_61a388);
  const v_9e86fd = JSON.stringify(v_505a6d);
  if (v_779914 !== v_9e86fd) {
    console.error(`FAIL ${v_badeaf}: got ${v_779914} · expected ${v_9e86fd}`);
  } else {
    console.log(`PASS ${v_badeaf}`);
  }
}

export function v_57e3d8(): void {

  v_c26a1c(v_9e718c('가'), true, "isHangul('가')");
  v_c26a1c(v_9e718c('힣'), true, "isHangul('힣')");
  v_c26a1c(v_9e718c('A'), false, "isHangul('A')");
  v_c26a1c(v_9e718c('ㄱ'), false, "isHangul('ㄱ') · 호환자모");

  v_c26a1c(v_47f2de('가'), ['ㄱ', 'ㅏ', ''], "h2j('가')");
  v_c26a1c(v_47f2de('나'), ['ㄴ', 'ㅏ', ''], "h2j('나')");
  v_c26a1c(v_47f2de('힣'), ['ㅎ', 'ㅣ', 'ㅎ'], "h2j('힣')");

  v_c26a1c(v_47f2de('밥'), ['ㅂ', 'ㅏ', 'ㅂ'], "h2j('밥')");
  v_c26a1c(v_47f2de('안'), ['ㅇ', 'ㅏ', 'ㄴ'], "h2j('안')");
  v_c26a1c(v_47f2de('녕'), ['ㄴ', 'ㅕ', 'ㅇ'], "h2j('녕')");

  v_c26a1c(v_47f2de('닭'), ['ㄷ', 'ㅏ', 'ㄺ'], "h2j('닭')");
  v_c26a1c(v_47f2de('값'), ['ㄱ', 'ㅏ', 'ㅄ'], "h2j('값')");

  v_c26a1c(v_47f2de('A'), null, "h2j('A')");
  v_c26a1c(v_47f2de('!'), null, "h2j('!')");

  v_c26a1c(v_f010bf('ㄱ', 'ㅏ'), '가', "j2h('ㄱ','ㅏ')");
  v_c26a1c(v_f010bf('ㅂ', 'ㅏ', 'ㅂ'), '밥', "j2h('ㅂ','ㅏ','ㅂ')");
  v_c26a1c(v_f010bf('ㅎ', 'ㅣ', 'ㅎ'), '힣', "j2h('ㅎ','ㅣ','ㅎ')");
  v_c26a1c(v_f010bf('ㄷ', 'ㅏ', 'ㄺ'), '닭', "j2h('ㄷ','ㅏ','ㄺ')");

  v_c26a1c(v_c33aa1('안녕'), ['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ'], "decompose('안녕')");
  v_c26a1c(
    v_c33aa1('안녕!'),
    ['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ', '!'],
    "decompose('안녕!')",
  );
  v_c26a1c(v_c33aa1('가'), ['ㄱ', 'ㅏ'], "decompose('가') · 종성 없음");

  v_c26a1c(v_0f06d0(['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ']), '안녕', "compose 안녕");
  v_c26a1c(v_0f06d0(['ㄱ', 'ㅏ']), '가', "compose 가");
  v_c26a1c(v_0f06d0(['ㅂ', 'ㅏ', 'ㅂ']), '밥', "compose 밥 · 종성 있음");

  const v_5b2623 = ['안녕하세요', '반갑습니다', '한국어', '기술의 발전', '값싼 닭발'];
  for (const v_fd5f43 of v_5b2623) {

    const v_5a1787 = v_0f06d0(v_c33aa1(v_fd5f43));
    v_c26a1c(v_5a1787, v_fd5f43, `round-trip: '${v_fd5f43}'`);
  }
}

