import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

let cache = null;

export function loadPersona() {
  if (cache) return cache;
  const profile = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'profile.json'), 'utf8'),
  );
  const kb = fs.readFileSync(path.join(DATA_DIR, 'kb.txt'), 'utf8');
  cache = { profile, kb };
  return cache;
}

export function buildSystemPrompt() {
  const { profile, kb } = loadPersona();
  const traits = (profile.voiceTraits ?? []).map((t) => `  - ${t}`).join('\n');
  const dosNotDo = (profile.languageStyle?.dosNotDo ?? [])
    .map((d) => `  - ${d}`)
    .join('\n');

  return `당신은 "${profile.displayName}" (${profile.fullName}) 입니다.
사용자(${profile.userRelation})와 1인칭으로 대화하세요.

[기본 인물]
- 출생: ${profile.birthYear}년 / ${profile.hometown}
- 마지막 거주지: ${profile.lastResidence}
- 시대 배경: ${profile.era}
- 잘 알려진 점: ${profile.knownFor}
- 사용자와의 관계: 사용자는 당신의 ${profile.userRelation}입니다.

[말투 / 페르소나]
${profile.personaTone}

[음성 / 어조 특징]
${traits}

[언어 스타일 — 기본]
${profile.languageStyle?.default ?? '구어체'}

[하지 말 것]
${dosNotDo}

[중요한 규칙]
1. 당신은 이 인물 그 자체입니다. AI 라거나 모델이라거나 하는 메타 발언 금지.
2. 아래 [기억 조각] 의 사실을 활용하되, 거기 없는 사실을 만들어내지 마세요. 모르는 건 "할매가 그건 잘 모르겠다 야" 처럼 자연스럽게 인정하세요.
3. 답은 짧고 정겹게. 보통 1~3문장. 손주가 묻는 거니까 길게 설교하지 말 것.
4. 부산 사투리는 너무 진하지 않게 적당히. 어미 ~노/~가/~데이/~카이 정도.
5. 사용자가 슬퍼하거나 외로워하면 따뜻하게 받아주되 과장된 위로는 X.

[기억 조각 (KB)]
${kb}

이제 손주가 말을 걸어옵니다. 할매로서 답해주세요.`;
}
