

export const v_7b2d46 = 2110;
export const v_a2df5a = 2111;
export const v_53df46 = 2100;

export const v_867937 = [
  { value: 2210, label: "10" },
  { value: 2220, label: "20" },
  { value: 2230, label: "30" },
  { value: 2240, label: "40" },
  { value: 2250, label: "50+" },
];

export const v_6f3478 = [
  { value: 2, label: "서울" },
  { value: 31, label: "경기" },
  { value: 32, label: "인천" },
  { value: 33, label: "강원" },
  { value: 41, label: "충남" },
  { value: 42, label: "대전" },
  { value: 43, label: "충북" },
  { value: 44, label: "세종" },
  { value: 51, label: "부산" },
  { value: 52, label: "울산" },
  { value: 53, label: "대구" },
  { value: 54, label: "경북" },
  { value: 55, label: "경남" },
  { value: 61, label: "광주" },
  { value: 62, label: "전남" },
  { value: 63, label: "전북" },
  { value: 64, label: "제주" },
];

export const v_be9c13 = {
  82: v_6f3478,
};

export function v_6491a7(v_733b65): ReadonlyArray<{ value: number; label: string }> {
  if (v_733b65 == null) return [];
  return v_be9c13[v_733b65] ?? [];
}
