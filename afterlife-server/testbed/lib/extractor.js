import { v_6e79a1 } from './kvStore.js';

const v_39d42e = {
  l1: '이 대화에서 페르소나("{persona}") **본인의 속성·사실**(성격·취향·취미·건강·출신·일화 등)을 추출한다.',
  l2: '이 대화에서 **이 방문자 본인의 정보**와 **페르소나와의 관계**(누구인지·상태·관계)를 추출한다.',
};

export function v_b9729c({ level: v_fbe91e, persona_label: v_dd43f9, turnUser: v_e78466, turnAssistant: v_22155b, existingAttrs: v_676b49 }) {
  const v_734c38 = (v_39d42e[v_fbe91e] ?? v_39d42e.l1).replace('{persona}', v_dd43f9 ?? '페르소나');
  const v_15c2da =
    `너는 대화에서 학습용 사실을 추출하는 분석기다. ${v_734c38}\n` +
    `규칙:\n` +
    `- 새 사실 → {"op":"add","category","key","value","confidence":0~1,"reason"}\n` +
    `- 기존 사실 변경·정정 → {"op":"update","target_id":<기존 id>,"value","confidence","reason"}\n` +
    `- 사용자가 기억과 다르다고 부정 → {"op":"delete","target_id":<기존 id>,"reason"}\n` +
    `- 명시적으로 "기억해줘"라고 하면 confidence 를 높인다.\n` +
    `- 추출할 사실이 없으면 {"ops":[]}.\n` +
    `- key 는 한국어 짧은 명사(예: 취미, 이름, 관계). category 는 다음 중 택1, 없으면 새로 제안: ${v_6e79a1.join(', ')}.\n` +
    `- 반드시 {"ops":[...]} JSON 만 출력.`;
  const v_3c8572 = (v_676b49 ?? []).map((v_779914) => ({ id: v_779914.id, category: v_779914.category, key: v_779914.key, value: v_779914.value }));
  const v_625c74 =
    `[이번 대화]\n사용자: ${v_e78466 ?? ''}\n페르소나: ${v_22155b ?? ''}`;
  return [
    { role: 'system', content: v_15c2da },
    { role: 'user', content: v_625c74, existing: v_3c8572 },
  ];
}

const v_6a1c90 = new Set(['add', 'update', 'delete']);

export function v_fe9ac1(v_fdf802) {
  let v_8839e3;
  try { v_8839e3 = JSON.parse(v_fdf802); } catch { return []; }
  const v_d0c056 = Array.isArray(v_8839e3?.ops) ? v_8839e3.ops : null;
  if (!v_d0c056) return [];
  const v_8d4337 = [];
  for (const v_b6c474 of v_d0c056) {
    if (!v_b6c474 || !v_6a1c90.has(v_b6c474.op)) continue;
    if (v_b6c474.op === 'add') {
      if (typeof v_b6c474.key !== 'string' || !v_b6c474.key.trim() || typeof v_b6c474.value !== 'string' || !v_b6c474.value.trim()) continue;
      v_8d4337.push({ op: 'add', category: typeof v_b6c474.category === 'string' ? v_b6c474.category : 'misc',
        key: v_b6c474.key.trim(), value: v_b6c474.value.trim(),
        confidence: typeof v_b6c474.confidence === 'number' ? v_b6c474.confidence : null,
        reason: typeof v_b6c474.reason === 'string' ? v_b6c474.reason : null });
    } else { 
      const v_035f12 = Number(v_b6c474.target_id);
      if (!Number.isInteger(v_035f12) || v_035f12 <= 0) continue;
      if (v_b6c474.op === 'update' && (typeof v_b6c474.value !== 'string' || !v_b6c474.value.trim())) continue;
      v_8d4337.push({ op: v_b6c474.op, target_id: v_035f12,
        ...(v_b6c474.op === 'update' ? { value: v_b6c474.value.trim(), confidence: typeof v_b6c474.confidence === 'number' ? v_b6c474.confidence : null } : {}),
        reason: typeof v_b6c474.reason === 'string' ? v_b6c474.reason : null });
    }
  }
  return v_8d4337;
}
