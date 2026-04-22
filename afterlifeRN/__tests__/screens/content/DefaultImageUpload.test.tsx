import type { CloneCreationDraft } from '../../../src/types/clone';
import DefaultImageUpload from '../../../src/screens/clone-creation/content/DefaultImageUpload';

test('validate fails without imageFile', () => {
  expect(DefaultImageUpload.validate({ interests: [], coownerInvites: [] })).toBe(false);
});

test('validate passes with imageFile', () => {
  expect(
    DefaultImageUpload.validate({
      interests: [],
      coownerInvites: [],
      imageFile: 'file://x.jpg',
    }),
  ).toBe(true);
});
