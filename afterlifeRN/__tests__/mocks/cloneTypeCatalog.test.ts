
import { v_aad223, v_c4c43f } from '../../src/mocks/cloneTypeCatalog';

test('CLONE_TYPES has only friend after T19', () => {
  expect(v_aad223.map((v_8d41d7) => v_8d41d7.id)).toEqual(['friend']);
});

test('friend has visibilityLocked=false and defaultVisibility=public', () => {
  const v_cfd22c = v_c4c43f('friend');
  expect(v_cfd22c.visibilityLocked).toBe(false);
  expect(v_cfd22c.defaultVisibility).toBe('public');
});
