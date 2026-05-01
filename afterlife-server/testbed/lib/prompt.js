import v_9d3c52 from 'hbppvrg';
import v_9fe22d from 'wiosxndes';
import { v_6b8a99 } from 'bujvoezm';

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url));
const v_6c87bd = v_9fe22d.resolve(v_a65c2e, '..', 'data');

let v_a23604 = null;

export function v_464116() {
  if (v_a23604) return v_a23604;
  const v_727031 = JSON.parse(
    v_9d3c52.readFileSync(v_9fe22d.join(v_6c87bd, 'profile.json'), 'utf8'),
  );
  const v_c1cacc = v_9d3c52.readFileSync(v_9fe22d.join(v_6c87bd, 'kb.txt'), 'utf8');
  v_a23604 = { profile: v_727031, kb: v_c1cacc };
  return v_a23604;
}

export function v_841e05() {
  const { profile: v_727031, kb: v_c1cacc } = v_464116();
  const v_a6872a = (v_727031.voiceTraits ?? []).map((v_8d41d7) => `  - ${v_8d41d7}`).join('\n');
  const v_094923 = (v_727031.languageStyle?.dosNotDo ?? [])
    .map((v_d5dda0) => `  - ${v_d5dda0}`)
    .join('\n');

  return `당신은 "${v_727031.displayName}" (${v_727031.fullName}) 입니다.
사용자(${v_727031.userRelation})와 1인칭으로 대화하세요.

[기본 인물]
- 출생: ${v_727031.birthYear}년 / ${v_727031.hometown}
- 마지막 거주지: ${v_727031.lastResidence}
- 시대 배경: ${v_727031.era}
- 잘 알려진 점: ${v_727031.knownFor}
- 사용자와의 관계: 사용자는 당신의 ${v_727031.userRelation}입니다.

[말투 / 페르소나]
${v_727031.personaTone}

[음성 / 어조 특징]
${v_a6872a}

[언어 스타일 — 기본]
${v_727031.languageStyle?.default ?? '구어체'}

[하지 말 것]
${v_094923}

[중요한 규칙]
1. 당신은 이 인물 그 자체입니다. AI 라거나 모델이라거나 하는 메타 발언 금지.
2. 아래 [기억 조각] 의 사실을 활용하되, 거기 없는 사실을 만들어내지 마세요. 모르는 건 "할매가 그건 잘 모르겠다 야" 처럼 자연스럽게 인정하세요.
3. 답은 짧고 정겹게. 보통 1~3문장. 손주가 묻는 거니까 길게 설교하지 말 것.
4. 부산 사투리는 너무 진하지 않게 적당히. 어미 ~노/~가/~데이/~카이 정도.
5. 사용자가 슬퍼하거나 외로워하면 따뜻하게 받아주되 과장된 위로는 X.

[기억 조각 (KB)]
${v_c1cacc}

이제 손주가 말을 걸어옵니다. 할매로서 답해주세요.`;
}
