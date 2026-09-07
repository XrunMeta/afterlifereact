

import { createG2p } from '../index';

const expected: Record<string, string> = require('./g2p_test_expected.json');

export function runIntegrationTests(): void {
  const g2p = createG2p();
  let pass = 0;
  let fail = 0;
  const diffs: Array<{ input: string; expected: string; actual: string }> = [];

  for (const [input, exp] of Object.entries(expected)) {
    const raw = g2p.run(input);

    const actual = raw.normalize('NFC');
    const expNorm = exp.normalize('NFC');
    if (actual === expNorm) {
      pass++;
      console.log(`PASS ${JSON.stringify(input)} → ${JSON.stringify(actual)}`);
    } else {
      fail++;
      diffs.push({ input, expected: expNorm, actual });
      console.log(`FAIL ${JSON.stringify(input)}`);
      console.log(`  expected: ${JSON.stringify(expNorm)} (${[...expNorm].map((c) => c.codePointAt(0)!.toString(16)).join(' ')})`);
      console.log(`  actual:   ${JSON.stringify(actual)} (${[...actual].map((c) => c.codePointAt(0)!.toString(16)).join(' ')})`);
    }
  }

  console.log(`\n=== ${pass} pass · ${fail} fail (총 ${pass + fail}) ===`);

  if (diffs.length > 0) {
    console.log('\n(mecab 없으면 경음화·사잇소리 규칙은 통과 못 함 예상)');
  }
}

if (typeof require !== 'undefined' && require.main === (module as any)) {
  runIntegrationTests();
}
