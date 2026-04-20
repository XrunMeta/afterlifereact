import { useCloneStore } from '../../src/stores/cloneStore';

beforeEach(() => {
  useCloneStore.getState().resetCreationDraft();
});

test('creationDraft starts with interests=[] and coownerInvites=[]', () => {
  const d = useCloneStore.getState().creationDraft;
  expect(d.interests).toEqual([]);
  expect(d.coownerInvites).toEqual([]);
});

test('setCreationDraft merges partial updates', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'memlow', name: '엄마' });
  const d = useCloneStore.getState().creationDraft;
  expect(d.cloneType).toBe('memlow');
  expect(d.name).toBe('엄마');
});

test('resetCreationDraft restores empty defaults', () => {
  useCloneStore.getState().setCreationDraft({ cloneType: 'memlow' });
  useCloneStore.getState().resetCreationDraft();
  expect(useCloneStore.getState().creationDraft.cloneType).toBeUndefined();
  expect(useCloneStore.getState().creationDraft.interests).toEqual([]);
});
