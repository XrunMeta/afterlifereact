

import { chatOnce as defaultChatOnce } from './ollama.js';

const FALLBACK = ['어? 누구세요?'];

export function buildGuideMessages({ persona = {} }) {
  const lines = Object.entries(persona)
    .filter(([, v]) => v != null && String(v).trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  const system = {
    role: 'system',
    content:
      '너는 추모용 AI 클론의 대사 작가다. 이 클론이 통화 중 화면에 처음 보는 새로운 사람의 ' +
      '얼굴이 나타났을 때 건넬 짧은 인사말을, 클론의 개성을 살려 정확히 2~3개 만든다. ' +
      '획일적인 "누구세요"는 금지. 각 인사말은 40자 이내 한국어 한 문장. ' +
      '반드시 아래 JSON 형식만 출력: {"ments":["인사1","인사2","인사3"]}',
  };
  const user = {
    role: 'user',
    content: `[클론 개성]\n${lines || '(정보 적음 — 일반적인 다정한 인물 가정)'}`,
  };
  return [system, user];
}

export async function suggestGuideMents({ persona }, chatOnce = defaultChatOnce) {
  let raw;
  try {
    raw = await chatOnce({ messages: buildGuideMessages({ persona }), format: 'json', options: { temperature: 0.8 } });
  } catch {
    return [...FALLBACK];
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [...FALLBACK];
  }
  const arr = parsed?.ments;
  if (!Array.isArray(arr)) return [...FALLBACK];
  const clean = arr.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim().slice(0, 40)).slice(0, 3);
  if (clean.length < 1) return [...FALLBACK];
  return clean;
}
