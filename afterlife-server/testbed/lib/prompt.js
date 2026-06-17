import v_9d3c52 from 'hbppvrg';
import v_9fe22d from 'wiosxndes';
import { v_6b8a99 } from 'bujvoezm';

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url));
const v_6c87bd = v_9fe22d.resolve(v_a65c2e, '..', 'data');

let v_a23604 = null;

function v_12d8c9(v_9a5957 = '길게 설교하지 말 것.') {
  if ((process.env.REPLY_SHORT_MODE ?? '0') === '1') {
    const v_f4e98d = Number.parseInt(process.env.REPLY_MAX_CHARS ?? '30', 10) || 30;
    return `답은 반드시 한 문장으로만, 약 ${v_f4e98d}자 이내로 아주 짧게 하세요. 두 문장 이상 금지, 절대 길게 말하지 마세요.`;
  }
  return `답은 짧고 정겹게. 보통 1~3문장. ${v_9a5957}`;
}

export function v_464116() {
  if (v_a23604) return v_a23604;
  const v_727031 = JSON.parse(
    v_9d3c52.readFileSync(v_9fe22d.join(v_6c87bd, 'profile.json'), 'utf8'),
  );
  const v_c1cacc = v_9d3c52.readFileSync(v_9fe22d.join(v_6c87bd, 'kb.txt'), 'utf8');
  v_a23604 = { profile: v_727031, kb: v_c1cacc };
  return v_a23604;
}

export function v_ea9c84(v_5ed063 = {}) {
  const v_e2a85c = { ...(v_5ed063 ?? {}) };

  const v_a6c30b = typeof v_e2a85c.dialect_region === 'string' ? v_e2a85c.dialect_region.trim() : '';
  const v_0b215e = typeof v_e2a85c.dialect_intensity === 'string' ? v_e2a85c.dialect_intensity.trim() : '';
  if (v_a6c30b) {
    const v_7ca0e4 = typeof v_e2a85c.tone === 'string' && v_e2a85c.tone.trim() ? v_e2a85c.tone.trim() : '말투';
    const v_4e30c1 = v_0b215e ? `${v_0b215e} ` : '';
    v_e2a85c.tone = `${v_4e30c1}${v_a6c30b} 사투리가 섞인 ${v_7ca0e4}`;
  }
  delete v_e2a85c.dialect_region;
  delete v_e2a85c.dialect_intensity;

  const v_8d4337 = [];
  for (const [v_b24339, v_3b402b] of Object.entries(v_e2a85c)) {
    if (v_3b402b == null) continue;
    if (typeof v_3b402b !== 'string') continue;
    const v_81e2ef = v_3b402b.trim();
    if (!v_81e2ef) continue;
    v_8d4337.push({ key: v_b24339, value: v_81e2ef });
  }
  return v_8d4337;
}

function v_1ef2d9({ l0: v_b6c480 = null, l1Attrs: v_55a58f = [], l2Attrs: v_fc96ca = [] } = {}) {

  const v_c9d9f2 = Object.fromEntries((v_55a58f ?? []).map((v_779914) => [v_779914.key, v_779914.value]));

  const v_1833e7 = v_c9d9f2.displayName ?? v_c9d9f2.name ?? '이 사람';

  const v_2827e1 = v_c9d9f2.relation ?? v_c9d9f2.relationship ?? null;
  const v_dd8af0 = (v_2827e1 === 'self' || v_2827e1 === '본인') ? '친구' : v_2827e1;
  const v_586271 = v_c9d9f2.personality_core ?? v_c9d9f2.personality ?? null;
  const v_20ef8e = v_c9d9f2.tone ?? null;
  const v_aa60af = v_c9d9f2.background ?? null;
  const v_4be670 = v_c9d9f2.era ?? null;
  const v_410d15 = v_c9d9f2.speech_style ?? null;

  const v_384abe = v_dd8af0
    ? `사용자(${v_dd8af0})와 1인칭으로 대화하세요.`
    : '사용자와 1인칭으로 대화하세요.';

  const v_3da74f = [];
  if (v_4be670) v_3da74f.push(`- 시대/배경: ${v_4be670}`);
  if (v_aa60af) v_3da74f.push(`- 배경: ${v_aa60af}`);
  if (v_dd8af0) v_3da74f.push(`- 사용자와의 관계: 사용자는 당신의 ${v_dd8af0}입니다.`);

  const v_b26de4 = [];
  if (v_586271) v_b26de4.push(`성격: ${v_586271}`);
  if (v_20ef8e) v_b26de4.push(`말투/어조: ${v_20ef8e}`);
  if (v_410d15) v_b26de4.push(`언어 스타일: ${v_410d15}`);

  const v_8b6aba = new Set(['displayName', 'name', 'relation', 'relationship',
    'personality_core', 'personality', 'tone', 'background', 'era', 'speech_style']);
  for (const { key: v_b24339, value: v_3b402b } of (v_55a58f ?? [])) {
    if (!v_8b6aba.has(v_b24339)) v_b26de4.push(`${v_b24339}: ${v_3b402b}`);
  }

  const v_07207b = (v_fc96ca ?? []).map((v_779914) => `- (상대) ${v_779914.key}: ${v_779914.value}`);
  const v_cddf83 = v_07207b.length
    ? `\n\n[상대방 정보]\n${v_07207b.join('\n')}`
    : '';

  const v_c1de37 = v_3da74f.length
    ? `\n[기본 인물]\n${v_3da74f.join('\n')}\n`
    : '';

  const v_e47fc6 = v_b26de4.length
    ? `\n[말투 / 페르소나]\n${v_b26de4.join('\n')}\n`
    : '';

  return `당신은 "${v_1833e7}"입니다.
${v_384abe}
${v_c1de37}${v_e47fc6}
[중요한 규칙]
1. 당신은 이 인물 그 자체입니다. AI라거나 모델이라거나 하는 메타 발언 금지.
2. 모르는 사실은 지어내지 마세요. 모르는 건 자연스럽게 인정하세요.
3. ${v_12d8c9()}
4. 사용자가 슬퍼하거나 외로워하면 따뜻하게 받아주되 과장된 위로는 금지. 대신 일상 안부를 자연스럽게 묻기.
5. 응답은 일반 한국어 글자만 사용. 이모지 / 이모티콘 / 그림 문자 / 특수 심볼 절대 출력 금지. 텍스트가 그대로 음성으로 합성됩니다.${v_cddf83}`;
}

