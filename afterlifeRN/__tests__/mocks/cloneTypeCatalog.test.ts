import {
  CLONE_TYPES,
  MEMLOW_RELATIONS,
  MEMLOW_VOICE_SCRIPTS,
  getCloneTypeMeta,
} from '../../src/mocks/cloneTypeCatalog';

test('CLONE_TYPES has exactly memlow/friend/mentor/celeb', () => {
  expect(CLONE_TYPES.map(t => t.id)).toEqual(['memlow', 'friend', 'mentor', 'celeb']);
});

test('every type has iconName + label + desc (no emoji field)', () => {
  for (const t of CLONE_TYPES) {
    expect(t.iconName).toBeTruthy();
    expect(t.label).toBeTruthy();
    expect(t.desc).toBeTruthy();
    expect((t as any).emoji).toBeUndefined();
  }
});

test('memlow has visibilityLocked=true and defaultVisibility=private', () => {
  const memlow = getCloneTypeMeta('memlow');
  expect(memlow.visibilityLocked).toBe(true);
  expect(memlow.defaultVisibility).toBe('private');
});

test('non-memlow types are visibilityLocked=false and default public', () => {
  for (const id of ['friend', 'mentor', 'celeb'] as const) {
    const m = getCloneTypeMeta(id);
    expect(m.visibilityLocked).toBe(false);
    expect(m.defaultVisibility).toBe('public');
  }
});

test('MEMLOW_RELATIONS includes at least mother/father/spouse/child/pet/other', () => {
  const ids = MEMLOW_RELATIONS.map(r => r.id);
  for (const id of ['mother', 'father', 'spouse', 'child', 'pet', 'other']) {
    expect(ids).toContain(id);
  }
});

test('MEMLOW_VOICE_SCRIPTS has at least 3 scripts with non-empty text', () => {
  expect(MEMLOW_VOICE_SCRIPTS.length).toBeGreaterThanOrEqual(3);
  for (const s of MEMLOW_VOICE_SCRIPTS) {
    expect(s.id).toBeTruthy();
    expect(s.title).toBeTruthy();
    expect(s.text.length).toBeGreaterThan(0);
  }
});
