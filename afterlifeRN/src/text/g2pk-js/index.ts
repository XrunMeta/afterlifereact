

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

export { convert_eng, type CmuDict } from './english';

export { adjust, to_choseong, to_jungseong, to_jongseong, reconstruct } from './arpabet';

export {
  G2p,
  applyIdioms,
  applyTableRules,
  groupVowels,
  annotateStub,
  type G2pOptions,
  type G2pResources,
  type AnnotateFn,
} from './main';

export { loadIdioms, loadTableRules, loadCmuDict } from './data-loader';

export { annotate } from './annotator';

import { G2p as _G2p } from './main';
import {
  loadIdioms as _loadIdioms,
  loadTableRules as _loadTableRules,
  loadCmuDict as _loadCmuDict,
} from './data-loader';
import { annotate as _annotate } from './annotator';
import { CmuDict } from './english';
import { AnnotateFn } from './main';

export function createG2p(opts: {
  cmu?: CmuDict;
  annotate?: AnnotateFn;
  loadCmu?: boolean;
} = {}): _G2p {
  const shouldLoadCmu = opts.loadCmu !== false;
  return new _G2p({
    idioms: _loadIdioms(),
    tableRules: _loadTableRules(),
    cmu: opts.cmu ?? (shouldLoadCmu ? _loadCmuDict() : undefined),
    annotate: opts.annotate ?? _annotate,
  });
}
