

import { adjust, to_choseong, to_jungseong, to_jongseong, reconstruct } from './arpabet';
import { compose } from './jamo';

export type CmuDict = Record<string, string[]>;

const SHORT_VOWELS = new Set(['AE', 'AH', 'AX', 'EH', 'IH', 'IX', 'UH']);
const VOWELS = 'AEIOUY';
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXZ';
const SYLLABLE_FINAL_OR_CONSONANTS = '$BCDFGHJKLMNPQRSTVWXZ';

export function convert_eng(str: string, cmu: CmuDict): string {
  let out = str;
  const englishWords = new Set<string>();
  const matches = str.matchAll(/[A-Za-z']+/g);
  for (const match of matches) {
    englishWords.add(match[0]);
  }

  for (const engWord of englishWords) {
    const word = engWord.toLowerCase();
    if (!(word in cmu)) continue;

    const arpabets = cmu[word];
    const phonemes = adjust(arpabets);
    let ret = '';

    for (let i = 0; i < phonemes.length; i++) {
      const p = phonemes[i];
      const pPrev = i > 0 ? phonemes[i - 1] : '^';
      const pNext = i < phonemes.length - 1 ? phonemes[i + 1] : '$';
      const pNext2 = i < phonemes.length - 2 ? phonemes[i + 1] : '$';

      if ('PTK'.includes(p)) {

        if (SHORT_VOWELS.has(pPrev.slice(0, 2)) && pNext === '$') {
          ret += to_jongseong(p);
        } else if (SHORT_VOWELS.has(pPrev.slice(0, 2)) && !'AEIOULRMN'.includes(pNext[0])) {
          ret += to_jongseong(p);
        } else if ('$BCDFGHJKLMNPQRSTVWXYZ'.includes(pNext[0])) {
          ret += to_choseong(p);
          ret += 'ᅳ';
        } else {
          ret += to_choseong(p);
        }
      } else if ('BDG'.includes(p)) {

        ret += to_choseong(p);
        if (SYLLABLE_FINAL_OR_CONSONANTS.includes(pNext[0])) {
          ret += 'ᅳ';
        }
      } else if (['S', 'Z', 'F', 'V', 'TH', 'DH', 'SH', 'ZH'].includes(p)) {

        ret += to_choseong(p);
        if (['S', 'Z', 'F', 'V', 'TH', 'DH'].includes(p)) {
          if (SYLLABLE_FINAL_OR_CONSONANTS.includes(pNext[0])) {
            ret += 'ᅳ';
          }
        } else if (p === 'SH') {
          if (pNext[0] === '$') {
            ret += 'ᅵ';
          } else if (CONSONANTS.includes(pNext[0])) {
            ret += 'ᅲ';
          } else {
            ret += 'Y';
          }
        } else if (p === 'ZH') {
          if (SYLLABLE_FINAL_OR_CONSONANTS.includes(pNext[0])) {
            ret += 'ᅵ';
          }
        }
      } else if (['TS', 'DZ', 'CH', 'JH'].includes(p)) {

        ret += to_choseong(p);
        if (SYLLABLE_FINAL_OR_CONSONANTS.includes(pNext[0])) {
          if (['TS', 'DZ'].includes(p)) {
            ret += 'ᅳ';
          } else {
            ret += 'ᅵ';
          }
        }
      } else if (['M', 'N', 'NG'].includes(p)) {

        if ('MN'.includes(p) && VOWELS.includes(pNext[0])) {
          ret += to_choseong(p);
        } else {
          ret += to_jongseong(p);
        }
      } else if (p === 'L') {

        if (pPrev === '^') {
          ret += to_choseong(p);
        } else if ('$BCDFGHJKLPQRSTVWXZ'.includes(pNext[0])) {
          ret += to_jongseong(p);
        } else if ('MN'.includes(pPrev)) {
          ret += to_choseong(p);
        } else if (VOWELS.includes(pNext[0])) {
          ret += 'ᆯᄅ';
        } else if ('MN'.includes(pNext) && !VOWELS.includes(pNext2[0])) {
          ret += 'ᆯ르';
        }
      } else if (p === 'ER') {
        if (VOWELS.includes(pPrev[0])) {
          ret += 'ᄋ';
        }
        ret += to_jungseong(p);
        if (VOWELS.includes(pNext[0])) {
          ret += 'ᄅ';
        }
      } else if (p === 'R') {
        if (VOWELS.includes(pNext[0])) {
          ret += to_choseong(p);
        }
      } else if ('AEIOU'.includes(p[0])) {

        ret += to_jungseong(p);
      } else {
        ret += to_choseong(p);
      }
    }

    ret = reconstruct(ret);
    ret = compose(ret);
    ret = ret.replace(/[ᄀ-ᇿ]/g, ''); 
    out = out.split(engWord).join(ret);
  }

  return out;
}
