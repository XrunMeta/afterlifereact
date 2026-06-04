import {
  v_2934e9,
  type v_c2a674,
  type v_344f4b,
} from '../types/clone';

const v_a28029 = new Map<v_344f4b, string>(
  v_2934e9.map((v_e2a85c) => [v_e2a85c.id as v_344f4b, v_e2a85c.label]),
);

export interface L1ProfilePayload {
  attrs: Record<string, string>;
  notes: string;
}

export function v_f689cd(
  v_020b4b,
): Partial<v_c2a674> {
  const v_779914 = v_020b4b?.attrs ?? {};
  const v_8b5c49 = v_779914.personalities ?? v_779914.types;
  return {
    personaAge: v_779914.age as v_c2a674['personaAge'],
    personaGender: v_779914.gender as v_c2a674['personaGender'],
    personaTypes: v_8b5c49
      ? (v_8b5c49.split(',').map((v_fd5f43) => v_fd5f43.trim()).filter(Boolean) as v_c2a674['personaTypes'])
      : undefined,
    personaMbti: v_779914.mbti as v_c2a674['personaMbti'],
    personaNotes: v_020b4b?.notes ?? '',
  };
}

export function v_556c5b(d: v_c2a674): L1ProfilePayload | undefined {
  const v_3555ae = {};
  if (v_d5dda0.personaAge) v_3555ae.age = v_d5dda0.personaAge;
  if (v_d5dda0.personaGender) v_3555ae.gender = v_d5dda0.personaGender;
  if (v_d5dda0.personaTypes && v_d5dda0.personaTypes.length > 0) v_3555ae.personalities = v_d5dda0.personaTypes.join(',');
  if (v_d5dda0.personaMbti) v_3555ae.mbti = v_d5dda0.personaMbti;
  const v_661aec = (v_d5dda0.personaNotes ?? '').trim();
  if (Object.keys(v_3555ae).length === 0 && !v_661aec) return undefined;
  return { attrs: v_3555ae, notes: v_661aec };
}

export interface PersonaSnapshot {
  name?: string;
  description?: string | null;
  relation?: string;
  interests?: string[];
  l1?: { attrs?: Record<string, string>; notes?: string } | null;
}

const v_0ac3cf = {
  mother: 'create.relations.mother',
  father: 'create.relations.father',
  spouse: 'create.relations.spouse',
  child: 'create.relations.child',
  sibling: 'create.relations.sibling',
  friend: 'create.relations.friend',
  pet: 'create.relations.pet',
  other: 'create.relations.other',
};

export function v_d6d0ff(
  v_e2a85c,
  v_8d41d7,
): string {
  const v_779914 = v_e2a85c.l1?.attrs ?? {};
  const v_a52412 = [];

  const v_43fb07 = [];
  if (v_e2a85c.name) v_43fb07.push(v_e2a85c.name);
  const v_ab4c96 = [];
  if (v_779914.age) v_ab4c96.push(v_779914.age);
  if (v_779914.gender) v_ab4c96.push(v_779914.gender);
  if (v_779914.mbti && v_779914.mbti !== '모름') v_ab4c96.push(v_779914.mbti);
  if (v_43fb07.length || v_ab4c96.length) {
    v_a52412.push(v_ab4c96.length ? `${v_43fb07.join('')} (${v_ab4c96.join(', ')})` : v_43fb07.join(''));
  }

  const v_886f3e = v_e2a85c.relation === 'self' ? 'friend' : v_e2a85c.relation;
  if (v_886f3e && v_0ac3cf[v_886f3e]) {
    const v_cf8ead = v_8d41d7 ? v_8d41d7(v_0ac3cf[v_886f3e]) : v_886f3e;
    v_a52412.push(`${v_8d41d7 ? v_8d41d7('create.basicInfo.relationLabel') : 'Relation'}: ${v_cf8ead}`);
  }

  const v_8b5c49 = v_779914.personalities ?? v_779914.types;
  if (v_8b5c49) {
    const v_e0187d = v_8b5c49
      .split(',')
      .map((v_389afb) => v_a28029.get(v_389afb.trim() as v_344f4b))
      .filter(Boolean);
    if (v_e0187d.length) v_a52412.push(`${v_8d41d7 ? v_8d41d7('create.persona.typeShort') : 'Personality'}: ${v_e0187d.join(', ')}`);
  }

  if (v_e2a85c.interests && v_e2a85c.interests.length > 0) {
    v_a52412.push(`${v_8d41d7 ? v_8d41d7('create.basicInfo.interestsLabel') : 'Interests'}: ${v_e2a85c.interests.join(', ')}`);
  }

  if (v_e2a85c.description) v_a52412.push(`${v_8d41d7 ? v_8d41d7('edit.descLabel') : 'Description'}: ${v_e2a85c.description}`);

  const v_661aec = v_e2a85c.l1?.notes?.trim();
  if (v_661aec) v_a52412.push('', v_661aec);

  return v_a52412.length > 0 ? v_a52412.join('\n') : '(페르소나 정보가 비어 있음)';
}
