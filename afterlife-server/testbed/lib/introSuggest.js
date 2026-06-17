

import { v_3f4abd as v_5d4aed } from './ollama.js';

const v_87edf7 = 300;

const v_805884 = ['추모', '고인', '그리움', '그리운', '하늘나라', '영면', '명복', '애도', '별세'];
function v_096c01(v_9b6134) {
  return v_9b6134
    .split(' ')
    .filter((v_ea333d) => !(v_ea333d.startsWith('#') && v_805884.some((v_32f7b8) => v_ea333d.includes(v_32f7b8))))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function v_271c4f({ profile: v_727031 = {} }) {
  const v_21ba9c = v_727031.personaAnswers ?? {};
  const v_a52412 = [];
  if (v_727031.name) v_a52412.push(`- 이름: ${v_727031.name}`);
  if (v_727031.relation) v_a52412.push(`- 관계: ${v_727031.relation}`);
  for (const [v_0eb677, v_81e2ef] of Object.entries(v_21ba9c)) {
    if (typeof v_81e2ef === 'string' && v_81e2ef.trim()) v_a52412.push(`- ${v_0eb677}: ${v_81e2ef.trim()}`);
  }
  const v_15c2da = {
    role: 'system',
    content:
      '너는 AI 페르소나의 게시 프로필 소개글을 쓰는 도우미다. 주어진 인물 정보를 보고 ' +
      '따뜻하고 자연스러운 한국어 소개글 1~2문장을 쓰고, 마지막에 관련 해시태그 3~5개를 붙인다. ' +
      '추모·고인·그리움·이별·하늘나라·영면·명복 등 죽음이나 추모를 연상시키는 표현과 해시태그는 절대 쓰지 않는다. ' +
      '지금 살아 활동하는 인물을 소개하듯 현재형으로 밝게 쓴다. ' +
      '전체 한 덩어리 텍스트로만 출력(설명·따옴표 없이). 예: "정 많고 느긋한 할아버지예요. 늘 밥은 먹었냐 물어보세요. #따뜻함 #할아버지 #사투리"',
  };
  const v_625c74 = {
    role: 'user',
    content: `[인물 정보]\n${v_a52412.join('\n') || '(정보 적음 — 일반적인 인물)'}`,
  };
  return [v_15c2da, v_625c74];
}

export async function v_541b14({ profile: v_727031 }, v_3f4abd = v_5d4aed) {
  const v_fa56e0 = v_271c4f({ profile: v_727031 });
  let v_479f05;
  try {
    v_479f05 = await v_3f4abd({ messages: v_fa56e0, format: '', options: { temperature: 0.7, num_predict: 300 } });
  } catch {
    return '';
  }
  if (typeof v_479f05 !== 'string') return '';
  let v_738e47 = v_096c01(v_479f05.replace(/\s+/g, ' ').trim());
  if (v_738e47.length > v_87edf7) {
    v_738e47 = v_738e47.slice(0, v_87edf7);

    const v_4f5513 = v_738e47.lastIndexOf(' ');
    if (v_4f5513 > 0) v_738e47 = v_738e47.slice(0, v_4f5513);
    v_738e47 = v_738e47.trim();
  }
  return v_738e47;
}
