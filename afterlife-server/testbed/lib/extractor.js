import { CATEGORIES } from './kvStore.js';

const LEVEL_GUIDE = {
  l1: '이 대화에서 페르소나("{persona}") **본인의 속성·사실**(성격·취향·취미·건강·출신·일화 등)을 추출한다.',
  l2: '이 대화에서 **이 방문자 본인의 정보**와 **페르소나와의 관계**(누구인지·상태·관계)를 추출한다.',
};

export function buildExtractionMessages({ level, persona_label, turnUser, turnAssistant, existingAttrs }) {
  const guide = (LEVEL_GUIDE[level] ?? LEVEL_GUIDE.l1).replace('{persona}', persona_label ?? '페르소나');
  const system =
    `너는 대화에서 학습용 사실을 추출하는 분석기다. ${guide}\n` +
    `규칙:\n` +
    `- 새 사실 → {"op":"add","category","key","value","confidence":0~1,"reason"}\n` +
    `- 기존 사실 변경·정정 → {"op":"update","target_id":<기존 id>,"value","confidence","reason"}\n` +
    `- 사용자가 기억과 다르다고 부정 → {"op":"delete","target_id":<기존 id>,"reason"}\n` +
    `- 명시적으로 "기억해줘"라고 하면 confidence 를 높인다.\n` +
    `- 추출할 사실이 없으면 {"ops":[]}.\n` +
    `- key 는 한국어 짧은 명사(예: 취미, 이름, 관계). category 는 다음 중 택1, 없으면 새로 제안: ${CATEGORIES.join(', ')}.\n` +
    `- 반드시 {"ops":[...]} JSON 만 출력.`;
  const existing = (existingAttrs ?? []).map((a) => ({ id: a.id, category: a.category, key: a.key, value: a.value }));
  const user =
    `[기존 KV]\n${JSON.stringify(existing)}\n\n` +
    `[이번 대화]\n사용자: ${turnUser ?? ''}\n페르소나: ${turnAssistant ?? ''}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

const VALID_OPS = new Set(['add', 'update', 'delete']);

export function parseOps(jsonText) {
  let obj;
  try { obj = JSON.parse(jsonText); } catch { return []; }
  const arr = Array.isArray(obj?.ops) ? obj.ops : null;
  if (!arr) return [];
  const out = [];
  for (const o of arr) {
    if (!o || !VALID_OPS.has(o.op)) continue;
    if (o.op === 'add') {
      if (typeof o.key !== 'string' || !o.key.trim() || typeof o.value !== 'string' || !o.value.trim()) continue;
      out.push({ op: 'add', category: typeof o.category === 'string' ? o.category : 'misc',
        key: o.key.trim(), value: o.value.trim(),
        confidence: typeof o.confidence === 'number' ? o.confidence : null,
        reason: typeof o.reason === 'string' ? o.reason : null });
    } else { 
      const tid = Number(o.target_id);
      if (!Number.isInteger(tid) || tid <= 0) continue;
      if (o.op === 'update' && (typeof o.value !== 'string' || !o.value.trim())) continue;
      out.push({ op: o.op, target_id: tid,
        ...(o.op === 'update' ? { value: o.value.trim(), confidence: typeof o.confidence === 'number' ? o.confidence : null } : {}),
        reason: typeof o.reason === 'string' ? o.reason : null });
    }
  }
  return out;
}

export async function extractTurn(ctx, chatOnceFn) {
  try {
    const messages = buildExtractionMessages(ctx);
    const text = await chatOnceFn({ messages, format: 'json' });
    return parseOps(text);
  } catch (err) {
    console.warn('[029-E-learn] extractTurn failed:', err?.message ?? err);
    return [];
  }
}
