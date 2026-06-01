

import { chatOnce as defaultChatOnce } from './ollama.js';

export function buildSuggestMessages({ profile = {}, questions = [] }) {
  const profileLines = Object.entries(profile)
    .filter(([, v]) => v != null && (Array.isArray(v) ? v.length : String(v).trim()))
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
  const qLines = questions
    .map((q) => {
      const inc = Array.isArray(q.options_include) && q.options_include.length
        ? ` (반드시 포함: ${q.options_include.join(', ')})`
        : '';
      return `- key="${q.key}": ${q.label}${inc}`;
    })
    .join('\n');
  const system = {
    role: 'system',
    content:
      '너는 추모용 AI 페르소나를 설계하는 도우미다. 주어진 인물 정보를 보고, 각 질문에 대해 ' +
      '이 인물에게 어울릴 법한 한국어 답 후보를 정확히 4개씩 제안한다. ' +
      '각 후보는 12자 내외의 간결한 구절. 반드시 아래 JSON 형식만 출력: ' +
      '{"suggestions":{"<key>":["후보1","후보2","후보3","후보4"]}}',
  };
  const user = {
    role: 'user',
    content: `[인물 정보]\n${profileLines || '(정보 적음 — 일반적인 추모 대상 가정)'}\n\n[질문]\n${qLines}`,
  };
  return [system, user];
}

export async function suggestPersonaChoices({ profile, questions }, chatOnce = defaultChatOnce) {
  if (!Array.isArray(questions) || questions.length === 0) return {};
  const messages = buildSuggestMessages({ profile, questions });
  let raw;
  try {
    raw = await chatOnce({ messages, format: 'json', options: { temperature: 0.7 } });
  } catch {
    return {};
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  const suggestions = parsed?.suggestions;
  if (!suggestions || typeof suggestions !== 'object') return {};

  const out = {};
  for (const q of questions) {
    const arr = suggestions[q.key];
    if (Array.isArray(arr)) {
      const clean = arr.filter((s) => typeof s === 'string' && s.trim()).slice(0, 4);
      if (clean.length) out[q.key] = clean;
    }
  }
  return out;
}
