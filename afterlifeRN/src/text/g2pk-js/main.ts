

import { decompose, compose } from './jamo';
import { link1, link2, link3, link4 } from './regular';
import {
  jyeo, ye, consonant_ui, josa_ui, vowel_ui, jamo,
  rieulgiyeok, rieulbieub, verb_nieun, balb, palatalize, modifying_rieul,
} from './special';
import { convert_num } from './numerals';
import { convert_eng, CmuDict } from './english';

export function applyIdioms(str: string, idioms: Array<[string, string]>): string {
  let out = str;
  for (const [str1, str2] of idioms) {
    out = out.replace(new RegExp(str1, 'g'), str2);
  }
  return out;
}

export type AnnotateFn = (str: string) => string;

export const annotateStub: AnnotateFn = (str) => str;

export function applyTableRules(str: string, rules: Array<[RegExp, string]>): string {
  let out = str;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function groupVowels(str: string): string {
  const pairs: [string, string][] = [
    ['ᅢ', 'ᅦ'], 
    ['ᅤ', 'ᅨ'], 
    ['ᅫ', 'ᅬ'], 
    ['ᅰ', 'ᅬ'], 
    ['ᅱ', 'ᅵ'], 
    ['ᅴ', 'ᅵ'], 
  ];
  let out = str;
  for (const [pattern, replacement] of pairs) {
    out = out.split(pattern).join(replacement);
  }
  return out;
}

export interface G2pOptions {

  descriptive?: boolean;

  groupVowels?: boolean;

  toSyl?: boolean;
}

export interface G2pResources {

  idioms?: Array<[string, string]>;

  tableRules?: Array<[RegExp, string]>;

  cmu?: CmuDict;

  annotate?: AnnotateFn;
}

export class G2p {
  private idioms: Array<[string, string]>;
  private tableRules: Array<[RegExp, string]>;
  private cmu: CmuDict;
  private annotate: AnnotateFn;

  constructor(res: G2pResources = {}) {
    this.idioms = res.idioms ?? [];
    this.tableRules = res.tableRules ?? [];
    this.cmu = res.cmu ?? {};
    this.annotate = res.annotate ?? annotateStub;
  }

  run(str: string, opts: G2pOptions = {}): string {
    const descriptive = opts.descriptive ?? false;
    const groupVowelsOpt = opts.groupVowels ?? false;
    const toSyl = opts.toSyl ?? true;

    let out = applyIdioms(str, this.idioms);

    out = convert_eng(out, this.cmu);

    out = this.annotate(out);

    out = convert_num(out);

    out = decompose(out);

    out = jyeo(out);
    out = ye(out, descriptive);
    out = consonant_ui(out);
    out = josa_ui(out, descriptive);
    out = vowel_ui(out, descriptive);
    out = jamo(out);
    out = rieulgiyeok(out);
    out = rieulbieub(out);
    out = verb_nieun(out);
    out = balb(out);
    out = palatalize(out);
    out = modifying_rieul(out);

    out = out.replace(/\/[PJEB]/g, '');

    out = applyTableRules(out, this.tableRules);

    out = link1(out);
    out = link2(out);
    out = link3(out);
    out = link4(out);

    if (groupVowelsOpt) out = groupVowels(out);
    if (toSyl) out = compose(out);

    return out;
  }
}
