

import { v_c33aa1, v_0f06d0 } from './jamo';
import { v_2ec098, v_9dd85e, v_f63d0d, v_0992d4 } from './regular';
import {
  v_2471e7, v_67bde0, v_15303b, v_4b72fc, v_506635, v_2a7e6c,
  v_0a3d58, v_d02757, v_64bb73, v_cf4513, v_272869, v_4cc7dd,
} from './special';
import { v_9da465 } from './numerals';
import { v_794867, v_02c3ed } from './english';

export function v_9adfd1(v_fba864, v_cb96d4): string {
  let v_8d4337 = v_fba864;
  for (const [v_c801cd, v_b17e19] of v_cb96d4) {
    v_8d4337 = v_8d4337.replace(new RegExp(v_c801cd, 'g'), v_b17e19);
  }
  return v_8d4337;
}

export type AnnotateFn = (str: string) => string;

export const v_d6fdc8 = (v_fba864) => v_fba864;

export function v_b89ad5(v_fba864, v_ddf1dc): string {
  let v_8d4337 = v_fba864;
  for (const [v_2b8b40, v_4a36a4] of v_ddf1dc) {
    v_8d4337 = v_8d4337.replace(v_2b8b40, v_4a36a4);
  }
  return v_8d4337;
}

export function v_dc8922(v_fba864): string {
  const v_015ea2 = [
    ['ᅢ', 'ᅦ'], 
    ['ᅤ', 'ᅨ'], 
    ['ᅫ', 'ᅬ'], 
    ['ᅰ', 'ᅬ'], 
    ['ᅱ', 'ᅵ'], 
    ['ᅴ', 'ᅵ'], 
  ];
  let v_8d4337 = v_fba864;
  for (const [v_2b8b40, v_4a36a4] of v_015ea2) {
    v_8d4337 = v_8d4337.split(v_2b8b40).join(v_4a36a4);
  }
  return v_8d4337;
}

export interface G2pOptions {

  descriptive?: boolean;

  groupVowels?: boolean;

  toSyl?: boolean;
}

export interface G2pResources {

  idioms?: Array<[string, string]>;

  tableRules?: Array<[RegExp, string]>;

  cmu?: v_02c3ed;

  annotate?: AnnotateFn;
}

export class v_a7c9ca {
  private idioms: Array<[string, string]>;
  private tableRules: Array<[RegExp, string]>;
  private cmu: v_02c3ed;
  private annotate: AnnotateFn;

  constructor(v_8f00b9 = {}) {
    this.idioms = v_8f00b9.idioms ?? [];
    this.tableRules = v_8f00b9.tableRules ?? [];
    this.cmu = v_8f00b9.cmu ?? {};
    this.annotate = v_8f00b9.annotate ?? v_d6fdc8;
  }

  run(v_fba864, v_328259 = {}): string {
    const v_8aa332 = v_328259.descriptive ?? false;
    const v_59c67b = v_328259.groupVowels ?? false;
    const v_0991eb = v_328259.toSyl ?? true;

    let v_8d4337 = v_9adfd1(v_fba864, this.idioms);

    v_8d4337 = v_794867(v_8d4337, this.cmu);

    v_8d4337 = this.annotate(v_8d4337);

    v_8d4337 = v_9da465(v_8d4337);

    v_8d4337 = v_c33aa1(v_8d4337);

    v_8d4337 = v_2471e7(v_8d4337);
    v_8d4337 = v_67bde0(v_8d4337, v_8aa332);
    v_8d4337 = v_15303b(v_8d4337);
    v_8d4337 = v_4b72fc(v_8d4337, v_8aa332);
    v_8d4337 = v_506635(v_8d4337, v_8aa332);
    v_8d4337 = v_2a7e6c(v_8d4337);
    v_8d4337 = v_0a3d58(v_8d4337);
    v_8d4337 = v_d02757(v_8d4337);
    v_8d4337 = v_64bb73(v_8d4337);
    v_8d4337 = v_cf4513(v_8d4337);
    v_8d4337 = v_272869(v_8d4337);
    v_8d4337 = v_4cc7dd(v_8d4337);

    v_8d4337 = v_8d4337.replace(/\/[PJEB]/g, '');

    v_8d4337 = v_b89ad5(v_8d4337, this.tableRules);

    v_8d4337 = v_2ec098(v_8d4337);
    v_8d4337 = v_9dd85e(v_8d4337);
    v_8d4337 = v_f63d0d(v_8d4337);
    v_8d4337 = v_0992d4(v_8d4337);

    if (v_59c67b) v_8d4337 = v_dc8922(v_8d4337);
    if (v_0991eb) v_8d4337 = v_0f06d0(v_8d4337);

    return v_8d4337;
  }
}
