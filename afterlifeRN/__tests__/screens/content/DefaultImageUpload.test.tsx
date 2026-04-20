import type { v_c2a674 } from '../../../src/types/clone';
import v_a6e1ad from '../../../src/screens/clone-creation/content/DefaultImageUpload';

test('validate fails without imageFile', () => {
  expect(v_a6e1ad.validate({ interests: [], coownerInvites: [] })).toBe(false);
});

test('validate passes with imageFile', () => {
  expect(
    v_a6e1ad.validate({
      interests: [],
      coownerInvites: [],
      imageFile: 'file://x.jpg',
    }),
  ).toBe(true);
});
