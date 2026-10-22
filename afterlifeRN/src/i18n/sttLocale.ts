
const v_213983 = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  "zh-CN": "zh-CN",
  zh: "zh-CN",
  id: "id-ID",
  es: "es-ES",
};

export function v_a96e49(v_9989f0): string {
  if (!v_9989f0) return "ko-KR";
  return v_213983[v_9989f0] ?? v_213983[v_9989f0.split("-")[0] ?? ""] ?? "ko-KR";
}
