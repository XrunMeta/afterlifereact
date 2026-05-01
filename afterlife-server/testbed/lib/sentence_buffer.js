

const v_ee328b = 4;
const v_c9c433 = 30;

const v_e3e3fa = /([^.!?。…,、\n]+[.!?。…,、]+["')\]」』]?)/u;

export function v_cdb49a({ minLen: v_7a8336 = v_ee328b, forceFlush: v_c471e6 = v_c9c433 } = {}) {
  let v_83ee53 = '';
  return {
    feed(v_334f63) {
      if (typeof v_334f63 !== 'string' || !v_334f63) return [];
      v_83ee53 += v_334f63;
      const v_8d4337 = [];

      while (true) {
        const v_35f85c = v_83ee53.match(v_e3e3fa);
        if (!v_35f85c) break;
        const v_7c9ca7 = v_35f85c[1].trim();
        if (v_7c9ca7.length >= v_7a8336) {
          v_8d4337.push(v_7c9ca7);
          v_83ee53 = v_83ee53.slice(v_35f85c.index + v_35f85c[0].length);
        } else {

          break;
        }
      }

      if (v_83ee53.length >= v_c471e6) {
        const v_4df6b8 = v_83ee53.lastIndexOf(',', v_c471e6);
        const v_2ce5ed = v_83ee53.lastIndexOf(' ', v_c471e6);
        const v_765ca3 = Math.max(v_4df6b8, v_2ce5ed);
        if (v_765ca3 > v_7a8336) {
          const v_b222ea = v_83ee53.slice(0, v_765ca3 + 1).trim();
          if (v_b222ea) v_8d4337.push(v_b222ea);
          v_83ee53 = v_83ee53.slice(v_765ca3 + 1);
        } else {

          const v_b222ea = v_83ee53.slice(0, v_c471e6).trim();
          if (v_b222ea) v_8d4337.push(v_b222ea);
          v_83ee53 = v_83ee53.slice(v_c471e6);
        }
      }

      return v_8d4337;
    },
    flush() {
      const v_916658 = v_83ee53.trim();
      v_83ee53 = '';
      return v_916658 ? [v_916658] : [];
    },
    peek() {
      return v_83ee53;
    },
    reset() {
      v_83ee53 = '';
    },
  };
}
