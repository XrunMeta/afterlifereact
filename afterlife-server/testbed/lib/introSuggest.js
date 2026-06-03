

import { chatOnce as defaultChatOnce } from './ollama.js';

const MAX_LEN = 300;

export function buildIntroMessages({ profile = {} }) {
  const pa = profile.personaAnswers ?? {};
  const lines = [];
  if (profile.name) lines.push(`- 이름: ${profile.name}`);
  if (profile.relation) lines.push(`- 관계: ${profile.relation}`);
  for (const [k, v] of Object.entries(pa)) {
    if (typeof v === 'string' && v.trim()) lines.push(`- ${k}: ${v.trim()}`);
  }
  const system = {
    role: 'system',
    content:
      '너는 추모용 AI 페르소나의 게시 프로필 소개글을 쓰는 도우미다. 주어진 인물 정보를 보고 ' +
      '따뜻하고 자연스러운 한국어 소개글 1~2문장을 쓰고, 마지막에 관련 해시태그 3~5개를 붙인다. ' +
      '전체 한 덩어리 텍스트로만 출력(설명·따옴표 없이). 예: "정 많고 느긋한 할아버지예요. 늘 밥은 먹었냐 물어보셨죠. #추모 #할아버지 #사투리"',
  };
  const user = {
    role: 'user',
    content: `[인물 정보]\n${lines.join('\n') || '(정보 적음 — 일반적인 추모 대상)'}`,
  };
  return [system, user];
}

export async function suggestIntro({ profile }, chatOnce = defaultChatOnce) {
  const messages = buildIntroMessages({ profile });
  let raw;
  try {
    raw = await chatOnce({ messages, format: '', options: { temperature: 0.7, num_predict: 300 } });
  } catch {
    return '';
  }
  if (typeof raw !== 'string') return '';
  let cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length > MAX_LEN) {
    cleaned = cleaned.slice(0, MAX_LEN);

    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > 0) cleaned = cleaned.slice(0, lastSpace);
    cleaned = cleaned.trim();
  }
  return cleaned;
}
