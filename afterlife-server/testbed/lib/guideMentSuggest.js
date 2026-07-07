

import { v_3f4abd as v_5d4aed } from './ollama.js';

const v_e0d2db = ['어? 누구세요?'];

export function v_515c81({ persona: v_5ed063 = {} }) {
  const v_a52412 = Object.entries(v_5ed063)
    .filter(([, v_81e2ef]) => v_81e2ef != null && String(v_81e2ef).trim())
    .map(([v_0eb677, v_81e2ef]) => `- ${v_0eb677}: ${v_81e2ef}`)
    .join('\n');
  const v_15c2da = {
    role: 'system',
    content:
      '너는 추모용 AI 클론의 대사 작가다. 이 클론이 통화 중 화면에 처음 보는 새로운 사람의 ' +
      '얼굴이 나타났을 때 건넬 짧은 인사말을, 클론의 개성을 살려 정확히 2~3개 만든다. ' +
      '획일적인 "누구세요"는 금지. 각 인사말은 40자 이내 한국어 한 문장. ' +
      '반드시 아래 JSON 형식만 출력: {"ments":["인사1","인사2","인사3"]}',
  };
  const v_625c74 = {
    role: 'user',
    content: `[클론 개성]\n${v_a52412 || '(정보 적음 — 일반적인 다정한 인물 가정)'}`,
  };
  return [v_15c2da, v_625c74];
}

export async function v_b74bce({ persona: v_5ed063 }, v_3f4abd = v_5d4aed) {
  let v_479f05;
  try {
    v_479f05 = await v_3f4abd({ messages: v_515c81({ persona: v_5ed063 }), format: 'json', options: { temperature: 0.8 } });
  } catch {
    return [...v_e0d2db];
  }
  let v_8decf8;
  try {
    v_8decf8 = JSON.parse(v_479f05);
  } catch {
    return [...v_e0d2db];
  }
  const v_d0c056 = v_8decf8?.ments;
  if (!Array.isArray(v_d0c056)) return [...v_e0d2db];
  const v_76a373 = v_d0c056.filter((v_fd5f43) => typeof v_fd5f43 === 'string' && v_fd5f43.trim()).map((v_fd5f43) => v_fd5f43.trim().slice(0, 40)).slice(0, 3);
  if (v_76a373.length < 1) return [...v_e0d2db];
  return v_76a373;
}
