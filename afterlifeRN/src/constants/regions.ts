import { CountryDialCode } from '../types/country';
import { State } from 'country-state-city';
import enRegions from '../locales/en/regions';

export interface Region {
  id: number;
  name: string;
  nameEn: string;
}

export const GLOBAL_REGION: CountryDialCode = {
  iso2: 'global',
  name: 'Global',
  dialCode: '0',
  flagEmoji: '🌐',
  countryCode: 0,
};

const PRIORITY_PHONE_CODES = new Set([1, 81, 82, 86, 62]);

const PRIORITY_REGIONS_BY_CC: Record<number, CountryDialCode[]> = (() => {
  const result: Record<number, CountryDialCode[]> = {};
  const data = enRegions as Record<string, string>;
  for (const [key, name] of Object.entries(data)) {
    const m = /^(\d+)_(\d+)$/.exec(key);
    if (!m) continue;
    const cc = parseInt(m[1], 10);
    if (!PRIORITY_PHONE_CODES.has(cc)) continue;
    const sub = m[2];
    if (!result[cc]) result[cc] = [];
    result[cc].push({
      iso2: `${cc}_${sub}`,
      name, 
      dialCode: sub,
      flagEmoji: '📍',
      countryCode: cc,
    });
  }

  for (const cc of Object.keys(result)) {
    result[Number(cc)].sort(
      (a, b) => parseInt(a.dialCode, 10) - parseInt(b.dialCode, 10),
    );
  }
  return result;
})();

const COUNTRY_PHONE_CODE: Record<string, number> = {
  kr: 82,
  us: 1,
  jp: 81,
  cn: 86,
  id: 62,
};

const toRegionFromState = (s: { name: string; isoCode: string; countryCode: string }): CountryDialCode => ({
  iso2: s.isoCode,
  name: s.name,
  dialCode: s.isoCode,
  flagEmoji: '📍',
  countryCode: COUNTRY_PHONE_CODE[s.countryCode.toLowerCase()] ?? 0,
});

export const getRegionsByCountryIso2 = (iso2?: string): CountryDialCode[] => {
  if (!iso2) return [GLOBAL_REGION];
  const lowerIso2 = iso2.toLowerCase();

  const cc = COUNTRY_PHONE_CODE[lowerIso2];
  if (cc && PRIORITY_REGIONS_BY_CC[cc]) {
    return PRIORITY_REGIONS_BY_CC[cc];
  }

  try {
    const states = State.getStatesOfCountry(iso2.toUpperCase());
    if (states.length === 0) return [GLOBAL_REGION];
    return states.map(toRegionFromState);
  } catch {
    return [GLOBAL_REGION];
  }
};

export const REGIONS_AS_COUNTRY_DIAL_CODES: CountryDialCode[] = [

  { iso2: '서울', name: '서울', dialCode: '2', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '경기도', name: '경기도', dialCode: '31', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '인천광역시', name: '인천광역시', dialCode: '32', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '강원도', name: '강원도', dialCode: '33', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '충청남도', name: '충청남도', dialCode: '41', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '대전광역시', name: '대전광역시', dialCode: '42', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '충청북도', name: '충청북도', dialCode: '43', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '세종특별자치시', name: '세종특별자치시', dialCode: '44', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '부산광역시', name: '부산광역시', dialCode: '51', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '울산광역시', name: '울산광역시', dialCode: '52', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '대구광역시', name: '대구광역시', dialCode: '53', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '경상북도', name: '경상북도', dialCode: '54', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '경상남도', name: '경상남도', dialCode: '55', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '전라남도', name: '전라남도', dialCode: '61', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '광주광역시', name: '광주광역시', dialCode: '62', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '전라북도', name: '전라북도', dialCode: '63', flagEmoji: '📍' , 'countryCode': 82},
  { iso2: '제주특별자치도', name: '제주특별자치도', dialCode: '64', flagEmoji: '📍' , 'countryCode': 82},
];

export const getRegionIdByIso2 = (iso2: string): number => {
  const region = REGIONS_AS_COUNTRY_DIAL_CODES.find((r) => r.iso2 === iso2);

  return region ? parseInt(region.dialCode, 10) : 2; 
};

export const getIso2ByRegionId = (id: number): string => {
  const region = REGIONS_AS_COUNTRY_DIAL_CODES.find((r) => parseInt(r.dialCode, 10) === id);
  return region ? region.iso2 : 'seoul';
};

export const getRegionNameById = (id: number): string => {
  const region = REGIONS_AS_COUNTRY_DIAL_CODES.find((r) => parseInt(r.dialCode, 10) === id);
  return region ? region.name : '서울';
};