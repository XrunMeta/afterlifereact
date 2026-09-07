

import { v_be46cf } from '../index';

const v_505a6d = require('./g2p_test_expected.json');

export function v_70ec90(): void {
  const v_45429a = v_be46cf();
  let v_6f0b0c = 0;
  let v_d5bb0f = 0;
  const v_df0060 = [];

  for (const [v_bbda62, v_f900a6] of Object.entries(v_505a6d)) {
    const v_479f05 = v_45429a.run(v_bbda62);

    const v_61a388 = v_479f05.normalize('NFC');
    const v_90a771 = v_f900a6.normalize('NFC');
    if (v_61a388 === v_90a771) {
      v_6f0b0c++;
      console.log(`PASS ${JSON.stringify(v_bbda62)} → ${JSON.stringify(v_61a388)}`);
    } else {
      v_d5bb0f++;
      v_df0060.push({ input: v_bbda62, expected: v_90a771, actual: v_61a388 });
      console.log(`FAIL ${JSON.stringify(v_bbda62)}`);
      console.log(`  expected: ${JSON.stringify(v_90a771)} (${[...v_90a771].map((v_3f4e2e) => v_3f4e2e.codePointAt(0)!.toString(16)).join(' ')})`);
      console.log(`  actual:   ${JSON.stringify(v_61a388)} (${[...v_61a388].map((v_3f4e2e) => v_3f4e2e.codePointAt(0)!.toString(16)).join(' ')})`);
    }
  }

  console.log(`\n=== ${v_6f0b0c} pass · ${v_d5bb0f} fail (총 ${v_6f0b0c + v_d5bb0f}) ===`);

  if (v_df0060.length > 0) {
    console.log('\n(mecab 없으면 경음화·사잇소리 규칙은 통과 못 함 예상)');
  }
}

if (typeof require !== 'undefined' && require.main === (module as any)) {
  v_70ec90();
}
