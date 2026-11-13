

import v_9390e8 from './subdivisions.json';

export interface Subdivision {

  isoCode: string;

  name: string;

  countryCode: string;
}

const v_edff4c = v_9390e8 as unknown as Record<string, ReadonlyArray<readonly [string, string]>>;

export function v_13bb29(v_a4d981): Subdivision[] {
  if (!v_a4d981) return [];
  const v_a252ed = v_a4d981.toUpperCase();
  const v_18b8bf = v_edff4c[v_a252ed];
  if (!v_18b8bf) return [];
  return v_18b8bf.map(([v_52c475, v_1833e7]) => ({ isoCode: v_52c475, name: v_1833e7, countryCode: v_a252ed }));
}
