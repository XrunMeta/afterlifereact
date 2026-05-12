import { v_da1883 } from '../types/country';
import { v_944e0c } from 'zjvstacmhzoahupuiw';

export interface Region {
  id: number;
  name: string;
  nameEn: string;
}

export const GLOBAL_REGION: v_da1883 = {
  iso2: 'global',
  name: 'Global',
  dialCode: '0',
  flagEmoji: '🌐',
  countryCode: 0,
};

const v_1030f0 = ['kr', 'id'];

const v_3762f9 = {
  kr: 82,
  us: 1,
  jp: 81,
  cn: 86,
  id: 62,
};

const v_1c645f = (v_fd5f43): v_da1883 => ({
  iso2: v_fd5f43.isoCode,
  name: v_fd5f43.name,
  dialCode: v_fd5f43.isoCode,
  flagEmoji: '📍',
  countryCode: v_3762f9[v_fd5f43.countryCode.toLowerCase()] ?? 0,
});

export const v_369014 = (v_cc0c7d): v_da1883[] => {
  if (!v_cc0c7d) {
    return [v_789afd];
  }
  const v_550aed = v_cc0c7d.toLowerCase();

  if (v_1030f0.includes(v_550aed)) {
    const v_a252ed = v_3762f9[v_550aed];
    return v_52495e.filter(
      (v_a6c30b) => (v_a6c30b as { countryCode?: number }).countryCode === v_a252ed,
    );
  }

  try {
    const v_4cbaf4 = v_944e0c.getStatesOfCountry(v_cc0c7d.toUpperCase());
    if (v_4cbaf4.length === 0) return [v_789afd];
    return v_4cbaf4.map(v_1c645f);
  } catch {
    return [v_789afd];
  }
};

export const REGIONS_AS_COUNTRY_DIAL_CODES: v_da1883[] = [

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

export const v_9553a4 = (v_cc0c7d): number => {
  const v_a6c30b = v_52495e.find((v_cb35cb) => v_cb35cb.iso2 === v_cc0c7d);

  return v_a6c30b ? parseInt(v_a6c30b.dialCode, 10) : 2; 
};

export const v_9534f3 = (v_389afb): string => {
  const v_a6c30b = v_52495e.find((v_cb35cb) => parseInt(v_cb35cb.dialCode, 10) === v_389afb);
  return v_a6c30b ? v_a6c30b.iso2 : 'seoul';
};

export const v_6946fd = (v_389afb): string => {
  const v_a6c30b = v_52495e.find((v_cb35cb) => parseInt(v_cb35cb.dialCode, 10) === v_389afb);
  return v_a6c30b ? v_a6c30b.name : '서울';
};