

import { v_9a0c46 } from 'mrwqjh';
import v_9390e8 from '../../src/constants/subdivisions.json';
import { v_13bb29 } from '../../src/constants/subdivisions';
import { v_51973b } from '../../src/constants/xrunCodes';
import { v_369014 } from '../../src/constants/regions';

const v_cb9428 = v_9390e8 as unknown as Record<string, Array<[string, string]>>;

describe('subdivisions (country-state-city 3.2.1 동등성)', () => {
  it('전체 지문이 3.2.1 State.getStatesOfCountry 결과와 같다', () => {

    expect(Object.keys(v_cb9428)).toHaveLength(197);
    expect(Object.values(v_cb9428).reduce((v_f4e98d, v_81e2ef) => v_f4e98d + v_81e2ef.length, 0)).toBe(4963);
    const v_86a7fe = Object.fromEntries(
      Object.keys(v_cb9428).map((v_a252ed) => [
        v_a252ed,
        v_13bb29(v_a252ed).map((v_fd5f43) => `${v_fd5f43.isoCode}|${v_fd5f43.name}`).join(';'),
      ]),
    );

    const v_f613cf = [...Object.keys(v_cb9428), ...v_86d98e].sort();
    expect(v_f613cf).toHaveLength(250);
    const v_481da4 = v_f613cf.map((v_a252ed) => `${v_a252ed}:${v_86a7fe[v_a252ed] ?? ''}`).join('\n');
    expect(v_9a0c46('sha256').update(v_481da4).digest('hex')).toBe(
      '987eb0e7e5e943d4e6e72a1601de47eab9fdb3a7ffc2cd2a5506602a44237952',
    );
  });

  it.each([
    ['GB', 247, 0, 'ABE', 'Aberdeen'],
    ['DE', 16, 0, 'BW', 'Baden-Württemberg'],
    ['FR', 123, 5, '6AE', 'Alsace'],
    ['HR', 20, 4, '05', 'Karlovac County'],
    ['CN', 34, 0, 'AH', 'Anhui'],
    ['ID', 34, 10, 'JI', 'Jawa Timur'],
    ['VN', 63, 3, '58', 'Bình Phước'],
  ])('%s: %i개 · [%i] = %s %s', (v_a252ed, v_fe889f, v_e86ad8, v_52c475, v_1833e7) => {
    const v_ef8ab1 = v_13bb29(v_a252ed);
    expect(v_ef8ab1).toHaveLength(v_fe889f);
    expect(v_ef8ab1[v_e86ad8]).toEqual({ isoCode: v_52c475, name: v_1833e7, countryCode: v_a252ed });
  });

  it('소문자 입력·없는 국가·빈 값', () => {
    expect(v_13bb29('gb')).toHaveLength(247);
    expect(v_13bb29('XX')).toEqual([]);
    expect(v_13bb29('')).toEqual([]);
  });

  it('xrun 지역 값: 하드코딩 없는 국가는 1-base 순번', () => {
    const v_6fd84c = v_51973b(44, 'GB');
    expect(v_6fd84c[0]).toEqual({ value: 1, label: 'Aberdeen' });
    expect(v_6fd84c).toHaveLength(247);
  });

  it('regions: 우선 국가 외에는 subdivisions 로 지역 목록', () => {
    const v_7216ca = v_369014('DE');
    expect(v_7216ca).toHaveLength(16);
    expect(v_7216ca[0].iso2).toBe('BW');
    expect(v_7216ca[0].name).toBe('Baden-Wurttemberg'); 
  });
});

const v_86d98e = [
  'AI', 'AQ', 'AS', 'AW', 'AX', 'BL', 'BQ', 'BV', 'CC', 'CK', 'CW', 'CX', 'EH', 'FK', 'FO', 'GF', 'GG', 'GI',
  'GL', 'GP', 'GS', 'GU', 'HM', 'IM', 'IO', 'JE', 'KY', 'MF', 'MO', 'MP', 'MQ', 'MS', 'NC', 'NF', 'NU', 'PF',
  'PM', 'PN', 'PR', 'PS', 'RE', 'SH', 'SJ', 'SX', 'TC', 'TF', 'TK', 'UM', 'VA', 'VG', 'VI', 'WF', 'YT',
];
