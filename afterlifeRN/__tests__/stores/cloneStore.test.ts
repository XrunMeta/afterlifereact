import { v_194498 } from '../../src/stores/cloneStore';

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
});

test('creationDraft starts with interests=[] and coownerInvites=[]', () => {
  const v_d5dda0 = v_194498.getState().creationDraft;
  expect(v_d5dda0.interests).toEqual([]);
  expect(v_d5dda0.coownerInvites).toEqual([]);
});

test('setCreationDraft merges partial updates', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'memlow', name: '엄마' });
  const v_d5dda0 = v_194498.getState().creationDraft;
  expect(v_d5dda0.cloneType).toBe('memlow');
  expect(v_d5dda0.name).toBe('엄마');
});

test('resetCreationDraft restores empty defaults', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'memlow' });
  v_194498.getState().resetCreationDraft();
  expect(v_194498.getState().creationDraft.cloneType).toBeUndefined();
  expect(v_194498.getState().creationDraft.interests).toEqual([]);
});
