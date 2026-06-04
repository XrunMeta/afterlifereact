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

export function l1ProfileToDraft(
  l1: { attrs?: Record<string, string>; notes?: string } | null | undefined,
): Partial<CloneCreationDraft> {
  const a = l1?.attrs ?? {};
  const typesCsv = a.personalities ?? a.types;
  return {
    personaAge: a.age as CloneCreationDraft['personaAge'],
    personaGender: a.gender as CloneCreationDraft['personaGender'],
    personaTypes: typesCsv
      ? (typesCsv.split(',').map((s) => s.trim()).filter(Boolean) as CloneCreationDraft['personaTypes'])
      : undefined,
    personaMbti: a.mbti as CloneCreationDraft['personaMbti'],
    personaNotes: l1?.notes ?? '',
  };
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

const RELATION_KEY: Record<string, string> = {
  mother: 'create.relations.mother',
  father: 'create.relations.father',
  spouse: 'create.relations.spouse',
  child: 'create.relations.child',
  sibling: 'create.relations.sibling',
  friend: 'create.relations.friend',
  pet: 'create.relations.pet',
  other: 'create.relations.other',
};

export function formatPersonaPrompt(
  p: PersonaSnapshot,
  t?: (k: string) => string,
): string {
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

  const effectiveRelation = p.relation === 'self' ? 'friend' : p.relation;
  if (effectiveRelation && RELATION_KEY[effectiveRelation]) {
    const relLabel = t ? t(RELATION_KEY[effectiveRelation]) : effectiveRelation;
    lines.push(`${t ? t('create.basicInfo.relationLabel') : 'Relation'}: ${relLabel}`);
  }

  const typesCsv = a.personalities ?? a.types;
  if (typesCsv) {
    const labels = typesCsv
      .split(',')
      .map((id) => TYPE_LABEL.get(id.trim() as PersonaTypeId))
      .filter(Boolean);
    if (labels.length) lines.push(`${t ? t('create.persona.typeShort') : 'Personality'}: ${labels.join(', ')}`);
  }

  if (p.interests && p.interests.length > 0) {
    lines.push(`${t ? t('create.basicInfo.interestsLabel') : 'Interests'}: ${p.interests.join(', ')}`);
  }

  if (p.description) lines.push(`${t ? t('edit.descLabel') : 'Description'}: ${p.description}`);

  const notes = p.l1?.notes?.trim();
  if (notes) lines.push('', notes);

  return lines.length > 0 ? lines.join('\n') : '(클론 정보가 비어 있음)';
}
