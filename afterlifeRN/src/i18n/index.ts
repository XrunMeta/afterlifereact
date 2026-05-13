import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import koCommon from '../locales/ko/common.json';
import jaCommon from '../locales/ja/common.json';
import enCommon from '../locales/en/common.json';
import zhCnCommon from '../locales/zh-CN/common.json';
import idCommon from '../locales/id/common.json';

import koCountries from '../locales/ko/countries';
import jaCountries from '../locales/ja/countries';
import enCountries from '../locales/en/countries';
import zhCnCountries from '../locales/zh-CN/countries';
import idCountries from '../locales/id/countries';

import koRegions from '../locales/ko/regions';
import jaRegions from '../locales/ja/regions';
import enRegions from '../locales/en/regions';
import zhCnRegions from '../locales/zh-CN/regions';
import idRegions from '../locales/id/regions';

const LANGUAGE_STORAGE_KEY = 'afterlife_app_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

const resources = {
  ko: { common: koCommon, countries: koCountries, regions: koRegions },
  ja: { common: jaCommon, countries: jaCountries, regions: jaRegions },
  en: { common: enCommon, countries: enCountries, regions: enRegions },
  'zh-CN': { common: zhCnCommon, countries: zhCnCountries, regions: zhCnRegions },
  id: { common: idCommon, countries: idCountries, regions: idRegions },
};

const getSystemLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales.length > 0) {
    const langCode = locales[0].languageCode;

    if (langCode?.startsWith('zh')) {
      return 'zh-CN';
    }
    if (langCode && SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      return langCode;
    }
  }
  return 'ko'; 
};

const initializeI18n = async () => {
  try {

    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const defaultLanguage = savedLanguage ?? getSystemLanguage();

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: defaultLanguage,
        fallbackLng: 'ko',
        ns: ['common', 'countries', 'regions'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false, 
        },
      });
  } catch (error) {
    console.error('i18n initialization error:', error);

    await i18n
      .use(initReactI18next)
      .init({
        resources,
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

export const changeLanguage = async (languageCode: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (error) {
    console.error('Failed to change language:', error);

    await i18n.changeLanguage(languageCode);
  }
};

initializeI18n().catch(error => {
  console.error('Fatal i18n initialization error:', error);
});

export default i18n;
