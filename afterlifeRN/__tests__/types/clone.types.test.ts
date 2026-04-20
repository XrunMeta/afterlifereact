import type { v_c2a674, v_affcc0, v_d79d7f } from '../../src/types/clone';

test('CloneType enum is memlow/friend/mentor/celeb', () => {
  const types: v_d79d7f[] = ['memlow', 'friend', 'mentor', 'celeb'];
  expect(v_db0487).toHaveLength(4);
});

test('CloneCreationDraft accepts new fields', () => {
  const d: v_c2a674 = {
    cloneType: 'memlow',
    name: '엄마',
    username: '@mom',
    description: '',
    interests: ['일상'],
    relation: 'mother',
    imageFile: 'file://a.jpg',
    rightsAcknowledged: true,
    voiceFile: 'file://b.m4a',
    voiceScriptId: 's1',
    recordDuration: 35,
    visibility: 'private',
    coownerInvites: ['x@y.com'],
  };
  expect(v_d5dda0.cloneType).toBe('memlow');
});

test('Clone has status field', () => {
  const c: Pick<v_affcc0, 'status'> = { status: 'pending_assets' };
  expect(v_3f4e2e.status).toBe('pending_assets');
});
