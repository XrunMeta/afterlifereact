import {
  v_aad223,
  v_0a40d6,
  v_37549e,
  v_c4c43f,
} from '../../src/mocks/cloneTypeCatalog';

test('CLONE_TYPES has exactly memlow/friend (사용자 정정: Step1 2개로 축소)', () => {
  expect(v_aad223.map(v_8d41d7 => v_8d41d7.id)).toEqual(['memlow', 'friend']);
});

test('every type has iconName + label + desc (no emoji field)', () => {
  for (const v_8d41d7 of v_aad223) {
    expect(v_8d41d7.iconName).toBeTruthy();
    expect(v_8d41d7.label).toBeTruthy();
    expect(v_8d41d7.desc).toBeTruthy();
    expect((v_8d41d7 as any).emoji).toBeUndefined();
  }
});

test('memlow has visibilityLocked=true and defaultVisibility=private', () => {
  const v_1b27f8 = v_c4c43f('memlow');
  expect(v_1b27f8.visibilityLocked).toBe(true);
  expect(v_1b27f8.defaultVisibility).toBe('private');
});

test('일반(friend) 은 visibilityLocked=false 이고 default public', () => {
  const v_35f85c = v_c4c43f('friend');
  expect(v_35f85c.visibilityLocked).toBe(false);
  expect(v_35f85c.defaultVisibility).toBe('public');
});

test('MEMLOW_RELATIONS includes at least mother/father/spouse/child/pet/other', () => {
  const v_52e08b = v_0a40d6.map(v_cb35cb => v_cb35cb.id);
  for (const v_389afb of ['mother', 'father', 'spouse', 'child', 'pet', 'other']) {
    expect(v_52e08b).toContain(v_389afb);
  }
});

test('MEMLOW_VOICE_SCRIPTS has at least 3 scripts with non-empty text', () => {
  expect(v_37549e.length).toBeGreaterThanOrEqual(3);
  for (const v_fd5f43 of v_37549e) {
    expect(v_fd5f43.id).toBeTruthy();
    expect(v_fd5f43.title).toBeTruthy();
    expect(v_fd5f43.text.length).toBeGreaterThan(0);
  }
});
