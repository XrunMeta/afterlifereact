

import { h2j, j2h, decompose, compose, isHangul } from '../jamo';

function assertEq<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${msg}: got ${a} · expected ${e}`);
  } else {
    console.log(`PASS ${msg}`);
  }
}

export function runJamoTests(): void {

  assertEq(isHangul('가'), true, "isHangul('가')");
  assertEq(isHangul('힣'), true, "isHangul('힣')");
  assertEq(isHangul('A'), false, "isHangul('A')");
  assertEq(isHangul('ㄱ'), false, "isHangul('ㄱ') · 호환자모");

  assertEq(h2j('가'), ['ㄱ', 'ㅏ', ''], "h2j('가')");
  assertEq(h2j('나'), ['ㄴ', 'ㅏ', ''], "h2j('나')");
  assertEq(h2j('힣'), ['ㅎ', 'ㅣ', 'ㅎ'], "h2j('힣')");

  assertEq(h2j('밥'), ['ㅂ', 'ㅏ', 'ㅂ'], "h2j('밥')");
  assertEq(h2j('안'), ['ㅇ', 'ㅏ', 'ㄴ'], "h2j('안')");
  assertEq(h2j('녕'), ['ㄴ', 'ㅕ', 'ㅇ'], "h2j('녕')");

  assertEq(h2j('닭'), ['ㄷ', 'ㅏ', 'ㄺ'], "h2j('닭')");
  assertEq(h2j('값'), ['ㄱ', 'ㅏ', 'ㅄ'], "h2j('값')");

  assertEq(h2j('A'), null, "h2j('A')");
  assertEq(h2j('!'), null, "h2j('!')");

  assertEq(j2h('ㄱ', 'ㅏ'), '가', "j2h('ㄱ','ㅏ')");
  assertEq(j2h('ㅂ', 'ㅏ', 'ㅂ'), '밥', "j2h('ㅂ','ㅏ','ㅂ')");
  assertEq(j2h('ㅎ', 'ㅣ', 'ㅎ'), '힣', "j2h('ㅎ','ㅣ','ㅎ')");
  assertEq(j2h('ㄷ', 'ㅏ', 'ㄺ'), '닭', "j2h('ㄷ','ㅏ','ㄺ')");

  assertEq(decompose('안녕'), ['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ'], "decompose('안녕')");
  assertEq(
    decompose('안녕!'),
    ['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ', '!'],
    "decompose('안녕!')",
  );
  assertEq(decompose('가'), ['ㄱ', 'ㅏ'], "decompose('가') · 종성 없음");

  assertEq(compose(['ㅇ', 'ㅏ', 'ㄴ', 'ㄴ', 'ㅕ', 'ㅇ']), '안녕', "compose 안녕");
  assertEq(compose(['ㄱ', 'ㅏ']), '가', "compose 가");
  assertEq(compose(['ㅂ', 'ㅏ', 'ㅂ']), '밥', "compose 밥 · 종성 있음");

  const samples = ['안녕하세요', '반갑습니다', '한국어', '기술의 발전', '값싼 닭발'];
  for (const s of samples) {

    const round = compose(decompose(s));
    assertEq(round, s, `round-trip: '${s}'`);
  }
}

