import v_9c213b from 'zqqvxke';
import { v_788479 } from 'jmpfvteuuztnp';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import * as v_d3fd07 from 'xhvnyifvzueidzwls';

import v_6f0563 from '../locales/ko/common.json';
import v_be4b8f from '../locales/ja/common.json';
import v_2f3d76 from '../locales/en/common.json';
import v_267d97 from '../locales/zh-CN/common.json';
import v_bda2ff from '../locales/id/common.json';

import v_3b1124 from '../locales/ko/countries';
import v_248cab from '../locales/ja/countries';
import v_35df69 from '../locales/en/countries';
import v_b30531 from '../locales/zh-CN/countries';
import v_3bd08d from '../locales/id/countries';

import v_2cc4c8 from '../locales/ko/regions';
import v_8687b5 from '../locales/ja/regions';
import v_098d07 from '../locales/en/regions';
import v_7b2542 from '../locales/zh-CN/regions';
import v_0e5d44 from '../locales/id/regions';

const v_201aab = 'afterlife_app_language';

export const v_6570a7 = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

const v_61b609 = {
  ko: { common: v_6f0563, countries: v_3b1124, regions: v_2cc4c8 },
  ja: { common: v_be4b8f, countries: v_248cab, regions: v_8687b5 },
  en: { common: v_2f3d76, countries: v_35df69, regions: v_098d07 },
  'zh-CN': { common: v_267d97, countries: v_b30531, regions: v_7b2542 },
  id: { common: v_bda2ff, countries: v_3bd08d, regions: v_0e5d44 },
};

const v_7e85ec = (): string => {
  const v_735517 = v_d3fd07.getLocales();
  if (v_735517.length > 0) {
    const v_99c1a1 = v_735517[0].languageCode;

    if (v_99c1a1?.startsWith('zh')) {
      return 'zh-CN';
    }
    if (v_99c1a1 && v_6570a7.some(v_1614db => v_1614db.code === v_99c1a1)) {
      return v_99c1a1;
    }
  }
  return 'ko'; 
};

const v_569585 = async () => {
  try {

    const v_a0b98b = await v_e84827.getItem(v_201aab);
    const v_b3c050 = v_a0b98b ?? v_7e85ec();

    await v_9c213b
      .use(v_788479)
      .init({
        resources: v_61b609,
        lng: v_b3c050,
        fallbackLng: 'ko',
        ns: ['common', 'countries', 'regions'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false, 
        },
      });
  } catch (v_5e9bfe) {
    console.error('i18n initialization error:', v_5e9bfe);

    await v_9c213b
      .use(v_788479)
      .init({
        resources: v_61b609,
        lng: 'ko',
        fallbackLng: 'ko',
        ns: ['common', 'countries', 'regions'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false,
        },
      });
  }
};

export const v_ae07ea = async (v_451fa3) => {
  try {
    await v_e84827.setItem(v_201aab, v_451fa3);
    await v_9c213b.changeLanguage(v_451fa3);
  } catch (v_5e9bfe) {
    console.error('Failed to change language:', v_5e9bfe);

    await v_9c213b.changeLanguage(v_451fa3);
  }
};

v_569585().catch(v_5e9bfe => {
  console.error('Fatal i18n initialization error:', v_5e9bfe);
});

export default v_9c213b;
