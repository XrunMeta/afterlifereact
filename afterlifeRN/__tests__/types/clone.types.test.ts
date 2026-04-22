import type { CloneCreationDraft, Clone, CloneType } from '../../src/types/clone';

test('CloneType enum is memlow/friend/mentor/celeb', () => {
  const types: CloneType[] = ['memlow', 'friend', 'mentor', 'celeb'];
  expect(types).toHaveLength(4);
});

test('CloneCreationDraft accepts new fields', () => {
  const d: CloneCreationDraft = {
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
  expect(d.cloneType).toBe('memlow');
});

test('Clone has status field', () => {
  const c: Pick<Clone, 'status'> = { status: 'pending_assets' };
  expect(c.status).toBe('pending_assets');
});
