

import { v_1ce372, v_9c81de, v_b0e4ea, v_f5d721, v_f130c3 } from './arpabet';
import { v_0f06d0 } from './jamo';

export type CmuDict = Record<string, string[]>;

const v_7df968 = new Set(['AE', 'AH', 'AX', 'EH', 'IH', 'IX', 'UH']);
const v_e6424c = 'AEIOUY';
const v_056587 = 'BCDFGHJKLMNPQRSTVWXZ';
const v_374e42 = '$BCDFGHJKLMNPQRSTVWXZ';

export function v_794867(v_fba864, v_3b1b92): string {
  let v_8d4337 = v_fba864;
  const v_f4599f = new Set<string>();
  const v_a49907 = v_fba864.matchAll(/[A-Za-z']+/g);
  for (const v_a63110 of v_a49907) {
    v_f4599f.add(v_a63110[0]);
  }

  for (const v_8267b2 of v_f4599f) {
    const v_e930c0 = v_8267b2.toLowerCase();
    if (!(v_e930c0 in v_3b1b92)) continue;

    const v_1ffa92 = v_3b1b92[v_e930c0];
    const v_ca4687 = v_1ce372(v_1ffa92);
    let v_6636da = '';

    for (let v_ebec57 = 0; v_ebec57 < v_ca4687.length; v_ebec57++) {
      const v_e2a85c = v_ca4687[v_ebec57];
      const v_7a430e = v_ebec57 > 0 ? v_ca4687[v_ebec57 - 1] : '^';
      const v_47f8e0 = v_ebec57 < v_ca4687.length - 1 ? v_ca4687[v_ebec57 + 1] : '$';
      const v_6fbe70 = v_ebec57 < v_ca4687.length - 2 ? v_ca4687[v_ebec57 + 1] : '$';

      if ('PTK'.includes(v_e2a85c)) {

        if (v_7df968.has(v_7a430e.slice(0, 2)) && v_47f8e0 === '$') {
          v_6636da += v_f5d721(v_e2a85c);
        } else if (v_7df968.has(v_7a430e.slice(0, 2)) && !'AEIOULRMN'.includes(v_47f8e0[0])) {
          v_6636da += v_f5d721(v_e2a85c);
        } else if ('$BCDFGHJKLMNPQRSTVWXYZ'.includes(v_47f8e0[0])) {
          v_6636da += v_9c81de(v_e2a85c);
          v_6636da += 'ᅳ';
        } else {
          v_6636da += v_9c81de(v_e2a85c);
        }
      } else if ('BDG'.includes(v_e2a85c)) {

        v_6636da += v_9c81de(v_e2a85c);
        if (v_374e42.includes(v_47f8e0[0])) {
          v_6636da += 'ᅳ';
        }
      } else if (['S', 'Z', 'F', 'V', 'TH', 'DH', 'SH', 'ZH'].includes(v_e2a85c)) {

        v_6636da += v_9c81de(v_e2a85c);
        if (['S', 'Z', 'F', 'V', 'TH', 'DH'].includes(v_e2a85c)) {
          if (v_374e42.includes(v_47f8e0[0])) {
            v_6636da += 'ᅳ';
          }
        } else if (v_e2a85c === 'SH') {
          if (v_47f8e0[0] === '$') {
            v_6636da += 'ᅵ';
          } else if (v_056587.includes(v_47f8e0[0])) {
            v_6636da += 'ᅲ';
          } else {
            v_6636da += 'Y';
          }
        } else if (v_e2a85c === 'ZH') {
          if (v_374e42.includes(v_47f8e0[0])) {
            v_6636da += 'ᅵ';
          }
        }
      } else if (['TS', 'DZ', 'CH', 'JH'].includes(v_e2a85c)) {

        v_6636da += v_9c81de(v_e2a85c);
        if (v_374e42.includes(v_47f8e0[0])) {
          if (['TS', 'DZ'].includes(v_e2a85c)) {
            v_6636da += 'ᅳ';
          } else {
            v_6636da += 'ᅵ';
          }
        }
      } else if (['M', 'N', 'NG'].includes(v_e2a85c)) {

        if ('MN'.includes(v_e2a85c) && v_e6424c.includes(v_47f8e0[0])) {
          v_6636da += v_9c81de(v_e2a85c);
        } else {
          v_6636da += v_f5d721(v_e2a85c);
        }
      } else if (v_e2a85c === 'L') {

        if (v_7a430e === '^') {
          v_6636da += v_9c81de(v_e2a85c);
        } else if ('$BCDFGHJKLPQRSTVWXZ'.includes(v_47f8e0[0])) {
          v_6636da += v_f5d721(v_e2a85c);
        } else if ('MN'.includes(v_7a430e)) {
          v_6636da += v_9c81de(v_e2a85c);
        } else if (v_e6424c.includes(v_47f8e0[0])) {
          v_6636da += 'ᆯᄅ';
        } else if ('MN'.includes(v_47f8e0) && !v_e6424c.includes(v_6fbe70[0])) {
          v_6636da += 'ᆯ르';
        }
      } else if (v_e2a85c === 'ER') {
        if (v_e6424c.includes(v_7a430e[0])) {
          v_6636da += 'ᄋ';
        }
        v_6636da += v_b0e4ea(v_e2a85c);
        if (v_e6424c.includes(v_47f8e0[0])) {
          v_6636da += 'ᄅ';
        }
      } else if (v_e2a85c === 'R') {
        if (v_e6424c.includes(v_47f8e0[0])) {
          v_6636da += v_9c81de(v_e2a85c);
        }
      } else if ('AEIOU'.includes(v_e2a85c[0])) {

        v_6636da += v_b0e4ea(v_e2a85c);
      } else {
        v_6636da += v_9c81de(v_e2a85c);
      }
    }

    v_6636da = v_f130c3(v_6636da);
    v_6636da = v_0f06d0(v_6636da);
    v_6636da = v_6636da.replace(/[ᄀ-ᇿ]/g, ''); 
    v_8d4337 = v_8d4337.split(v_8267b2).join(v_6636da);
  }

  return v_8d4337;
}
