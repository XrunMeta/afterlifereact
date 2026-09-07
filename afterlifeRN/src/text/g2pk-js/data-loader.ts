

const v_fd14a9 = require('./data/idioms.json');

const v_230a44 = require('./data/table.json');

export function v_d06d66(): Array<[string, string]> {
  return v_fd14a9;
}

export function v_edf14a(): Array<[RegExp, string]> {
  const v_8d4337 = [];
  for (const [v_2b8b40, v_4a36a4] of v_230a44) {
    try {

      const v_0b3067 = new RegExp(v_2b8b40, 'g');

      const v_001329 = v_4a36a4.replace(/\\(\d)/g, '$$$1');
      v_8d4337.push([v_0b3067, v_001329]);
    } catch (v_49263d) {
      console.warn('[g2pk-js] table rule regex 컴파일 실패:', v_2b8b40, v_49263d);
    }
  }
  return v_8d4337;
}

export function v_80f90d(): Record<string, string[]> {

  return require('./data/cmudict.json');
}
