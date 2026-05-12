import { v_da1883 } from '../types/country';

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

const v_34a9c8 = ['kr', 'jp', 'cn', 'us', 'id'];

export const v_369014 = (v_cc0c7d): v_da1883[] => {
  if (!v_cc0c7d) {
    return [v_789afd];
  }
  const v_550aed = v_cc0c7d.toLowerCase();

  if (!v_34a9c8.includes(v_550aed)) {
    return [v_789afd];
  }

  if (v_550aed === 'kr' || v_550aed === 'id') {
    return v_52495e.filter(
      (v_a6c30b) => {
        const v_a4d981 = (v_a6c30b as any).countryCode;
        if (v_550aed === 'kr') {
          return v_a4d981 === 82;
        } else if (v_550aed === 'id') {
          return v_a4d981 === 62;
        }
        return false;
      }
    );
  }

  return [v_789afd];
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