import {
  PERSONA_TYPE_OPTIONS,
  type CloneCreationDraft,
  type PersonaTypeId,
} from '../types/clone';

const TYPE_LABEL = new Map<PersonaTypeId, string>(
  PERSONA_TYPE_OPTIONS.map((p) => [p.id as PersonaTypeId, p.label]),
);

export interface L1ProfilePayload {
  attrs: Record<string, string>;
  notes: string;
}

export function draftToL1Profile(d: CloneCreationDraft): L1ProfilePayload | undefined {
  const attrs: Record<string, string> = {};
  if (d.personaAge) attrs.age = d.personaAge;
  if (d.personaGender) attrs.gender = d.personaGender;
  if (d.personaTypes && d.personaTypes.length > 0) attrs.personalities = d.personaTypes.join(',');
  if (d.personaMbti) attrs.mbti = d.personaMbti;
  const notes = (d.personaNotes ?? '').trim();
  if (Object.keys(attrs).length === 0 && !notes) return undefined;
  return { attrs, notes };
}

export interface PersonaSnapshot {
  name?: string;
  description?: string | null;
  relation?: string;
  interests?: string[];
  l1?: { attrs?: Record<string, string>; notes?: string } | null;
}

const RELATION_LABEL: Record<string, string> = {
  mother: '어머니', father: '아버지', spouse: '배우자', child: '자녀',
  sibling: '형제자매', friend: '친구', pet: '반려동물', other: '기타',
};

export function formatPersonaPrompt(p: PersonaSnapshot): string {
  const a = p.l1?.attrs ?? {};
  const lines: string[] = [];

  const head: string[] = [];
  if (p.name) head.push(p.name);
  const meta: string[] = [];
  if (a.age) meta.push(a.age);
  if (a.gender) meta.push(a.gender);
  if (a.mbti && a.mbti !== '모름') meta.push(a.mbti);
  if (head.length || meta.length) {
    lines.push(meta.length ? `${head.join('')} (${meta.join(', ')})` : head.join(''));
  }

  if (p.relation && RELATION_LABEL[p.relation]) {
    lines.push(`고인과의 관계: ${RELATION_LABEL[p.relation]}`);
  }

  if (a.personalities) {
    const labels = a.personalities
      .split(',')
      .map((id) => TYPE_LABEL.get(id.trim() as PersonaTypeId))
      .filter(Boolean);
    if (labels.length) lines.push(`성격: ${labels.join(', ')}`);
  }

  if (p.interests && p.interests.length > 0) {
    lines.push(`관심사: ${p.interests.join(', ')}`);
  }

  if (p.description) lines.push(`한 줄 소개: ${p.description}`);

  const notes = p.l1?.notes?.trim();
  if (notes) lines.push('', notes);

  return lines.length > 0 ? lines.join('\n') : '(페르소나 정보가 비어 있음)';
}
