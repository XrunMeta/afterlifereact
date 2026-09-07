

export {
  h2j,
  j2h,
  decompose,
  compose,
  toCompat,
  isHangul,
  isCompatJamo,
  CHO_JAMO,
  JUNG_JAMO,
  JONG_JAMO,
} from './jamo';

export { link1, link2, link3, link4 } from './regular';

export {
  jyeo,
  ye,
  consonant_ui,
  josa_ui,
  vowel_ui,
  jamo,
  rieulgiyeok,
  rieulbieub,
  verb_nieun,
  balb,
  palatalize,
  modifying_rieul,
} from './special';

export { process_num, convert_num } from './numerals';

export { convert_eng, type v_02c3ed } from './english';

export { adjust, to_choseong, to_jungseong, to_jongseong, reconstruct } from './arpabet';

export {
  G2p,
  applyIdioms,
  applyTableRules,
  groupVowels,
  annotateStub,
  type G2pOptions,
  type G2pResources,
  type v_1095a8,
} from './main';

export { loadIdioms, loadTableRules, loadCmuDict } from './data-loader';

export { annotate } from './annotator';

import { v_a7c9ca as v_2947ee } from './main';
import {
  v_d06d66 as v_f2e72c,
  v_edf14a as v_f24f86,
  v_80f90d as v_6ec11a,
} from './data-loader';
import { v_5949f4 as v_c864eb } from './annotator';
import { v_02c3ed } from './english';
import { v_1095a8 } from './main';

export function v_be46cf(opts: {
  cmu?: v_02c3ed;
  annotate?: v_1095a8;
  loadCmu?: boolean;
} = {}): v_2947ee {
  const v_56b25b = v_328259.loadCmu !== false;
  return new v_2947ee({
    idioms: v_f2e72c(),
    tableRules: v_f24f86(),
    cmu: v_328259.cmu ?? (v_56b25b ? v_6ec11a() : undefined),
    annotate: v_328259.annotate ?? v_c864eb,
  });
}
