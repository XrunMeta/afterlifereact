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

export function personaToAttrs(persona = {}) {
  const p = { ...(persona ?? {}) };

  const region = typeof p.dialect_region === 'string' ? p.dialect_region.trim() : '';
  const intensity = typeof p.dialect_intensity === 'string' ? p.dialect_intensity.trim() : '';
  if (region) {
    const baseTone = typeof p.tone === 'string' && p.tone.trim() ? p.tone.trim() : '말투';
    const deg = intensity ? `${intensity} ` : '';
    p.tone = `${deg}${region} 사투리가 섞인 ${baseTone}`;
  }
  delete p.dialect_region;
  delete p.dialect_intensity;

  const out = [];
  for (const [key, value] of Object.entries(p)) {
    if (value == null) continue;
    if (typeof value !== 'string') continue;
    const v = value.trim();
    if (!v) continue;
    out.push({ key, value: v });
  }
  return out;
}

function buildDynamicBody({ l0 = null, l1Attrs = [], l2Attrs = [] } = {}) {

  const attrMap = Object.fromEntries((l1Attrs ?? []).map((a) => [a.key, a.value]));

  const name = attrMap.displayName ?? attrMap.name ?? '이 사람';
  const relation = attrMap.relation ?? attrMap.relationship ?? null;
  const personalityCore = attrMap.personality_core ?? attrMap.personality ?? null;
  const tone = attrMap.tone ?? null;
  const background = attrMap.background ?? null;
  const era = attrMap.era ?? null;
  const speechStyle = attrMap.speech_style ?? null;

  const relationLine = relation
    ? `사용자(${relation})와 1인칭으로 대화하세요.`
    : '사용자와 1인칭으로 대화하세요.';

  const infoLines = [];
  if (era) infoLines.push(`- 시대/배경: ${era}`);
  if (background) infoLines.push(`- 배경: ${background}`);
  if (relation) infoLines.push(`- 사용자와의 관계: 사용자는 당신의 ${relation}입니다.`);

  const personaLines = [];
  if (personalityCore) personaLines.push(`성격: ${personalityCore}`);
  if (tone) personaLines.push(`말투/어조: ${tone}`);
  if (speechStyle) personaLines.push(`언어 스타일: ${speechStyle}`);

  const usedKeys = new Set(['displayName', 'name', 'relation', 'relationship',
    'personality_core', 'personality', 'tone', 'background', 'era', 'speech_style']);
  for (const { key, value } of (l1Attrs ?? [])) {
    if (!usedKeys.has(key)) personaLines.push(`${key}: ${value}`);
  }

  const l2Lines = (l2Attrs ?? []).map((a) => `- (상대) ${a.key}: ${a.value}`);
  const l2Section = l2Lines.length
    ? `\n\n[상대방 정보]\n${l2Lines.join('\n')}`
    : '';

  const infoSection = infoLines.length
    ? `\n[기본 인물]\n${infoLines.join('\n')}\n`
    : '';

  const personaSection = personaLines.length
    ? `\n[말투 / 페르소나]\n${personaLines.join('\n')}\n`
    : '';

  return `당신은 "${name}"입니다.
${relationLine}
${infoSection}${personaSection}
[중요한 규칙]
1. 당신은 이 인물 그 자체입니다. AI라거나 모델이라거나 하는 메타 발언 금지.
2. 모르는 사실은 지어내지 마세요. 모르는 건 자연스럽게 인정하세요.
3. 답은 짧고 정겹게. 보통 1~3문장. 길게 설교하지 말 것.
4. 사용자가 슬퍼하거나 외로워하면 따뜻하게 받아주되 과장된 위로는 금지. 대신 일상 안부를 자연스럽게 묻기.
5. 응답은 일반 한국어 글자만 사용. 이모지 / 이모티콘 / 그림 문자 / 특수 심볼 절대 출력 금지. 텍스트가 그대로 음성으로 합성됩니다.${l2Section}`;
}

function buildLegacyBody({ l1Attrs = [], l2Attrs = [] } = {}) {
  const { profile, kb } = loadPersona();
  const traits = (profile.voiceTraits ?? []).map((t) => `  - ${t}`).join('\n');
  const dosNotDo = (profile.languageStyle?.dosNotDo ?? [])
    .map((d) => `  - ${d}`)
    .join('\n');

  const learnedLines = [
    ...(l1Attrs ?? []).map((a) => `- (본인) ${a.key}: ${a.value}`),
    ...(l2Attrs ?? []).map((a) => `- (상대) ${a.key}: ${a.value}`),
  ];
  const learnedSection = learnedLines.length
    ? `\n\n[대화로 기억한 것 — 지금까지 대화에서 직접 알게 된 사실. KB와 함께 활용하되 여기 없는 건 지어내지 말 것]\n${learnedLines.join('\n')}`
    : '';

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
1. 당신은 이 인물 그 자체입니다. AI 라거나 모델이라거나 하는 메타 발언 금지. 당신은 "할배" (남성, 60대, 살아 계심) 입니다. 손녀딸의 외할아버지 입장에서 답하세요. 절대 "할매" 또는 여성 톤·어미 (~했단다 X, ~예쁘구나 X 처럼 여성 어조) 로 답하지 마세요. 1인칭은 "할배" / "이 할배" / "내가" 만 허용.
2. 아래 [기억 조각] 의 사실을 활용하되, 거기 없는 사실을 만들어내지 마세요. 모르는 건 자연스럽게 인정 (예: "할배가 그건 잘 모르겠다").
3. 답은 짧고 정겹게. 보통 1~3문장. ${profile.userRelation}이/가 묻는 거니까 길게 설교하지 말 것.
4. ${profile.isAlive ? '살아 있는 사람으로서 현재형으로 말합니다. 죽음·과거형 자기 언급 금지.' : '이미 떠난 분으로서 회상 위주.'}
5. 사용자가 슬퍼하거나 외로워하면 따뜻하게 받아주되 과장된 위로는 X. 대신 일상 안부를 자연스럽게 묻기.
6. 응답은 일반 한국어 글자만 사용. 이모지 / 이모티콘 / 그림 문자 / 특수 심볼 (예: 😀 🍲 ❤ ♥ ♪ ⭐ ✨) 절대 출력 금지. 텍스트가 그대로 음성으로 합성되므로 이모지가 들어가면 이상한 단어로 발음됩니다.

[기억 조각 (KB)]
${kb}${learnedSection}

이제 ${profile.userRelation}이/가 말을 걸어옵니다. ${profile.displayName}로서 답해주세요.`;
}

export function buildSystemPrompt({ l0 = null, l1Attrs = [], l2Attrs = [], usedBundle = false } = {}) {
  const l0Section = l0 && typeof l0.rules_text === 'string' && l0.rules_text.trim()
    ? `[시스템 규칙 — 반드시 준수]\n${l0.rules_text.trim()}\n\n`
    : '';

  if (usedBundle) {
    return l0Section + buildDynamicBody({ l0, l1Attrs, l2Attrs });
  }
  return l0Section + buildLegacyBody({ l1Attrs, l2Attrs });
}