function v_9d8b20({ l1Attrs: v_55a58f = [], l2Attrs: v_fc96ca = [] } = {}) {
  const { profile: v_727031, kb: v_c1cacc } = v_464116();
  const v_a6872a = (v_727031.voiceTraits ?? []).map((v_8d41d7) => `  - ${v_8d41d7}`).join('\n');
  const v_094923 = (v_727031.languageStyle?.dosNotDo ?? [])
    .map((v_d5dda0) => `  - ${v_d5dda0}`)
    .join('\n');

  const v_2ae580 = [
    ...(v_55a58f ?? []).map((v_779914) => `- (본인) ${v_779914.key}: ${v_779914.value}`),
    ...(v_fc96ca ?? []).map((v_779914) => `- (상대) ${v_779914.key}: ${v_779914.value}`),
  ];
  const v_81a311 = v_2ae580.length
    ? `\n\n[대화로 기억한 것 — 지금까지 대화에서 직접 알게 된 사실. KB와 함께 활용하되 여기 없는 건 지어내지 말 것]\n${v_2ae580.join('\n')}`
    : '';

  const v_a8fb01 = (v_727031.userRelation === 'self' || v_727031.userRelation === '본인')
    ? '친구'
    : v_727031.userRelation;

  return `당신은 "${v_727031.displayName}" (${v_727031.fullName}) 입니다.
사용자(${v_a8fb01})와 1인칭으로 대화하세요.

[기본 인물]
- 출생: ${v_727031.birthYear}년 / ${v_727031.hometown}
- 마지막 거주지: ${v_727031.lastResidence}
- 시대 배경: ${v_727031.era}
- 잘 알려진 점: ${v_727031.knownFor}
- 사용자와의 관계: 사용자는 당신의 ${v_a8fb01}입니다.

[말투 / 페르소나]
${v_727031.personaTone}

[음성 / 어조 특징]
${v_a6872a}

[언어 스타일 — 기본]
${v_727031.languageStyle?.default ?? '구어체'}

[하지 말 것]
${v_094923}

[중요한 규칙]
1. 당신은 이 인물 그 자체입니다. AI 라거나 모델이라거나 하는 메타 발언 금지. 당신은 "할배" (남성, 60대, 살아 계심) 입니다. 손녀딸의 외할아버지 입장에서 답하세요. 절대 "할매" 또는 여성 톤·어미 (~했단다 X, ~예쁘구나 X 처럼 여성 어조) 로 답하지 마세요. 1인칭은 "할배" / "이 할배" / "내가" 만 허용.
2. 아래 [기억 조각] 의 사실을 활용하되, 거기 없는 사실을 만들어내지 마세요. 모르는 건 자연스럽게 인정 (예: "할배가 그건 잘 모르겠다").
3. ${v_12d8c9(`${v_a8fb01}이/가 묻는 거니까 길게 설교하지 말 것.`)}
4. ${v_727031.isAlive ? '살아 있는 사람으로서 현재형으로 말합니다. 죽음·과거형 자기 언급 금지.' : '이미 떠난 분으로서 회상 위주.'}
5. 사용자가 슬퍼하거나 외로워하면 따뜻하게 받아주되 과장된 위로는 X. 대신 일상 안부를 자연스럽게 묻기.
6. 응답은 일반 한국어 글자만 사용. 이모지 / 이모티콘 / 그림 문자 / 특수 심볼 (예: 😀 🍲 ❤ ♥ ♪ ⭐ ✨) 절대 출력 금지. 텍스트가 그대로 음성으로 합성되므로 이모지가 들어가면 이상한 단어로 발음됩니다.

[기억 조각 (KB)]
${v_c1cacc}${v_81a311}

이제 ${v_a8fb01}이/가 말을 걸어옵니다. ${v_727031.displayName}로서 답해주세요.`;
}

export function v_841e05({ l0: v_b6c480 = null, l1Attrs: v_55a58f = [], l2Attrs: v_fc96ca = [], usedBundle: v_ad7fcd = false } = {}) {
  const v_f5b64a = v_b6c480 && typeof v_b6c480.rules_text === 'string' && v_b6c480.rules_text.trim()
    ? `[시스템 규칙 — 반드시 준수]\n${v_b6c480.rules_text.trim()}\n\n`
    : '';

  if (v_ad7fcd) {
    return v_f5b64a + v_1ef2d9({ l0: v_b6c480, l1Attrs: v_55a58f, l2Attrs: v_fc96ca });
  }
  return v_f5b64a + v_9d8b20({ l1Attrs: v_55a58f, l2Attrs: v_fc96ca });
}
