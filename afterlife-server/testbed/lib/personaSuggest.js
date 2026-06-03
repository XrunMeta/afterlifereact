

import { v_3f4abd as v_5d4aed } from './ollama.js';

export function v_7def5f({ profile: v_727031 = {}, questions: v_c3519b = [] }) {
  const v_a43172 = Object.entries(v_727031)
    .filter(([, v_81e2ef]) => v_81e2ef != null && (Array.isArray(v_81e2ef) ? v_81e2ef.length : String(v_81e2ef).trim()))
    .map(([v_0eb677, v_81e2ef]) => `- ${v_0eb677}: ${Array.isArray(v_81e2ef) ? v_81e2ef.join(', ') : v_81e2ef}`)
    .join('\n');
  const v_887511 = v_c3519b
    .map((v_ab6401) => {
      const v_ce7582 = Array.isArray(v_ab6401.options_include) && v_ab6401.options_include.length
        ? ` (반드시 포함: ${v_ab6401.options_include.join(', ')})`
        : '';
      return `- key="${v_ab6401.key}": ${v_ab6401.label}${v_ce7582}`;
    })
    .join('\n');
  const v_15c2da = {
    role: 'system',
    content:
      '너는 추모용 AI 페르소나를 설계하는 도우미다. 주어진 인물 정보를 보고, 각 질문에 대해 ' +
      '이 인물에게 어울릴 법한 한국어 답 후보를 정확히 4개씩 제안한다. ' +
      '각 후보는 12자 내외의 간결한 구절. 반드시 아래 JSON 형식만 출력: ' +
      '{"suggestions":{"<key>":["후보1","후보2","후보3","후보4"]}}',
  };
  const v_625c74 = {
    role: 'user',
    content: `[인물 정보]\n${v_a43172 || '(정보 적음 — 일반적인 추모 대상 가정)'}\n\n[질문]\n${v_887511}`,
  };
  return [v_15c2da, v_625c74];
}

export async function v_228e13({ profile: v_727031, questions: v_c3519b }, v_3f4abd = v_5d4aed) {
  if (!Array.isArray(v_c3519b) || v_c3519b.length === 0) return {};
  const v_fa56e0 = v_7def5f({ profile: v_727031, questions: v_c3519b });
  let v_479f05;
  try {
    v_479f05 = await v_3f4abd({ messages: v_fa56e0, format: 'json', options: { temperature: 0.7 } });
  } catch {
    return {};
  }
  let v_8decf8;
  try {
    v_8decf8 = JSON.parse(v_479f05);
  } catch {
    return {};
  }
  const v_de1ba7 = v_8decf8?.suggestions;
  if (!v_de1ba7 || typeof v_de1ba7 !== 'object') return {};

  const v_8d4337 = {};
  for (const v_ab6401 of v_c3519b) {
    const v_d0c056 = v_de1ba7[v_ab6401.key];
    if (Array.isArray(v_d0c056)) {
      const v_76a373 = v_d0c056.filter((v_fd5f43) => typeof v_fd5f43 === 'string' && v_fd5f43.trim()).slice(0, 4);
      if (v_76a373.length) v_8d4337[v_ab6401.key] = v_76a373;
    }
  }
  return v_8d4337;
}
